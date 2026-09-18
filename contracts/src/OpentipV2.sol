// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title OpentipV2 — multi-token repo-level tip jar on Base
/// @notice Supports ETH, USDC, OAR, and any future ERC-20. Owner can add tokens without redeploying.
/// @dev Deployed on Base mainnet. Successor to Opentip v1 (USDC-only).
contract OpentipV2 is Ownable2Step, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------
    uint256 public constant MAX_FEE_BPS = 1000;       // 10% max fee cap
    uint256 public constant MAX_REPO_ID_LENGTH = 200;
    uint256 public constant MAX_TOKENS = 20;

    bytes32 private constant REGISTER_TYPEHASH =
        keccak256("Register(string repoId,address payoutAddress,uint256 expiry,uint256 nonce)");

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------
    address public treasuryAddress;
    uint256 public feeBps;
    address public registrarSigner;

    /// @notice Accepted token list
    address[] public tokenList;
    mapping(address => bool) public acceptedTokens;
    mapping(address => uint8) public tokenDecimals;

    /// @notice All tokens that were ever accepted (superset of tokenList, used by claimAll)
    address[] public everAcceptedTokens;
    mapping(address => bool) public wasEverAccepted;

    /// @notice Per-repo, per-token pending balances (address(0) = ETH)
    mapping(string => mapping(address => uint256)) private _pendingBalance;
    /// @notice Per-repo, per-token total tipped
    mapping(string => mapping(address => uint256)) private _totalTipped;
    /// @notice Per-repo tip count (all tokens combined)
    mapping(string => uint256) private _tipCount;
    mapping(string => address) private _payoutAddress;
    mapping(string => bool) private _isRegistered;

    /// @notice Per-token treasury fee balances
    mapping(address => uint256) public treasuryBalances;

    /// @notice Stray ETH sent outside receiveTipEth (tracked for sweep)
    uint256 public strayEth;

    /// @notice Deadline for adminMigrateRepo (unix timestamp)
    uint256 public migrationDeadline;

    /// @notice EIP-712 nonces for registration signatures
    mapping(uint256 => bool) public usedNonces;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event RepoRegistered(string repoId, address indexed payoutAddress, uint256 timestamp);
    event PayoutAddressUpdated(string repoId, address oldAddress, address indexed newAddress);
    event TipReceived(address indexed tipper, string repoId, address indexed token, uint256 amount, uint256 feeAmount, uint256 timestamp);
    event Claimed(string repoId, address indexed payoutAddress, address indexed token, uint256 amount, uint256 timestamp);
    event TreasuryWithdrawn(address indexed to, address indexed token, uint256 amount, uint256 timestamp);
    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event TreasuryAddressUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RegistrarSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event AdminPayoutReassigned(string repoId, address indexed oldAddress, address indexed newAddress, address indexed admin);
    event TokenAdded(address indexed token, uint8 decimals);
    event TokenRemoved(address indexed token);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------
    modifier onlyRegistered(string calldata repoId) {
        require(_isRegistered[repoId], "not registered");
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(
        address _treasury,
        address _owner,
        address _registrarSigner,
        uint256 _feeBps
    ) Ownable(_owner) EIP712("Opentip", "2") {
        require(_treasury != address(0), "treasury zero");
        require(_registrarSigner != address(0), "signer zero");
        require(_feeBps <= MAX_FEE_BPS, "fee too high");
        treasuryAddress = _treasury;
        registrarSigner = _registrarSigner;
        feeBps = _feeBps;
    }

    // -------------------------------------------------------------------------
    // Receive ETH
    // -------------------------------------------------------------------------
    receive() external payable {
        strayEth += msg.value;
    }

    // -------------------------------------------------------------------------
    // Token management (owner only)
    // -------------------------------------------------------------------------

    /// @notice Add an accepted ERC-20 token.
    function addToken(address token, uint8 decimals) external onlyOwner {
        require(token != address(0), "token zero");
        require(!acceptedTokens[token], "token exists");
        require(tokenList.length < MAX_TOKENS, "too many tokens");
        require(decimals > 0 && decimals <= 36, "bad decimals");

        acceptedTokens[token] = true;
        tokenDecimals[token] = decimals;
        tokenList.push(token);

        if (!wasEverAccepted[token]) {
            everAcceptedTokens.push(token);
            wasEverAccepted[token] = true;
        }

        emit TokenAdded(token, decimals);
    }

    /// @notice Remove an accepted token. Existing pending balances remain claimable via everAcceptedTokens.
    function removeToken(address token) external onlyOwner {
        require(acceptedTokens[token], "not accepted");

        acceptedTokens[token] = false;
        delete tokenDecimals[token];

        // Remove from tokenList only (everAcceptedTokens is untouched)
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }

        emit TokenRemoved(token);
    }

    // -------------------------------------------------------------------------
    // Registration (EIP-712)
    // -------------------------------------------------------------------------

    /// @notice Register a GitHub repo "owner/repo" and set payout wallet.
    function registerRepo(
        string calldata repoId,
        address payoutAddress,
        uint256 expiry,
        uint256 nonce,
        bytes calldata signature
    ) external whenNotPaused {
        bytes memory repoIdBytes = bytes(repoId);
        require(repoIdBytes.length > 0, "empty repoId");
        require(repoIdBytes.length <= MAX_REPO_ID_LENGTH, "repoId too long");
        require(_isValidRepoId(repoId), "bad repoId format");
        require(!_containsUppercase(repoId), "repoId must be lowercase");
        require(payoutAddress != address(0), "payout zero");
        require(!_isRegistered[repoId], "already registered");
        require(block.timestamp <= expiry, "signature expired");
        require(expiry <= block.timestamp + 10 minutes, "expiry too far");
        require(!usedNonces[nonce], "nonce used");

        bytes32 structHash = keccak256(
            abi.encode(REGISTER_TYPEHASH, keccak256(bytes(repoId)), payoutAddress, expiry, nonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == registrarSigner, "invalid signature");

        usedNonces[nonce] = true;
        _payoutAddress[repoId] = payoutAddress;
        _isRegistered[repoId] = true;

        emit RepoRegistered(repoId, payoutAddress, block.timestamp);
    }

    /// @notice Admin-only: register a repo without EIP-712 signature (for v1 migration). Disabled after migrationDeadline.
    function adminMigrateRepo(string calldata repoId, address payoutAddress) external onlyOwner {
        require(migrationDeadline == 0 || block.timestamp <= migrationDeadline, "migration closed");
        bytes memory repoIdBytes = bytes(repoId);
        require(repoIdBytes.length > 0, "empty repoId");
        require(repoIdBytes.length <= MAX_REPO_ID_LENGTH, "repoId too long");
        require(_isValidRepoId(repoId), "bad repoId format");
        require(payoutAddress != address(0), "payout zero");
        require(!_isRegistered[repoId], "already registered");

        _payoutAddress[repoId] = payoutAddress;
        _isRegistered[repoId] = true;

        emit RepoRegistered(repoId, payoutAddress, block.timestamp);
    }

    /// @notice Current payoutAddress rotates to new address.
    function updatePayoutAddress(string calldata repoId, address newAddress) external whenNotPaused onlyRegistered(repoId) {
        require(newAddress != address(0), "new zero");
        address old = _payoutAddress[repoId];
        require(msg.sender == old, "not payoutAddress");
        require(newAddress != old, "no change");

        _payoutAddress[repoId] = newAddress;
        emit PayoutAddressUpdated(repoId, old, newAddress);
    }

    // -------------------------------------------------------------------------
    // Tipping
    // -------------------------------------------------------------------------

    /// @notice Accept a raw ETH tip. Send ETH with the call.
    function receiveTipEth(string calldata repoId) external payable nonReentrant whenNotPaused onlyRegistered(repoId) {
        require(msg.value > 0, "zero ETH");

        uint256 feeAmount = (msg.value * feeBps) / 10000;
        uint256 net = msg.value - feeAmount;

        _pendingBalance[repoId][address(0)] += net;
        treasuryBalances[address(0)] += feeAmount;
        _totalTipped[repoId][address(0)] += msg.value;
        _tipCount[repoId] += 1;

        emit TipReceived(msg.sender, repoId, address(0), msg.value, feeAmount, block.timestamp);
    }

    /// @notice Accept an ERC-20 tip. Tipper must have approved this contract for `token`.
    function receiveTip(
        string calldata repoId,
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused onlyRegistered(repoId) {
        require(token != address(0), "use receiveTipEth for ETH");
        require(acceptedTokens[token], "token not accepted");
        require(amount > 0, "zero amount");

        uint256 feeAmount = (amount * feeBps) / 10000;
        uint256 net = amount - feeAmount;

        _pendingBalance[repoId][token] += net;
        treasuryBalances[token] += feeAmount;
        _totalTipped[repoId][token] += amount;
        _tipCount[repoId] += 1;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit TipReceived(msg.sender, repoId, token, amount, feeAmount, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Claiming
    // -------------------------------------------------------------------------

    /// @notice Claim all pending balances (all tokens) for a repo. One tx, everything.
    function claimAll(string calldata repoId) external nonReentrant whenNotPaused onlyRegistered(repoId) {
        require(msg.sender == _payoutAddress[repoId], "not payoutAddress");

        uint256 ethAmount = 0;

        for (uint256 i = 0; i < everAcceptedTokens.length; i++) {
            address token = everAcceptedTokens[i];
            uint256 amount = _pendingBalance[repoId][token];
            if (amount == 0) continue;

            _pendingBalance[repoId][token] = 0;
            IERC20(token).safeTransfer(msg.sender, amount);
            emit Claimed(repoId, msg.sender, token, amount, block.timestamp);
        }

        // Handle ETH last
        ethAmount = _pendingBalance[repoId][address(0)];
        if (ethAmount > 0) {
            _pendingBalance[repoId][address(0)] = 0;
            (bool ok, ) = payable(msg.sender).call{value: ethAmount}("");
            // If ETH transfer fails, credit it back (user can't receive ETH)
            if (!ok) {
                _pendingBalance[repoId][address(0)] = ethAmount;
                revert("ETH transfer failed");
            }
            emit Claimed(repoId, msg.sender, address(0), ethAmount, block.timestamp);
        }
    }

    // -------------------------------------------------------------------------
    // Admin functions
    // -------------------------------------------------------------------------

    /// @notice Emergency: reassign a repo's payout address if wallet key is lost.
    function adminReassignPayout(string calldata repoId, address newAddress) external onlyOwner {
        require(_isRegistered[repoId], "not registered");
        require(newAddress != address(0), "new zero");
        require(newAddress != _payoutAddress[repoId], "no change");

        address old = _payoutAddress[repoId];
        _payoutAddress[repoId] = newAddress;
        emit AdminPayoutReassigned(repoId, old, newAddress, msg.sender);
    }

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "fee too high");
        uint256 old = feeBps;
        feeBps = newFeeBps;
        emit FeeUpdated(old, newFeeBps);
    }

    function setTreasuryAddress(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "treasury zero");
        address old = treasuryAddress;
        treasuryAddress = newTreasury;
        emit TreasuryAddressUpdated(old, newTreasury);
    }

    /// @notice Withdraw accumulated fees for a specific token to treasuryAddress.
    function withdrawTreasury(address token, uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "amount zero");
        require(amount <= treasuryBalances[token], "exceeds balance");
        require(treasuryAddress != address(0), "treasury zero");

        treasuryBalances[token] -= amount;

        if (token == address(0)) {
            (bool ok, ) = payable(treasuryAddress).call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(treasuryAddress, amount);
        }

        emit TreasuryWithdrawn(treasuryAddress, token, amount, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setRegistrarSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "signer zero");
        address old = registrarSigner;
        registrarSigner = newSigner;
        emit RegistrarSignerUpdated(old, newSigner);
    }

    /// @notice Sweep stray ETH sent outside receiveTipEth to a specified address.
    function sweepStrayEth(address to) external onlyOwner nonReentrant {
        require(to != address(0), "zero address");
        uint256 amount = strayEth;
        require(amount > 0, "no stray eth");
        strayEth = 0;
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    /// @notice Set the deadline for adminMigrateRepo. Pass 0 to re-enable open-ended migration.
    function setMigrationDeadline(uint256 deadline) external onlyOwner {
        migrationDeadline = deadline;
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function isRegistered(string calldata repoId) external view returns (bool) {
        return _isRegistered[repoId];
    }

    function getPendingBalance(string calldata repoId, address token) external view returns (uint256) {
        return _pendingBalance[repoId][token];
    }

    function getPayoutAddress(string calldata repoId) external view returns (address) {
        return _payoutAddress[repoId];
    }

    function getTotalTipped(string calldata repoId, address token) external view returns (uint256) {
        return _totalTipped[repoId][token];
    }

    function getTotalTipCount(string calldata repoId) external view returns (uint256) {
        return _tipCount[repoId];
    }

    function getTokenList() external view returns (address[] memory) {
        return tokenList;
    }

    function getTokenCount() external view returns (uint256) {
        return tokenList.length;
    }

    function getEverAcceptedTokens() external view returns (address[] memory) {
        return everAcceptedTokens;
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------
    function _isValidRepoId(string calldata repoId) internal pure returns (bool) {
        bytes memory b = bytes(repoId);
        if (b.length < 3) return false;
        if (b[0] == bytes1("/")) return false;
        if (b[b.length - 1] == bytes1("/")) return false;
        uint256 slashCount = 0;
        uint256 slashPos = 0;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] == bytes1("/")) {
                slashCount++;
                slashPos = i;
                if (slashCount > 1) return false;
            }
        }
        if (slashCount != 1) return false;
        if (slashPos == 0 || slashPos == b.length - 1) return false;
        return true;
    }

    function _containsUppercase(string calldata repoId) internal pure returns (bool) {
        bytes memory b = bytes(repoId);
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] >= 0x41 && b[i] <= 0x5A) return true;
        }
        return false;
    }
}
