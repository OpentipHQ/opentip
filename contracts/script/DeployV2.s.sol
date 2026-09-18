// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {OpentipV2} from "../src/OpentipV2.sol";

/// @notice Deploy OpentipV2 with multi-token support.
/// Env: BASE_SEPOLIA_RPC / BASE_RPC, PRIVATE_KEY, ETHERSCAN_API_KEY, TREASURY_ADDRESS, REGISTRAR_SIGNER, FEE_BPS (default 500)
/// Token addresses are auto-configured per chain or via env.
contract DeployV2 is Script {
    function run() external {
        address treasury = vm.envOr("TREASURY_ADDRESS", address(0));
        address registrarSigner = vm.envOr("REGISTRAR_SIGNER", address(0));
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(500));
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        address deployer = vm.addr(privateKey);
        if (treasury == address(0)) {
            treasury = deployer;
            console.log("TREASURY_ADDRESS not set - using deployer as treasury:", treasury);
        }
        if (registrarSigner == address(0)) {
            registrarSigner = deployer;
            console.log("REGISTRAR_SIGNER not set - using deployer as registrar:", registrarSigner);
        }

        vm.startBroadcast(privateKey);
        OpentipV2 opentip = new OpentipV2(treasury, deployer, registrarSigner, feeBps);

        // Add accepted tokens per chain
        if (block.chainid == 8453) {
            // Base mainnet
            opentip.addToken(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, 6);  // USDC
            opentip.addToken(0x6F19171963b7095d039372d0962512259187E4e6, 18); // OAR
        } else if (block.chainid == 84532) {
            // Base Sepolia
            opentip.addToken(0x036CbD53842c5426634e7929541eC2318f3dCF7e, 6);  // USDC
            // OAR testnet address - use same as mainnet or a mock
            // opentip.addToken(0x..., 18);
        }
        vm.stopBroadcast();

        console.log("OpentipV2 deployed at:", address(opentip));
        console.log("  treasury:", treasury);
        console.log("  owner (deployer):", deployer);
        console.log("  registrarSigner:", registrarSigner);
        console.log("  feeBps:", feeBps);
        console.log("  chainId:", block.chainid);
        console.log("  tokenCount:", opentip.getTokenCount());
    }
}
