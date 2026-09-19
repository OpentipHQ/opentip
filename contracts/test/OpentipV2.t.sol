// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {OpentipV2} from "../src/OpentipV2.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    uint8 private _decimals;
    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) { _decimals = decimals_; }
    function decimals() public view override returns (uint8) { return _decimals; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract OpentipV2Test is Test {
    OpentipV2 v2;
    MockToken usdc;
    MockToken oar;

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
        usdc = new MockToken("Mock USDC", "mUSDC", 6);
        oar = new MockToken("Oarcoin", "OAR", 18);
        owner = vm.addr(ownerPrivateKey);
        registrar = vm.addr(registrarPrivateKey);
        v2 = new OpentipV2(treasury, owner, registrar, 500);
        // Add USDC and OAR as accepted tokens (must call as owner)
        vm.prank(owner);
        v2.addToken(address(usdc), 6);
        vm.prank(owner);
        v2.addToken(address(oar), 18);
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
            v2.DOMAIN_SEPARATOR(),
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
        v2.registerRepo(repoId, payoutAddress, expiry, nonce, sig);
    }

    // ==================== Registration ====================

    function test_RegisterHappy() public {
        _registerWithPermit("torvalds/linux", alice, block.timestamp + 5 minutes, 0);
        assertTrue(v2.isRegistered("torvalds/linux"));
        assertEq(v2.getPayoutAddress("torvalds/linux"), alice);
    }

    function test_RegisterDuplicateReverts() public {
        _registerWithPermit("a/b", alice, block.timestamp + 5 minutes, 0);
        bytes memory sig = _signRegisterPermit("a/b", bob, block.timestamp + 5 minutes, 1);
        vm.expectRevert(bytes("already registered"));
        v2.registerRepo("a/b", bob, block.timestamp + 5 minutes, 1, sig);
    }

    function test_RegisterBadFormat() public {
        bytes memory sig;
        sig = _signRegisterPermit("", alice, block.timestamp + 5 minutes, 0);
        vm.expectRevert(bytes("empty repoId"));
        v2.registerRepo("", alice, block.timestamp + 5 minutes, 0, sig);

        sig = _signRegisterPermit("nonslash", alice, block.timestamp + 5 minutes, 1);
        vm.expectRevert(bytes("bad repoId format"));
        v2.registerRepo("nonslash", alice, block.timestamp + 5 minutes, 1, sig);
    }

    function test_RegisterUppercaseReverts() public {
        bytes memory sig = _signRegisterPermit("Torvalds/Linux", alice, block.timestamp + 5 minutes, 0);
        vm.expectRevert(bytes("repoId must be lowercase"));
        v2.registerRepo("Torvalds/Linux", alice, block.timestamp + 5 minutes, 0, sig);
    }

    // --- Admin migration ---
    function test_AdminMigrateRepo() public {
        vm.prank(owner); v2.adminMigrateRepo("legacy/repo", alice);
        assertTrue(v2.isRegistered("legacy/repo"));
        assertEq(v2.getPayoutAddress("legacy/repo"), alice);
    }

    function test_AdminMigrateRepoNonOwnerReverts() public {
        vm.prank(alice); vm.expectRevert();
        v2.adminMigrateRepo("legacy/repo", alice);
    }

    function test_AdminMigrateRepoAlreadyRegisteredReverts() public {
        vm.prank(owner); v2.adminMigrateRepo("legacy/repo", alice);
        vm.prank(owner); vm.expectRevert(bytes("already registered"));
        v2.adminMigrateRepo("legacy/repo", bob);
    }

    // ==================== Token management ====================

    function test_AddToken() public {
        MockToken newToken = new MockToken("New", "NEW", 18);
        vm.prank(owner); v2.addToken(address(newToken), 18);
        assertTrue(v2.acceptedTokens(address(newToken)));
        assertEq(v2.tokenDecimals(address(newToken)), 18);
        assertEq(v2.getTokenCount(), 3);
    }

    function test_AddTokenDuplicateReverts() public {
        vm.prank(owner);
        vm.expectRevert(bytes("token exists"));
        v2.addToken(address(usdc), 6);
    }

    function test_AddTokenZeroReverts() public {
        vm.prank(owner);
        vm.expectRevert(bytes("token zero"));
        v2.addToken(address(0), 18);
    }

    function test_RemoveToken() public {
        vm.prank(owner); v2.removeToken(address(oar));
        assertFalse(v2.acceptedTokens(address(oar)));
        assertEq(v2.getTokenCount(), 1);
    }

    function test_RemoveTokenNonOwnerReverts() public {
        vm.prank(alice); vm.expectRevert();
        v2.removeToken(address(oar));
    }

    function test_RemoveTokenNotAcceptedReverts() public {
        MockToken other = new MockToken("Other", "OTH", 18);
        vm.prank(owner);
        vm.expectRevert(bytes("not accepted"));
        v2.removeToken(address(other));
    }

    // ==================== ETH tips ====================

    function test_ReceiveTipEth() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        vm.deal(tipper, 1 ether);
        vm.prank(tipper); v2.receiveTipEth{value: 1 ether}("o/r");

        assertEq(v2.getPendingBalance("o/r", address(0)), 0.95 ether);
        assertEq(v2.treasuryBalances(address(0)), 0.05 ether);
        assertEq(v2.getTotalTipped("o/r", address(0)), 1 ether);
        assertEq(v2.getTotalTipCount("o/r"), 1);
    }

    function test_ReceiveTipEthZeroReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        vm.expectRevert(bytes("zero ETH"));
        vm.prank(tipper); v2.receiveTipEth{value: 0}("o/r");
    }

    function test_ReceiveTipEthNotRegisteredReverts() public {
        vm.deal(tipper, 1 ether);
        vm.expectRevert(bytes("not registered"));
        vm.prank(tipper); v2.receiveTipEth{value: 1 ether}("x/y");
    }

    // ==================== ERC-20 tips ====================

    function test_ReceiveTipUSDC() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        usdc.mint(tipper, 10e6);
        vm.prank(tipper); usdc.approve(address(v2), 10e6);
        vm.prank(tipper); v2.receiveTip("o/r", address(usdc), 10e6);

        assertEq(v2.getPendingBalance("o/r", address(usdc)), 9.5e6);
        assertEq(v2.treasuryBalances(address(usdc)), 0.5e6);
        assertEq(v2.getTotalTipped("o/r", address(usdc)), 10e6);
        assertEq(v2.getTotalTipCount("o/r"), 1);
    }

    function test_ReceiveTipOAR() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        oar.mint(tipper, 100e18);
        vm.prank(tipper); oar.approve(address(v2), 100e18);
        vm.prank(tipper); v2.receiveTip("o/r", address(oar), 100e18);

        assertEq(v2.getPendingBalance("o/r", address(oar)), 95e18);
        assertEq(v2.treasuryBalances(address(oar)), 5e18);
        assertEq(v2.getTotalTipped("o/r", address(oar)), 100e18);
    }

    function test_ReceiveTipTokenNotAcceptedReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        MockToken other = new MockToken("Other", "OTH", 18);
        other.mint(tipper, 100e18);
        vm.prank(tipper); other.approve(address(v2), 100e18);
        vm.expectRevert(bytes("token not accepted"));
        vm.prank(tipper); v2.receiveTip("o/r", address(other), 100e18);
    }

    function test_ReceiveTipETHAddressReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        vm.expectRevert(bytes("use receiveTipEth for ETH"));
        vm.prank(tipper); v2.receiveTip("o/r", address(0), 1e18);
    }

    // ==================== Claim All ====================

    function test_ClaimAllUSDC() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        usdc.mint(tipper, 10e6);
        vm.prank(tipper); usdc.approve(address(v2), 10e6);
        vm.prank(tipper); v2.receiveTip("o/r", address(usdc), 10e6);

        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice); v2.claimAll("o/r");
        assertEq(usdc.balanceOf(alice) - before, 9.5e6);
        assertEq(v2.getPendingBalance("o/r", address(usdc)), 0);
    }

    function test_ClaimAllMultipleTokens() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);

        // Tip in USDC
        usdc.mint(tipper, 10e6);
        vm.prank(tipper); usdc.approve(address(v2), 10e6);
        vm.prank(tipper); v2.receiveTip("o/r", address(usdc), 10e6);

        // Tip in OAR
        oar.mint(tipper, 100e18);
        vm.prank(tipper); oar.approve(address(v2), 100e18);
        vm.prank(tipper); v2.receiveTip("o/r", address(oar), 100e18);

        // Tip in ETH
        vm.deal(tipper, 1 ether);
        vm.prank(tipper); v2.receiveTipEth{value: 1 ether}("o/r");

        uint256 usdcBefore = usdc.balanceOf(alice);
        uint256 oarBefore = oar.balanceOf(alice);
        uint256 ethBefore = alice.balance;

        vm.prank(alice); v2.claimAll("o/r");

        assertEq(usdc.balanceOf(alice) - usdcBefore, 9.5e6);
        assertEq(oar.balanceOf(alice) - oarBefore, 95e18);
        assertEq(alice.balance - ethBefore, 0.95 ether);

        assertEq(v2.getPendingBalance("o/r", address(usdc)), 0);
        assertEq(v2.getPendingBalance("o/r", address(oar)), 0);
        assertEq(v2.getPendingBalance("o/r", address(0)), 0);
    }

    function test_ClaimAllNotPayoutReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        usdc.mint(tipper, 2e6);
        vm.prank(tipper); usdc.approve(address(v2), 2e6);
        vm.prank(tipper); v2.receiveTip("o/r", address(usdc), 2e6);

        vm.prank(bob); vm.expectRevert(bytes("not payoutAddress"));
        v2.claimAll("o/r");
    }

    function test_ClaimAllNothingStillWorks() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        // No tips — claimAll should just do nothing (no revert since there's something to iterate)
        vm.prank(alice); v2.claimAll("o/r");
        // Should not revert
    }

    // ==================== Treasury ====================

    function test_WithdrawTreasuryUSDC() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        usdc.mint(tipper, 10e6);
        vm.prank(tipper); usdc.approve(address(v2), 10e6);
        vm.prank(tipper); v2.receiveTip("o/r", address(usdc), 10e6);

        uint256 before = usdc.balanceOf(treasury);
        vm.prank(owner); v2.withdrawTreasury(address(usdc), 0.5e6);
        assertEq(usdc.balanceOf(treasury) - before, 0.5e6);
        assertEq(v2.treasuryBalances(address(usdc)), 0);
    }

    function test_WithdrawTreasuryETH() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        vm.deal(tipper, 1 ether);
        vm.prank(tipper); v2.receiveTipEth{value: 1 ether}("o/r");

        uint256 before = treasury.balance;
        vm.prank(owner); v2.withdrawTreasury(address(0), 0.05 ether);
        assertEq(treasury.balance - before, 0.05 ether);
        assertEq(v2.treasuryBalances(address(0)), 0);
    }

    function test_WithdrawTreasuryExceedsReverts() public {
        vm.prank(owner);
        vm.expectRevert(bytes("exceeds balance"));
        v2.withdrawTreasury(address(usdc), 1);
    }

    function test_WithdrawTreasuryOnlyOwner() public {
        vm.prank(alice); vm.expectRevert();
        v2.withdrawTreasury(address(usdc), 1);
    }

    // ==================== Admin: set fee, treasury, registrar ====================

    function test_SetFeeBps() public {
        vm.prank(owner); v2.setFeeBps(100);
        assertEq(v2.feeBps(), 100);
    }

    function test_SetFeeBpsTooHighReverts() public {
        vm.prank(owner);
        vm.expectRevert(bytes("fee too high"));
        v2.setFeeBps(1001);
    }

    function test_SetTreasuryAddress() public {
        vm.prank(owner); v2.setTreasuryAddress(alice);
        assertEq(v2.treasuryAddress(), alice);
    }

    function test_SetRegistrarSigner() public {
        vm.prank(owner); v2.setRegistrarSigner(bob);
        assertEq(v2.registrarSigner(), bob);
    }

    // ==================== Admin reassign payout ====================

    function test_AdminReassignPayout() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        vm.prank(owner); v2.adminReassignPayout("o/r", bob);
        assertEq(v2.getPayoutAddress("o/r"), bob);
    }

    function test_AdminReassignNonOwnerReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        vm.prank(alice); vm.expectRevert();
        v2.adminReassignPayout("o/r", bob);
    }

    // ==================== Pausable ====================

    function test_PauseBlocksTipAndClaim() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        usdc.mint(tipper, 2e6);
        vm.prank(tipper); usdc.approve(address(v2), 2e6);
        vm.prank(tipper); v2.receiveTip("o/r", address(usdc), 1e6);

        vm.prank(owner); v2.pause();

        usdc.mint(tipper, 1e6);
        vm.prank(tipper); usdc.approve(address(v2), 1e6);
        vm.prank(tipper); vm.expectRevert();
        v2.receiveTip("o/r", address(usdc), 1e6);

        vm.prank(alice); vm.expectRevert();
        v2.claimAll("o/r");

        vm.prank(owner); v2.unpause();
        vm.prank(tipper); v2.receiveTip("o/r", address(usdc), 1e6);
    }

    // ==================== Update payout address ====================

    function test_UpdatePayoutAddress() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        vm.prank(alice); v2.updatePayoutAddress("o/r", bob);
        assertEq(v2.getPayoutAddress("o/r"), bob);
    }

    function test_UpdatePayoutAddressNotPayoutReverts() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);
        vm.prank(bob); vm.expectRevert(bytes("not payoutAddress"));
        v2.updatePayoutAddress("o/r", bob);
    }

    // ==================== View functions ====================

    function test_GetTokenList() public {
        address[] memory tokens = v2.getTokenList();
        assertEq(tokens.length, 2);
        assertEq(tokens[0], address(usdc));
        assertEq(tokens[1], address(oar));
    }

    function test_GetTokenCount() public {
        assertEq(v2.getTokenCount(), 2);
    }

    // ==================== Multi-tip tip count ====================

    function test_TipCountAcrossTokens() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);

        usdc.mint(tipper, 10e6);
        vm.prank(tipper); usdc.approve(address(v2), 10e6);
        vm.prank(tipper); v2.receiveTip("o/r", address(usdc), 10e6);

        oar.mint(tipper, 100e18);
        vm.prank(tipper); oar.approve(address(v2), 100e18);
        vm.prank(tipper); v2.receiveTip("o/r", address(oar), 100e18);

        vm.deal(tipper, 1 ether);
        vm.prank(tipper); v2.receiveTipEth{value: 1 ether}("o/r");

        assertEq(v2.getTotalTipCount("o/r"), 3);
    }

    // ==================== Claim after token removal (everAcceptedTokens) ====================

    function test_ClaimAfterTokenRemoved() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);

        // Tip in OAR
        oar.mint(tipper, 100e18);
        vm.prank(tipper); oar.approve(address(v2), 100e18);
        vm.prank(tipper); v2.receiveTip("o/r", address(oar), 100e18);

        // Remove OAR from accepted tokens
        vm.prank(owner); v2.removeToken(address(oar));
        assertFalse(v2.acceptedTokens(address(oar)));

        // Claim still works because everAcceptedTokens still contains OAR
        uint256 before = oar.balanceOf(alice);
        vm.prank(alice); v2.claimAll("o/r");
        assertEq(oar.balanceOf(alice) - before, 95e18);
        assertEq(v2.getPendingBalance("o/r", address(oar)), 0);
    }

    // ==================== Stray ETH sweep ====================

    function test_SweepStrayEth() public {
        // Send ETH directly to contract (not through receiveTipEth)
        vm.deal(tipper, 1 ether);
        vm.prank(tipper);
        (bool ok,) = address(v2).call{value: 1 ether}("");
        assertTrue(ok);
        assertEq(v2.strayEth(), 1 ether);

        uint256 before = owner.balance;
        vm.prank(owner); v2.sweepStrayEth(owner);
        assertEq(v2.strayEth(), 0);
        assertEq(owner.balance - before, 1 ether);
    }

    function test_SweepStrayEthNonOwnerReverts() public {
        vm.deal(tipper, 1 ether);
        vm.prank(tipper);
        (bool ok,) = address(v2).call{value: 1 ether}("");
        assertTrue(ok);

        vm.prank(alice); vm.expectRevert();
        v2.sweepStrayEth(alice);
    }

    function test_SweepStrayEthNothingReverts() public {
        vm.prank(owner);
        vm.expectRevert(bytes("no stray eth"));
        v2.sweepStrayEth(owner);
    }

    function test_SweepStrayEthZeroAddressReverts() public {
        vm.deal(tipper, 1 ether);
        vm.prank(tipper);
        (bool ok,) = address(v2).call{value: 1 ether}("");
        assertTrue(ok);

        vm.prank(owner);
        vm.expectRevert(bytes("zero address"));
        v2.sweepStrayEth(address(0));
    }

    // ==================== Migration deadline ====================

    function test_AdminMigrateRepoAfterDeadlineReverts() public {
        vm.warp(100);
        vm.prank(owner); v2.setMigrationDeadline(50);
        vm.expectRevert(bytes("migration closed"));
        vm.prank(owner); v2.adminMigrateRepo("legacy/repo", alice);
    }

    function test_AdminMigrateRepoWithZeroDeadlineWorks() public {
        // Default deadline is 0, which means open-ended
        assertEq(v2.migrationDeadline(), 0);
        vm.prank(owner); v2.adminMigrateRepo("legacy/repo", alice);
        assertTrue(v2.isRegistered("legacy/repo"));
    }

    // ==================== Expiry bound ====================

    function test_ExpiryTooFarReverts() public {
        bytes memory sig = _signRegisterPermit("new/repo", alice, block.timestamp + 11 minutes, 0);
        vm.expectRevert(bytes("expiry too far"));
        v2.registerRepo("new/repo", alice, block.timestamp + 11 minutes, 0, sig);
    }

    function test_ExpiryWithinLimitSucceeds() public {
        bytes memory sig = _signRegisterPermit("new/repo", alice, block.timestamp + 5 minutes, 0);
        v2.registerRepo("new/repo", alice, block.timestamp + 5 minutes, 0, sig);
        assertTrue(v2.isRegistered("new/repo"));
    }

    // ==================== Stray ETH tracked separately from tips ====================

    function test_StrayEthNotTrackedAsTip() public {
        _registerWithPermit("o/r", alice, block.timestamp + 5 minutes, 0);

        // Send ETH directly (stray)
        vm.deal(tipper, 1 ether);
        vm.prank(tipper);
        (bool ok,) = address(v2).call{value: 1 ether}("");
        assertTrue(ok);

        // Stray ETH goes to strayEth, not to pending balance
        assertEq(v2.strayEth(), 1 ether);
        assertEq(v2.getPendingBalance("o/r", address(0)), 0);
    }

    // ==================== everAcceptedTokens not duplicated ====================

    function test_EverAcceptedTokensNotDuplicated() public {
        MockToken newToken = new MockToken("New", "NEW", 18);
        vm.prank(owner); v2.addToken(address(newToken), 18);
        vm.prank(owner); v2.removeToken(address(newToken));
        vm.prank(owner); v2.addToken(address(newToken), 18);

        // everAcceptedTokens should have each token only once
        address[] memory ever = v2.getEverAcceptedTokens();
        uint256 count = 0;
        for (uint256 i = 0; i < ever.length; i++) {
            if (ever[i] == address(newToken)) count++;
        }
        assertEq(count, 1);
    }

    // ==================== adminMigrateRepo uppercase reverts ====================

    function test_AdminMigrateRepoUppercaseReverts() public {
        vm.prank(owner);
        vm.expectRevert(bytes("repoId must be lowercase"));
        v2.adminMigrateRepo("Legacy/Repo", alice);
    }

    // ==================== everAcceptedTokens cap ====================

    function test_AddTokenCapsEverAcceptedTokens() public {
        // setUp already has 2 tokens in both tokenList and everAcceptedTokens
        // Remove both to make room in tokenList
        vm.prank(owner); v2.removeToken(address(usdc));
        vm.prank(owner); v2.removeToken(address(oar));

        // Add 18 new unique tokens → tokenList grows to 18, everAcceptedTokens grows to 20
        for (uint256 i = 0; i < 18; i++) {
            MockToken t = new MockToken(string(abi.encodePacked("T", bytes1(uint8(65 + i)))), "T", 18);
            vm.prank(owner); v2.addToken(address(t), 18);
        }
        assertEq(v2.getEverAcceptedTokens().length, 20);
        assertEq(v2.getTokenCount(), 18);

        // Remove all from tokenList to make room
        for (uint256 i = 0; i < 18; i++) {
            address[] memory tokens = v2.getTokenList();
            vm.prank(owner); v2.removeToken(tokens[0]);
        }
        assertEq(v2.getTokenCount(), 0);

        // 21st unique token should revert on everAcceptedTokens cap
        MockToken overflow = new MockToken("Overflow", "OFW", 18);
        vm.prank(owner);
        vm.expectRevert(bytes("too many ever-accepted tokens"));
        v2.addToken(address(overflow), 18);
    }

    // ==================== sweepStrayEth emits event ====================

    function test_SweepStrayEthEmitsEvent() public {
        vm.deal(tipper, 1 ether);
        vm.prank(tipper);
        (bool ok,) = address(v2).call{value: 1 ether}("");
        assertTrue(ok);

        vm.expectEmit(true, false, false, true);
        emit OpentipV2.StrayEthSwept(owner, 1 ether, block.timestamp);
        vm.prank(owner); v2.sweepStrayEth(owner);
    }

    // ==================== setMigrationDeadline emits event ====================

    function test_SetMigrationDeadlineEmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit OpentipV2.MigrationDeadlineUpdated(0, 1000, block.timestamp);
        vm.prank(owner); v2.setMigrationDeadline(1000);

        vm.expectEmit(false, false, false, true);
        emit OpentipV2.MigrationDeadlineUpdated(1000, 0, block.timestamp);
        vm.prank(owner); v2.setMigrationDeadline(0);
    }
}
