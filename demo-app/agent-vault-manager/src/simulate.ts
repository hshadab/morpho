/**
 * Simulation Script for Agentic Vault Manager Demo
 *
 * Demonstrates the full flow:
 * 1. Owner sets up spending policy
 * 2. Owner authorizes agent
 * 3. Agent analyzes markets and makes decisions
 * 4. Agent generates zkML proofs for each action
 * 5. Transactions execute through MorphoSpendingGate
 */

import {
  MorphoSpendingProofsClient,
  createCombinedPolicy,
  MorphoOperation,
  type Address,
} from '@hshadab/morpho-spending-proofs';

import { AgentVaultManager } from './agent';
import { STRATEGIES, type AgentVaultConfig } from './types';

// Demo configuration
const DEMO_CONFIG = {
  proverUrl: 'http://localhost:3000', // Mock prover
  chainId: 1,
  gateAddress: '0x1234567890123456789012345678901234567890' as Address,
  morphoAddress: '0x2345678901234567890123456789012345678901' as Address,
  ownerAddress: '0x3456789012345678901234567890123456789012' as Address,
  agentAddress: '0x4567890123456789012345678901234567890123' as Address,
  markets: [
    '0xUSDC_MARKET_ADDRESS_HERE' as Address,
    '0xWETH_MARKET_ADDRESS_HERE' as Address,
  ],
};

/**
 * Mock signer for demo
 */
const mockSigner = {
  signMessage: async (message: string): Promise<string> => {
    // In production, this would use actual wallet signing
    console.log('   Signing proof commitment...');
    await new Promise((r) => setTimeout(r, 500));
    return `0x${'ab'.repeat(65)}`;
  },
};

/**
 * Mock prover service
 */
class MockProverServer {
  private requestCount = 0;

  async handleProofRequest(request: any): Promise<{ proof: string }> {
    this.requestCount++;
    console.log(`\n   [Prover] Generating proof #${this.requestCount}...`);
    console.log(`   [Prover] Policy hash: ${request.policy_hash?.slice(0, 18)}...`);
    console.log(`   [Prover] Operation: ${request.operation_type}`);
    console.log(`   [Prover] Amount: $${Number(request.amount) / 1e6}`);

    // Simulate proof generation time (4-12 seconds in real system)
    await new Promise((r) => setTimeout(r, 2000));

    // Generate mock ~48KB proof
    const proofSize = 48 * 1024;
    const proof = '0x' + 'ff'.repeat(proofSize);

    console.log(`   [Prover] Proof generated: ${proofSize} bytes`);
    return { proof };
  }
}

/**
 * Run the demo simulation
 */
async function runSimulation() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       MORPHO zkML SPENDING PROOFS - AGENTIC VAULT MANAGER     ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();

  // Step 1: Owner sets up spending policy
  console.log('📋 STEP 1: Owner defines spending policy');
  console.log('─────────────────────────────────────────');

  const policy = createCombinedPolicy({
    dailyLimitUSD: 10_000,
    maxSingleTxUSD: 5_000,
    maxLTVPercent: 70,
    minHealthFactor: 1.2,
    allowedMarkets: DEMO_CONFIG.markets,
  });

  console.log(`   Daily limit: $10,000`);
  console.log(`   Max single tx: $5,000`);
  console.log(`   Max LTV: 70%`);
  console.log(`   Min health factor: 1.2`);
  console.log(`   Allowed markets: ${DEMO_CONFIG.markets.length}`);
  console.log();

  // Step 2: Owner authorizes agent
  console.log('🔑 STEP 2: Owner authorizes AI agent');
  console.log('─────────────────────────────────────');

  console.log(`   Owner: ${DEMO_CONFIG.ownerAddress.slice(0, 18)}...`);
  console.log(`   Agent: ${DEMO_CONFIG.agentAddress.slice(0, 18)}...`);
  console.log(`   Registering policy on MorphoSpendingGate...`);
  await new Promise((r) => setTimeout(r, 1000));
  console.log(`   ✅ Agent authorized with policy`);
  console.log();

  // Step 3: Initialize agent
  console.log('🤖 STEP 3: Initializing AI agent');
  console.log('─────────────────────────────────');

  const strategy = STRATEGIES.moderateLeverage;
  console.log(`   Strategy: ${strategy.name}`);
  console.log(`   Description: ${strategy.description}`);
  console.log(`   Target LTV: ${strategy.targetLTV}%`);
  console.log(`   Min Supply APY: ${strategy.minSupplyAPY}%`);
  console.log(`   Max Borrow APY: ${strategy.maxBorrowAPY}%`);
  console.log();

  // Create mock client that uses mock prover
  const mockProver = new MockProverServer();

  // Override fetch for demo
  const originalFetch = global.fetch;
  (global as any).fetch = async (url: string, options: any) => {
    if (url.includes('/prove')) {
      const request = JSON.parse(options.body);
      const result = await mockProver.handleProofRequest(request);
      return {
        ok: true,
        json: async () => result,
      } as Response;
    }
    return originalFetch(url, options);
  };

  const client = new MorphoSpendingProofsClient({
    proverUrl: DEMO_CONFIG.proverUrl,
    chainId: DEMO_CONFIG.chainId,
    gateAddress: DEMO_CONFIG.gateAddress,
    morphoAddress: DEMO_CONFIG.morphoAddress,
  });

  const agentConfig: AgentVaultConfig = {
    agentAddress: DEMO_CONFIG.agentAddress,
    ownerAddress: DEMO_CONFIG.ownerAddress,
    policy,
    strategy,
    targetMarkets: DEMO_CONFIG.markets,
    minOperationInterval: 5, // 5 seconds for demo
    maxOperationsPerDay: 100,
  };

  const agent = new AgentVaultManager(client, mockSigner, agentConfig);

  // Step 4: Simulate agent operations
  console.log('📊 STEP 4: Agent analyzing markets and executing');
  console.log('─────────────────────────────────────────────────');

  // Simulate a few cycles
  const scenarios = [
    {
      name: 'Supply Opportunity',
      description: 'High supply APY detected in USDC market',
      operation: MorphoOperation.SUPPLY,
      amount: BigInt(5000 * 1e6),
    },
    {
      name: 'Leverage Position',
      description: 'Adding leverage to increase yield',
      operation: MorphoOperation.BORROW,
      amount: BigInt(2000 * 1e6),
    },
    {
      name: 'Rebalance',
      description: 'LTV drifted above target, deleveraging',
      operation: MorphoOperation.REPAY,
      amount: BigInt(500 * 1e6),
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\n┌─────────────────────────────────────────────────┐`);
    console.log(`│ Scenario: ${scenario.name.padEnd(38)}│`);
    console.log(`└─────────────────────────────────────────────────┘`);
    console.log(`   ${scenario.description}`);
    console.log();

    // Generate proof
    console.log('🔐 Generating zkML spending proof...');
    const startTime = Date.now();

    try {
      const proof = await client.generateProof(
        {
          policy,
          operation: scenario.operation,
          amount: scenario.amount,
          market: DEMO_CONFIG.markets[0],
          agent: DEMO_CONFIG.agentAddress,
        },
        mockSigner,
        (status, progress) => {
          const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
          process.stdout.write(`\r   [${bar}] ${progress}% - ${status}     `);
        },
      );

      const elapsed = Date.now() - startTime;
      console.log(`\n\n   ✅ Proof generated in ${(elapsed / 1000).toFixed(1)}s`);
      console.log(`   📦 Proof size: ${(proof.proof.length / 2 / 1024).toFixed(1)} KB`);
      console.log(`   🔗 Policy hash: ${proof.policyHash.slice(0, 18)}...`);
      console.log(`   📝 Public inputs: ${proof.publicInputs.length} values`);

      // Simulate on-chain verification
      console.log('\n   📤 Submitting to MorphoSpendingGate...');
      await new Promise((r) => setTimeout(r, 1500));

      console.log('   ✅ Proof verified on-chain');
      console.log('   ✅ Policy constraints validated');
      console.log('   ✅ Operation executed on Morpho Blue');

      const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      console.log(`   📜 Tx hash: ${txHash.slice(0, 18)}...`);
    } catch (error) {
      console.error(`\n   ❌ Error: ${error}`);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                         DEMO SUMMARY                          ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log('   ✅ Owner defined spending policy with limits');
  console.log('   ✅ Agent authorized with zkML proof requirements');
  console.log('   ✅ Agent executed 3 operations with valid proofs');
  console.log('   ✅ All operations verified against policy constraints');
  console.log();
  console.log('   Key benefits demonstrated:');
  console.log('   • Trustless autonomous DeFi - no blind trust needed');
  console.log('   • Policy compliance verified cryptographically');
  console.log('   • ~48KB proofs generated in 4-12 seconds');
  console.log('   • On-chain verification in ~200K gas');
  console.log();
  console.log('═══════════════════════════════════════════════════════════════');

  // Restore fetch
  (global as any).fetch = originalFetch;
}

// Run simulation
runSimulation().catch(console.error);
