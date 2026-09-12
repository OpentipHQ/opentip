// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {Opentip} from "../src/Opentip.sol";

/// @notice Parameterized deploy for Base Sepolia → Base mainnet via env/config only.
/// Env: BASE_SEPOLIA_RPC / BASE_RPC, PRIVATE_KEY, ETHERSCAN_API_KEY, USDC_ADDRESS, TREASURY_ADDRESS, REGISTRAR_SIGNER, FEE_BPS (default 500)
contract Deploy is Script {
    function run() external {
        address usdc = vm.envOr("USDC_ADDRESS", address(0));
        address treasury = vm.envOr("TREASURY_ADDRESS", address(0));
        address registrarSigner = vm.envOr("REGISTRAR_SIGNER", address(0));
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(500));

        // Fallback USDC per chain if env not set
        if (usdc == address(0)) {
            if (block.chainid == 84532) {
                // Circle Base Sepolia USDC faucet
                usdc = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
            } else if (block.chainid == 8453) {
                usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
            } else {
                revert("USDC_ADDRESS required for this chainid");
            }
        }

        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        if (treasury == address(0)) {
            treasury = deployer;
            console.log("TREASURY_ADDRESS not set - using deployer as treasury:", treasury);
        }
        if (registrarSigner == address(0)) {
            registrarSigner = deployer;
            console.log("REGISTRAR_SIGNER not set - using deployer as registrar:", registrarSigner);
        }

        vm.startBroadcast();
        Opentip opentip = new Opentip(usdc, treasury, deployer, registrarSigner, feeBps);
        vm.stopBroadcast();

        console.log("Opentip deployed at:", address(opentip));
        console.log("  usdc:", usdc);
        console.log("  treasury:", treasury);
        console.log("  owner (deployer):", deployer);
        console.log("  registrarSigner:", registrarSigner);
        console.log("  feeBps:", feeBps);
        console.log("  chainId:", block.chainid);
    }
}
