// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {Opentip} from "../src/Opentip.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint8 private _decimals;
    constructor() ERC20("Mock USDC", "mUSDC") { _decimals = 6; }
    function decimals() public view override returns (uint8) { return _decimals; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract OpentipTest is Test {
    Opentip opentip;
    MockUSDC usdc;
    address owner = address(0xA11CE);
    address treasury = address(0xBEEF);
    address alice = address(0xA1);
    address bob = address(0xB1);
    address tipper = address(0xC1);

    function setUp() public {
        usdc = new MockUSDC();
        opentip = new Opentip(address(usdc), treasury, owner, 500);
    }

    // --- registerRepo ---
    function test_RegisterHappy() public {
        vm.prank(alice);
        opentip.registerRepo("torvalds/linux", alice);
        assertTrue(opentip.isRegistered("torvalds/linux"));
        assertEq(opentip.getPayoutAddress("torvalds/linux"), alice);
    }

    function test_RegisterDuplicateReverts() public {
        vm.prank(alice); opentip.registerRepo("a/b", alice);
        vm.prank(bob); vm.expectRevert(bytes("already registered"));
        opentip.registerRepo("a/b", bob);
    }

    function test_RegisterBadFormat() public {
        vm.expectRevert(bytes("empty repoId")); opentip.registerRepo("", alice);
        vm.expectRevert(bytes("bad repoId format")); opentip.registerRepo("nonslash", alice);
        vm.expectRevert(bytes("bad repoId format")); opentip.registerRepo("/owner/repo", alice);
        vm.expectRevert(bytes("bad repoId format")); opentip.registerRepo("owner/repo/", alice);
        vm.expectRevert(bytes("bad repoId format")); opentip.registerRepo("a/b/c", alice);
    }

    function test_RegisterZeroPayoutReverts() public {
        vm.expectRevert(bytes("payout zero")); opentip.registerRepo("a/b", address(0));
    }

    // --- receiveTip ---
    function _registerAndFundTipper(string memory repoId, uint256 tipAmount) internal {
        vm.prank(alice); opentip.registerRepo(repoId, alice);
        usdc.mint(tipper, tipAmount);
        vm.prank(tipper); usdc.approve(address(opentip), tipAmount);
    }

    function test_ReceiveTipSplitsFee() public {
        _registerAndFundTipper("o/r", 10e6); // $10
        vm.prank(tipper); opentip.receiveTip("o/r", 10e6);
        // 5% fee = 0.5 USDC, net 9.5
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
        // fee 50000, net 950000
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
        vm.prank(alice); opentip.registerRepo("o/r", alice);
        vm.prank(alice); vm.expectRevert(bytes("nothing to claim"));
        opentip.claim("o/r");
    }

    function test_UpdatePayoutThenClaimNewAddress() public {
        _registerAndFundTipper("o/r", 2e6);
        vm.prank(tipper); opentip.receiveTip("o/r", 2e6);
        vm.prank(alice); opentip.updatePayoutAddress("o/r", bob);
        // old cannot claim
        vm.prank(alice); vm.expectRevert(bytes("not payoutAddress"));
        opentip.claim("o/r");
        // new can
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
    function test_SetFeeBps() public {
        vm.prank(owner); opentip.setFeeBps(1000);
        assertEq(opentip.getFeeBps(), 1000);
        vm.prank(owner); vm.expectRevert(bytes("fee too high"));
        opentip.setFeeBps(1001);
    }

    function test_SetTreasury() public {
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
        // tip before pause
        vm.prank(tipper); opentip.receiveTip("o/r", 1e6);
        vm.prank(owner); opentip.pause();
        // tip blocked
        usdc.mint(tipper, 1e6); vm.prank(tipper); usdc.approve(address(opentip), 1e6);
        vm.prank(tipper); vm.expectRevert();
        opentip.receiveTip("o/r", 1e6);
        // claim blocked
        vm.prank(alice); vm.expectRevert();
        opentip.claim("o/r");
        // unpause restores
        vm.prank(owner); opentip.unpause();
        vm.prank(tipper); opentip.receiveTip("o/r", 1e6);
    }
}
