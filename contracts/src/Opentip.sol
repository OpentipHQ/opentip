// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Opentip — repo-level tip jar on Base (USDC only, pull payments)
/// @notice Tips are always credited as USDC (6 decimals). ETH is swapped to USDC offchain via Relay before calling receiveTip.
/// @dev Chain: Base Sepolia testnet first, then Base mainnet. No cross-chain logic in v1.
contract Opentip is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------
    IERC20 public immutable usdc;

    /// @notice Treasury address where fees are withdrawn to (mutable → Gnosis Safe migration)
    address public treasuryAddress;

    /// @notice Platform fee in basis points (500 = 5%)
    uint256 public feeBps;

    /// @notice Minimum tip in USDC base units (6 decimals) — $1 = 1_000_000
    uint256 public constant MIN_TIP = 1e6;

    /// @notice Max fee cap to prevent owner rug (10% = 1000 bps)
    uint256 public constant MAX_FEE_BPS = 1000;

    /// @notice Unwithdrawn fees sitting in contract
    uint256 public treasuryBalance;

    mapping(string => address) private _payoutAddress;
    mapping(string => uint256) private _pendingBalance;
    mapping(string => uint256) private _totalTipped;
    mapping(string => uint256) private _tipCount;
    mapping(string => bool) private _isRegistered;

    // -------------------------------------------------------------------------
    // Events (index tipper/payoutAddress for offchain indexer)
    // -------------------------------------------------------------------------
    event RepoRegistered(string repoId, address indexed payoutAddress, uint256 timestamp);
    event PayoutAddressUpdated(string repoId, address oldAddress, address indexed newAddress);
    event TipReceived(address indexed tipper, string repoId, uint256 usdcAmount, uint256 feeAmount, uint256 timestamp);
    event Claimed(string repoId, address indexed payoutAddress, uint256 amount, uint256 timestamp);
    event TreasuryWithdrawn(address indexed to, uint256 amount, uint256 timestamp);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(address _usdc, address _treasury, address _owner, uint256 _feeBps) Ownable(_owner) {
        require(_usdc != address(0), "usdc zero");
        require(_treasury != address(0), "treasury zero");
        require(_feeBps <= MAX_FEE_BPS, "fee too high");
        usdc = IERC20(_usdc);
        treasuryAddress = _treasury;
        feeBps = _feeBps;
    }

    // -------------------------------------------------------------------------
    // Write functions
    // -------------------------------------------------------------------------

    /// @notice Register a GitHub repo "owner/repo" and set payout wallet.
    /// @dev App layer gates this via GitHub OAuth verify-ownership; contract only does format + uniqueness checks.
    function registerRepo(string calldata repoId, address payoutAddress) external whenNotPaused {
        require(bytes(repoId).length > 0, "empty repoId");
        require(_isValidRepoId(repoId), "bad repoId format");
        require(payoutAddress != address(0), "payout zero");
        require(!_isRegistered[repoId], "already registered");

        _payoutAddress[repoId] = payoutAddress;
        _isRegistered[repoId] = true;

        emit RepoRegistered(repoId, payoutAddress, block.timestamp);
    }

    /// @notice Only current payoutAddress can rotate to new address.
    function updatePayoutAddress(string calldata repoId, address newAddress) external {
        require(_isRegistered[repoId], "not registered");
        require(newAddress != address(0), "new zero");
        address old = _payoutAddress[repoId];
        require(msg.sender == old, "not payoutAddress");
        require(newAddress != old, "no change");

        _payoutAddress[repoId] = newAddress;
        emit PayoutAddressUpdated(repoId, old, newAddress);
    }

    /// @notice Called after Relay swap (if ETH) or directly for USDC. Pulls USDC from tipper.
    /// @dev Tipper must have approved usdc for this contract beforehand.
    function receiveTip(string calldata repoId, uint256 usdcAmount) external whenNotPaused {
        require(_isRegistered[repoId], "not registered");
        require(usdcAmount >= MIN_TIP, "below $1 minimum");

        // pull USDC first (reverts if allowance/balance insufficient)
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        uint256 feeAmount = (usdcAmount * feeBps) / 10000;
        uint256 net = usdcAmount - feeAmount;

        _pendingBalance[repoId] += net;
        treasuryBalance += feeAmount;
        _totalTipped[repoId] += usdcAmount;
        _tipCount[repoId] += 1;

        emit TipReceived(msg.sender, repoId, usdcAmount, feeAmount, block.timestamp);
    }

    /// @notice Repo owner claims full pending balance. Pull payment.
    function claim(string calldata repoId) external nonReentrant whenNotPaused {
        require(_isRegistered[repoId], "not registered");
        require(msg.sender == _payoutAddress[repoId], "not payoutAddress");
        uint256 amount = _pendingBalance[repoId];
        require(amount > 0, "nothing to claim");

        _pendingBalance[repoId] = 0;
        usdc.safeTransfer(msg.sender, amount);

        emit Claimed(repoId, msg.sender, amount, block.timestamp);
    }

    // ---- Owner-only ----

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "fee too high");
        feeBps = newFeeBps;
    }

    function setTreasuryAddress(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "treasury zero");
        treasuryAddress = newTreasury;
    }

    /// @notice Withdraw accumulated fees to treasuryAddress.
    function withdrawTreasury(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "amount zero");
        require(amount <= treasuryBalance, "exceeds balance");
        require(treasuryAddress != address(0), "treasury zero");

        treasuryBalance -= amount;
        usdc.safeTransfer(treasuryAddress, amount);

        emit TreasuryWithdrawn(treasuryAddress, amount, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // -------------------------------------------------------------------------
    // Read functions (views)
    // -------------------------------------------------------------------------
    function getPendingBalance(string calldata repoId) external view returns (uint256) {
        return _pendingBalance[repoId];
    }

    function getPayoutAddress(string calldata repoId) external view returns (address) {
        return _payoutAddress[repoId];
    }

    function getTotalTipped(string calldata repoId) external view returns (uint256) {
        return _totalTipped[repoId];
    }

    function getTotalTipCount(string calldata repoId) external view returns (uint256) {
        return _tipCount[repoId];
    }

    function getFeeBps() external view returns (uint256) {
        return feeBps;
    }

    function getTreasuryBalance() external view returns (uint256) {
        return treasuryBalance;
    }

    function isRegistered(string calldata repoId) external view returns (bool) {
        return _isRegistered[repoId];
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------
    /// @dev Validates "owner/repo" — contains exactly one '/', neither part empty, no leading/trailing '/'.
    function _isValidRepoId(string calldata repoId) internal pure returns (bool) {
        bytes memory b = bytes(repoId);
        if (b.length < 3) return false; // minimal "a/b"
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
        // ensure neither side empty (already covered by slashCount==1 + length checks, but be explicit)
        if (slashPos == 0 || slashPos == b.length - 1) return false;
        return true;
    }
}
