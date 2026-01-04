// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MorphoSpendingGate} from "../contracts/MorphoSpendingGate.sol";
import {MockJoltAtlasVerifier} from "../contracts/mocks/MockJoltAtlasVerifier.sol";
import {MockMorphoBlue} from "../contracts/mocks/MockMorphoBlue.sol";

/**
 * @title Deploy Script for Arc Testnet
 * @notice Deploys MorphoSpendingGate with mock contracts for testing
 *
 * Usage:
 *   forge script script/Deploy.s.sol:DeployArcTestnet \
 *     --rpc-url https://rpc.testnet.arc.network \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 */
contract DeployArcTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("  NovaNet zkML Spending Proofs Deployment  ");
        console.log("  Target: Arc Testnet (Chain ID: 5042002)  ");
        console.log("===========================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Morpho Blue (for testing - replace with real address on mainnet)
        console.log("Deploying MockMorphoBlue...");
        MockMorphoBlue mockMorpho = new MockMorphoBlue();
        console.log("  MockMorphoBlue:", address(mockMorpho));

        // 2. Deploy Mock Jolt-Atlas Verifier (for testing - replace with real verifier)
        console.log("Deploying MockJoltAtlasVerifier...");
        MockJoltAtlasVerifier mockVerifier = new MockJoltAtlasVerifier();
        console.log("  MockJoltAtlasVerifier:", address(mockVerifier));

        // 3. Deploy MorphoSpendingGate
        console.log("Deploying MorphoSpendingGate...");
        MorphoSpendingGate gate = new MorphoSpendingGate(
            address(mockMorpho),
            address(mockVerifier)
        );
        console.log("  MorphoSpendingGate:", address(gate));

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("           DEPLOYMENT COMPLETE             ");
        console.log("===========================================");
        console.log("");
        console.log("Deployed Contracts:");
        console.log("  MockMorphoBlue:        ", address(mockMorpho));
        console.log("  MockJoltAtlasVerifier: ", address(mockVerifier));
        console.log("  MorphoSpendingGate:    ", address(gate));
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Update demo-ui/src/lib/networks.ts with addresses");
        console.log("  2. Verify contracts on arcscan.app");
        console.log("  3. Register a test spending policy");
        console.log("");
    }
}

/**
 * @title Deploy with existing Morpho address
 * @notice Use this when Morpho Blue is already deployed on Arc
 */
contract DeployWithMorpho is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address morphoBlue = vm.envAddress("MORPHO_BLUE_ADDRESS");

        console.log("Deploying to Arc Testnet with existing Morpho...");
        console.log("Morpho Blue:", morphoBlue);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy verifier
        MockJoltAtlasVerifier verifier = new MockJoltAtlasVerifier();
        console.log("MockJoltAtlasVerifier:", address(verifier));

        // Deploy gate
        MorphoSpendingGate gate = new MorphoSpendingGate(
            morphoBlue,
            address(verifier)
        );
        console.log("MorphoSpendingGate:", address(gate));

        vm.stopBroadcast();
    }
}
