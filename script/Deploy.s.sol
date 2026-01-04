// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MorphoSpendingGate} from "../contracts/MorphoSpendingGate.sol";
import {MockMorphoBlue} from "../contracts/mocks/MockMorphoBlue.sol";

/**
 * @title Deploy Script for Arc Testnet
 * @notice Deploys MorphoSpendingGate with off-chain zkML verification
 *
 * Architecture:
 *   - zkML proof verification happens OFF-CHAIN via NovaNet prover
 *   - On-chain contract only validates signatures + policy constraints
 *   - This reduces gas costs and simplifies deployment
 *
 * Usage:
 *   export PRIVATE_KEY=0x...
 *   forge script script/Deploy.s.sol:DeployArcTestnet \
 *     --rpc-url https://rpc.testnet.arc.network \
 *     --broadcast -vvvv
 */
contract DeployArcTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("================================================");
        console.log("  NovaNet zkML Spending Proofs - Arc Testnet    ");
        console.log("  Off-chain verification architecture           ");
        console.log("================================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Morpho Blue (for testing)
        console.log("1. Deploying MockMorphoBlue...");
        MockMorphoBlue mockMorpho = new MockMorphoBlue();
        console.log("   Address:", address(mockMorpho));

        // 2. Deploy MorphoSpendingGate (no verifier needed - off-chain verification)
        console.log("");
        console.log("2. Deploying MorphoSpendingGate...");
        console.log("   (zkML verification happens off-chain via NovaNet)");
        MorphoSpendingGate gate = new MorphoSpendingGate(address(mockMorpho));
        console.log("   Address:", address(gate));

        vm.stopBroadcast();

        console.log("");
        console.log("================================================");
        console.log("            DEPLOYMENT COMPLETE                 ");
        console.log("================================================");
        console.log("");
        console.log("Contracts:");
        console.log("  MockMorphoBlue:      ", address(mockMorpho));
        console.log("  MorphoSpendingGate:  ", address(gate));
        console.log("");
        console.log("Architecture:");
        console.log("  - Proof generation: NovaNet Jolt-Atlas (off-chain)");
        console.log("  - Proof verification: NovaNet prover (off-chain)");
        console.log("  - Signature validation: MorphoSpendingGate (on-chain)");
        console.log("  - Policy enforcement: MorphoSpendingGate (on-chain)");
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Update demo-ui/src/lib/networks.ts with addresses");
        console.log("  2. Register a spending policy via registerPolicy()");
        console.log("  3. Authorize an agent via authorizeAgent()");
        console.log("");
    }
}

/**
 * @title Deploy with existing Morpho Blue
 * @notice Use when Morpho Blue is already deployed on the target chain
 */
contract DeployWithMorpho is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address morphoBlue = vm.envAddress("MORPHO_BLUE_ADDRESS");

        console.log("Deploying MorphoSpendingGate with existing Morpho...");
        console.log("Morpho Blue:", morphoBlue);

        vm.startBroadcast(deployerPrivateKey);

        MorphoSpendingGate gate = new MorphoSpendingGate(morphoBlue);
        console.log("MorphoSpendingGate:", address(gate));

        vm.stopBroadcast();
    }
}
