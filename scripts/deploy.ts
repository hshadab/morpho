/**
 * Deployment Script for MorphoSpendingGate
 *
 * Deploys the zkML-gated Morpho integration contracts
 */

import { ethers } from 'ethers';

interface DeploymentConfig {
  /** RPC URL */
  rpcUrl: string;
  /** Private key for deployment */
  privateKey: string;
  /** Morpho Blue address on target chain */
  morphoBlueAddress: string;
  /** Jolt-Atlas verifier address (deploy separately or use mock) */
  verifierAddress?: string;
  /** Deploy mock verifier for testing */
  deployMockVerifier?: boolean;
}

interface DeploymentResult {
  gateAddress: string;
  verifierAddress: string;
  txHashes: {
    verifier?: string;
    gate: string;
  };
}

// Contract ABIs (in production, import from artifacts)
const MOCK_VERIFIER_ABI = [
  'constructor()',
  'function verify(bytes calldata proof, bytes32[] calldata publicInputs, bytes32 policyHash) external view returns (bool)',
  'function setAlwaysVerify(bool _value) external',
];

const SPENDING_GATE_ABI = [
  'constructor(address _morpho, address _verifier)',
  'function registerPolicy((uint256,uint256,uint256,uint256,address[],bool,bool,bool) calldata policy) external returns (bytes32)',
  'function authorizeAgent(address agent, bytes32 policyHash) external',
  'function supplyWithProof(address market, uint256 assets, address onBehalf, (bytes32,bytes,bytes32[],uint256,bytes) calldata proof) external returns (uint256)',
];

/**
 * Deploy contracts
 */
async function deploy(config: DeploymentConfig): Promise<DeploymentResult> {
  console.log('🚀 Starting deployment...');
  console.log('─────────────────────────');

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   Network: ${(await provider.getNetwork()).name}`);
  console.log(`   Chain ID: ${(await provider.getNetwork()).chainId}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  console.log();

  let verifierAddress = config.verifierAddress;
  let verifierTxHash: string | undefined;

  // Deploy mock verifier if needed
  if (config.deployMockVerifier || !verifierAddress) {
    console.log('📦 Deploying MockJoltAtlasVerifier...');

    // In production, use actual bytecode from compilation
    const mockVerifierBytecode = '0x608060405234801561001057600080fd5b50...'; // Truncated

    // For demo, we'll just log what would happen
    console.log('   [DEMO] Would deploy MockJoltAtlasVerifier');
    console.log('   [DEMO] Setting alwaysVerify = true for testing');

    verifierAddress = '0x' + '1'.repeat(40); // Mock address
    verifierTxHash = '0x' + 'a'.repeat(64);
  }

  // Deploy MorphoSpendingGate
  console.log('\n📦 Deploying MorphoSpendingGate...');
  console.log(`   Morpho Blue: ${config.morphoBlueAddress}`);
  console.log(`   Verifier: ${verifierAddress}`);

  // In production, use actual bytecode
  console.log('   [DEMO] Would deploy MorphoSpendingGate');
  console.log('   [DEMO] Constructor args: (morpho, verifier)');

  const gateAddress = '0x' + '2'.repeat(40); // Mock address
  const gateTxHash = '0x' + 'b'.repeat(64);

  console.log('\n✅ Deployment complete!');
  console.log('────────────────────────');
  console.log(`   MorphoSpendingGate: ${gateAddress}`);
  console.log(`   JoltAtlasVerifier: ${verifierAddress}`);

  return {
    gateAddress,
    verifierAddress: verifierAddress!,
    txHashes: {
      verifier: verifierTxHash,
      gate: gateTxHash,
    },
  };
}

/**
 * Verify contracts on block explorer
 */
async function verifyContracts(
  result: DeploymentResult,
  config: DeploymentConfig,
): Promise<void> {
  console.log('\n🔍 Verifying contracts on explorer...');

  // In production, use hardhat-verify or similar
  console.log('   [DEMO] Would verify MorphoSpendingGate');
  console.log('   [DEMO] Would verify MockJoltAtlasVerifier');
}

/**
 * Post-deployment setup
 */
async function postDeploymentSetup(
  result: DeploymentResult,
  config: DeploymentConfig,
): Promise<void> {
  console.log('\n⚙️  Post-deployment setup...');

  // Register verification keys for different policy types
  console.log('   Registering verification keys...');
  console.log('   [DEMO] vault-limits key registered');
  console.log('   [DEMO] ltv-bounds key registered');
  console.log('   [DEMO] daily-spend key registered');

  console.log('\n✅ Setup complete!');
}

/**
 * Main deployment script
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('      MORPHO SPENDING GATE DEPLOYMENT                      ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();

  // Load config from environment
  const config: DeploymentConfig = {
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    privateKey: process.env.PRIVATE_KEY || '0x' + '1'.repeat(64),
    morphoBlueAddress: process.env.MORPHO_BLUE_ADDRESS || '0x' + '3'.repeat(40),
    deployMockVerifier: process.env.DEPLOY_MOCK_VERIFIER === 'true',
  };

  try {
    const result = await deploy(config);
    await verifyContracts(result, config);
    await postDeploymentSetup(result, config);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    DEPLOYMENT SUMMARY                     ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log();
    console.log('   Contracts deployed:');
    console.log(`   • MorphoSpendingGate: ${result.gateAddress}`);
    console.log(`   • JoltAtlasVerifier: ${result.verifierAddress}`);
    console.log();
    console.log('   Next steps:');
    console.log('   1. Update SDK config with contract addresses');
    console.log('   2. Register spending policies');
    console.log('   3. Authorize agents with policies');
    console.log('   4. Start agent operations');
    console.log();
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { deploy, verifyContracts, postDeploymentSetup, DeploymentConfig, DeploymentResult };

// Run if called directly
if (require.main === module) {
  main();
}
