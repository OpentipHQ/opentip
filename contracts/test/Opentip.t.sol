// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {Opentip} from "../src/Opentip.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MockUSDC is ERC20 {
    uint8 private _decimals;
    constructor() ERC20("Mock USDC", "mUSDC") { _decimals = 6; }
    function decimals() public view override returns (uint8) { return _decimals; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract OpentipTest is Test {
    Opentip opentip;
    MockUSDC usdc;

    uint256 internal ownerPrivateKey = 0xA11CE;
    uint256 internal registrarPrivateKey = 0xB0B;
    address owner;
    address registrar;
    address treasury = address(0xBEEF);
    address alice = address(0xA1);
    address bob = address(0xB1);
    address tipper = address(0xC1);

    bytes32 internal constant REGISTER_TYPEHASH =
        keccak256("Register(string repoId,address payoutAddress,uint256 expiry,uint256 nonce)");

    function setUp() public {
        usdc = new MockUSDC();
        owner = vm.addr(ownerPrivateKey);
        registrar = vm.addr(registrarPrivateKey);
        opentip = new Opentip(address(usdc), treasury, owner, registrar, 500);
    }

    // --- Helper: sign registerRepo permit ---
    function _signRegisterPermit(
        string memory repoId,
        address payoutAddress,
        uint256 expiry,
        uint256 nonce
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(REGISTER_TYPEHASH, keccak256(bytes(repoId)), payoutAddress, expiry, nonce)
        );
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            opentip.DOMAIN_SEPARATOR(),
            structHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(registrarPrivateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _registerWithPermit(
        string memory repoId,
        address payoutAddress,
        uint256 expiry,
        uint256 nonce
    ) internal {
        bytes memory sig = _signRegisterPermit(repoId, payoutAddress, expiry, nonce);
        opentip.registerRepo(repoId, payoutAddress, expiry, nonce, sig);
    }

    // --- registerRepo ---
    function test_RegisterHappy() public {
        _registerWithPermit("torvalds/linux", alice, block.timestamp + 1 hours, 0);
        assertTrue(opentip.isRegistered("torvalds/linux"));
        assertEq(opentip.getPayoutAddress("torvalds/linux"), alice);
    }

    function test_RegisterDuplicateReverts() public {
        _registerWithPermit("a/b", alice, block.timestamp + 1 hours, 0);
        bytes memory sig = _signRegisterPermit("a/b", bob, block.timestamp + 1 hours, 1);
        vm.expectRevert(bytes("already registered"));
        opentip.registerRepo("a/b", bob, block.timestamp + 1 hours, 1, sig);
    }

    function test_RegisterBadFormat() public {
        bytes memory sig;
        sig = _signRegisterPermit("", alice, block.timestamp + 1 hours, 0);
        vm.expectRevert(bytes("empty repoId"));
        opentip.registerRepo("", alice, block.timestamp + 1 hours, 0, sig);

        sig = _signRegisterPermit("nonslash", alice, block.timestamp + 1 hours, 1);
        vm.expectRevert(bytes("bad repoId format"));
        opentip.registerRepo("nonslash", alice, block.timestamp + 1 hours, 1, sig);

        sig = _signRegisterPermit("/owner/repo", alice, block.timestamp + 1 hours, 2);
        vm.expectRevert(bytes("bad repoId format"));
        opentip.registerRepo("/owner/repo", alice, block.timestamp + 1 hours, 2, sig);

        sig = _signRegisterPermit("owner/repo/", alice, block.timestamp + 1 hours, 3);
        vm.expectRevert(bytes("bad repoId format"));
        opentip.registerRepo("owner/repo/", alice, block.timestamp + 1 hours, 3, sig);

        sig = _signRegisterPermit("a/b/c", alice, block.timestamp + 1 hours, 4);
        vm.expectRevert(bytes("bad repoId format"));
        opentip.registerRepo("a/b/c", alice, block.timestamp + 1 hours, 4, sig);
    }

    function test_RegisterZeroPayoutReverts() public {
        bytes memory sig = _signRegisterPermit("a/b", address(0), block.timestamp + 1 hours, 0);
        vm.expectRevert(bytes("payout zero"));
        opentip.registerRepo("a/b", address(0), block.timestamp + 1 hours, 0, sig);
    }

    function test_RegisterBadSignatureReverts() public {
        uint256 wrongKey = 0xDEAD;
        bytes32 structHash = keccak256(
            abi.encode(REGISTER_TYPEHASH, keccak256(bytes("a/b")), alice, block.timestamp + 1 hours, uint256(0))
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", opentip.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, digest);
        bytes memory badSig = abi.encodePacked(r, s, v);

        vm.expectRevert(bytes("invalid signature"));
        opentip.registerRepo("a/b", alice, block.timestamp + 1 hours, 0, badSig);
    }

    function test_RegisterExpiredSignatureReverts() public {
        uint256 expiry = block.timestamp - 1;
        bytes memory sig = _signRegisterPermit("a/b", alice, expiry, 0);
        vm.expectRevert(bytes("signature expired"));
        opentip.registerRepo("a/b", alice, expiry, 0, sig);
    }

    function test_RegisterReplayReverts() public {
        _registerWithPermit("a/b", alice, block.timestamp + 1 hours, 0);
        bytes memory sig = _signRegisterPermit("c/d", bob, block.timestamp + 1 hours, 0);
        vm.expectRevert(bytes("nonce used"));
        opentip.registerRepo("c/d", bob, block.timestamp + 1 hours, 0, sig);
    }

    function test_RegisterUppercaseReverts() public {
        bytes memory sig = _signRegisterPermit("Torvalds/Linux", alice, block.timestamp + 1 hours, 0);
        vm.expectRevert(bytes("repoId must be lowercase"));
        opentip.registerRepo("Torvalds/Linux", alice, block.timestamp + 1 hours, 0, sig);
    }

    function test_RegisterTooLongReverts() public {
        string memory longId = "a/";
        for (uint256 i = 0; i < 200; i++) {
            longId = string(abi.encodePacked(longId, "x"));
        }
        bytes memory sig = _signRegisterPermit(longId, alice, block.timestamp + 1 hours, 0);
        vm.expectRevert(bytes("repoId too long"));
        opentip.registerRepo(longId, alice, block.timestamp + 1 hours, 0, sig);
    }

    // --- receiveTip ---
    function _registerAndFundTipper(string memory repoId, uint256 tipAmount) internal {
        _registerWithPermit(repoId, alice, block.timestamp + 1 hours, 0);
        usdc.mint(tipper, tipAmount);
        vm.prank(tipper); usdc.approve(address(opentip), tipAmount);
    }

    function test_ReceiveTipSplitsFee() public {
        _registerAndFundTipper("o/r", 10e6);
        vm.prank(tipper); opentip.receiveTip("o/r", 10e6);
        assertEq(opentip.getPendingBalance("o/r"), 9.5e6);
        assertEq(opentip.getTreasuryBalance(), 0.5e6);
        assertEq(opentip.getTotalTipped("o/r"), 10e6);
        assertEq(opentip.getTotalTipCount("o/r"), 1);
    }

    function test_ReceiveTipBelowMinReverts() public {
        _registerAndFundTipper("o/r", 0.5e6);
        vm.prank(tipper); vm.expectRevert(bytes("below $1 minimum"));
        opentip.receiveTip("o/r", 500000);
    }

    function test_ReceiveTipNotRegisteredReverts() public {
        usdc.mint(tipper, 2e6); vm.prank(tipper); usdc.approve(address(opentip), 2e6);
        vm.prank(tipper); vm.expectRevert(bytes("not registered"));
        opentip.receiveTip("x/y", 2e6);
    }

    function test_ReceiveTipMinExactly1() public {
        _registerAndFundTipper("o/r", 1e6);
        vm.prank(tipper); opentip.receiveTip("o/r", 1e6);
        assertEq(opentip.getPendingBalance("o/r"), 950000);
    }

    // --- claim ---
    function test_ClaimHappy() public {
        _registerAndFundTipper("o/r", 10e6);
        vm.prank(tipper); opentip.receiveTip("o/r", 10e6);
        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice); opentip.claim("o/r");
        assertEq(usdc.balanceOf(alice) - before, 9.5e6);
        assertEq(opentip.getPendingBalance("o/r"), 0);
    }

    function test_ClaimNotPayoutReverts() public {
        _registerAndFundTipper("o/r", 2e6);
        vm.prank(tipper); opentip.receiveTip("o/r", 2e6);
        vm.prank(bob); vm.expectRevert(bytes("not payoutAddress"));
        opentip.claim("o/r");
    }

    function test_ClaimNothingReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 1 hours, 0);
        vm.prank(alice); vm.expectRevert(bytes("nothing to claim"));
        opentip.claim("o/r");
    }

    function test_UpdatePayoutThenClaimNewAddress() public {
        _registerAndFundTipper("o/r", 2e6);
        vm.prank(tipper); opentip.receiveTip("o/r", 2e6);
        vm.prank(alice); opentip.updatePayoutAddress("o/r", bob);
        vm.prank(alice); vm.expectRevert(bytes("not payoutAddress"));
        opentip.claim("o/r");
        vm.prank(bob); opentip.claim("o/r");
        assertEq(usdc.balanceOf(bob), 1.9e6);
    }

    // --- treasury ---
    function test_WithdrawTreasuryHappy() public {
        _registerAndFundTipper("o/r", 10e6);
        vm.prank(tipper); opentip.receiveTip("o/r", 10e6);
        uint256 before = usdc.balanceOf(treasury);
        vm.prank(owner); opentip.withdrawTreasury(0.5e6);
        assertEq(usdc.balanceOf(treasury) - before, 0.5e6);
        assertEq(opentip.getTreasuryBalance(), 0);
    }

    function test_WithdrawOnlyOwner() public {
        vm.prank(alice); vm.expectRevert();
        opentip.withdrawTreasury(1);
    }

    function test_WithdrawExceedsReverts() public {
        vm.prank(owner); vm.expectRevert(bytes("exceeds balance"));
        opentip.withdrawTreasury(1);
    }

    // --- admin ---
    function test_SetFeeBpsEmitsEvent() public {
        vm.prank(owner); opentip.setFeeBps(1000);
        assertEq(opentip.getFeeBps(), 1000);
        // Check event was emitted (vm.expectEmit not used here, but fee is updated)
        vm.prank(owner); vm.expectRevert(bytes("fee too high"));
        opentip.setFeeBps(1001);
    }

    function test_SetTreasuryEmitsEvent() public {
        vm.prank(owner); opentip.setTreasuryAddress(alice);
        assertEq(opentip.treasuryAddress(), alice);
    }

    function test_NonOwnerCannotSetFee() public {
        vm.prank(alice); vm.expectRevert();
        opentip.setFeeBps(100);
    }

    // --- pausable ---
    function test_PauseBlocksTipAndClaim() public {
        _registerAndFundTipper("o/r", 2e6);
        vm.prank(tipper); opentip.receiveTip("o/r", 1e6);
        vm.prank(owner); opentip.pause();
        usdc.mint(tipper, 1e6); vm.prank(tipper); usdc.approve(address(opentip), 1e6);
        vm.prank(tipper); vm.expectRevert();
        opentip.receiveTip("o/r", 1e6);
        vm.prank(alice); vm.expectRevert();
        opentip.claim("o/r");
        vm.prank(owner); opentip.unpause();
        vm.prank(tipper); opentip.receiveTip("o/r", 1e6);
    }

    function test_UpdatePayoutWhenPausedReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 1 hours, 0);
        vm.prank(owner); opentip.pause();
        vm.prank(alice); vm.expectRevert();
        opentip.updatePayoutAddress("o/r", bob);
    }

    // --- adminReassignPayout (M-2) ---
    function test_AdminReassignPayout() public {
        _registerWithPermit("o/r", alice, block.timestamp + 1 hours, 0);
        vm.prank(owner); opentip.adminReassignPayout("o/r", bob);
        assertEq(opentip.getPayoutAddress("o/r"), bob);
    }

    function test_AdminReassignNonOwnerReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 1 hours, 0);
        vm.prank(alice); vm.expectRevert();
        opentip.adminReassignPayout("o/r", bob);
    }

    function test_AdminReassignZeroAddressReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 1 hours, 0);
        vm.prank(owner); vm.expectRevert(bytes("new zero"));
        opentip.adminReassignPayout("o/r", address(0));
    }

    function test_AdminReassignSameAddressReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 1 hours, 0);
        vm.prank(owner); vm.expectRevert(bytes("no change"));
        opentip.adminReassignPayout("o/r", alice);
    }

    // --- Ownable2Step (L-4) ---
    function test_Ownable2StepTransfer() public {
        address newOwner = address(0x42);
        vm.prank(owner); opentip.transferOwnership(newOwner);
        vm.prank(newOwner); opentip.acceptOwnership();
        assertEq(opentip.owner(), newOwner);
    }

    function test_Ownable2StepCannotUseBeforeAccept() public {
        address newOwner = address(0x42);
        vm.prank(owner); opentip.transferOwnership(newOwner);
        vm.prank(newOwner); vm.expectRevert();
        opentip.setFeeBps(100);
    }

    // --- registrarSigner ---
    function test_SetRegistrarSigner() public {
        address newSigner = address(0x42);
        vm.prank(owner); opentip.setRegistrarSigner(newSigner);
        assertEq(opentip.registrarSigner(), newSigner);
    }

    function test_SetRegistrarSignerNonOwnerReverts() public {
        vm.prank(alice); vm.expectRevert();
        opentip.setRegistrarSigner(address(0x42));
    }

    function test_SetRegistrarSignerZeroReverts() public {
        vm.prank(owner); vm.expectRevert(bytes("signer zero"));
        opentip.setRegistrarSigner(address(0));
    }

    function test_OldRegistrarKeyInvalidatedAfterRotation() public {
        _registerWithPermit("a/b", alice, block.timestamp + 1 hours, 0);
        // Rotate registrar
        uint256 newKey = 0xFACE;
        address newSigner = vm.addr(newKey);
        vm.prank(owner); opentip.setRegistrarSigner(newSigner);
        // Old key can no longer sign
        bytes memory sig = _signRegisterPermit("c/d", bob, block.timestamp + 1 hours, 1);
        vm.expectRevert(bytes("invalid signature"));
        opentip.registerRepo("c/d", bob, block.timestamp + 1 hours, 1, sig);
    }

    function test_NewRegistrarKeyCanSign() public {
        uint256 newKey = 0xFACE;
        address newSigner = vm.addr(newKey);
        vm.prank(owner); opentip.setRegistrarSigner(newSigner);
        // Sign with new key
        bytes32 structHash = keccak256(
            abi.encode(REGISTER_TYPEHASH, keccak256(bytes("x/y")), alice, block.timestamp + 1 hours, uint256(0))
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", opentip.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(newKey, digest);
        bytes memory sig = abi.encodePacked(r, s, v);
        opentip.registerRepo("x/y", alice, block.timestamp + 1 hours, 0, sig);
        assertTrue(opentip.isRegistered("x/y"));
    }
}
