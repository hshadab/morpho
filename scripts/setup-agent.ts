/**
 * Agent Setup Script
 *
 * Configures a new agent with spending policy and authorization
 */

import {
  createCombinedPolicy,
  AGENT_POLICY_PRESETS,
  validatePolicy,
  computePolicyHash,
  type SpendingPolicy,
  type Address,
} from '@hshadab/morpho-spending-proofs';

interface AgentSetupConfig {
  /** Owner address (who authorizes the agent) */
  ownerAddress: Address;
  /** Agent address (the AI agent's wallet) */
  agentAddress: Address;
  /** MorphoSpendingGate contract address */
  gateAddress: Address;
  /** Policy preset name or custom policy */
  policyConfig: keyof typeof AGENT_POLICY_PRESETS | SpendingPolicy;
  /** Allowed markets for the agent */
  allowedMarkets: Address[];
}

/**
 * Set up an agent with a spending policy
 */
async function setupAgent(config: AgentSetupConfig): Promise<void> {
  console.log('🤖 Setting up AI agent...');
  console.log('─────────────────────────');
  console.log(`   Owner: ${config.ownerAddress}`);
  console.log(`   Agent: ${config.agentAddress}`);
  console.log(`   Gate: ${config.gateAddress}`);
  console.log();

  // Get or create policy
  let policy: SpendingPolicy;
  if (typeof config.policyConfig === 'string') {
    console.log(`📋 Using preset policy: ${config.policyConfig}`);
    policy = AGENT_POLICY_PRESETS[config.policyConfig];
    // Override allowed markets
    policy = { ...policy, allowedMarkets: config.allowedMarkets };
  } else {
    console.log('📋 Using custom policy');
    policy = config.policyConfig;
  }

  // Validate policy
  console.log('\n🔍 Validating policy...');
  const validation = validatePolicy(policy);

  if (!validation.valid) {
    console.error('❌ Policy validation failed:');
    validation.errors.forEach((err) => console.error(`   • ${err}`));
    throw new Error('Invalid policy configuration');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach((warn) => console.log(`   • ${warn}`));
  }

  console.log('✅ Policy valid');

  // Display policy details
  console.log('\n📊 Policy Details:');
  console.log(`   Daily limit: $${Number(policy.dailyLimit) / 1e6}`);
  console.log(`   Max single tx: $${Number(policy.maxSingleTx) / 1e6}`);
  console.log(`   Max LTV: ${policy.maxLTV / 100}%`);
  console.log(`   Min health factor: ${policy.minHealthFactor / 10000}`);
  console.log(`   Allowed markets: ${policy.allowedMarkets.length}`);
  console.log(`   Proof for supply: ${policy.requireProofForSupply}`);
  console.log(`   Proof for borrow: ${policy.requireProofForBorrow}`);
  console.log(`   Proof for withdraw: ${policy.requireProofForWithdraw}`);

  // Compute policy hash
  const policyHash = computePolicyHash(policy);
  console.log(`\n   Policy hash: ${policyHash}`);

  // Register policy on-chain
  console.log('\n📤 Registering policy on-chain...');
  console.log('   [DEMO] Would call: gateContract.registerPolicy(policy)');
  await new Promise((r) => setTimeout(r, 1000));
  console.log('   ✅ Policy registered');

  // Authorize agent
  console.log('\n🔑 Authorizing agent...');
  console.log('   [DEMO] Would call: gateContract.authorizeAgent(agent, policyHash)');
  await new Promise((r) => setTimeout(r, 1000));
  console.log('   ✅ Agent authorized');

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    AGENT SETUP COMPLETE                   ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log();
  console.log(`   Agent ${config.agentAddress.slice(0, 18)}... is now authorized`);
  console.log(`   Policy hash: ${policyHash.slice(0, 18)}...`);
  console.log();
  console.log('   The agent can now:');
  console.log(`   • Supply up to $${Number(policy.maxSingleTx) / 1e6} per tx`);
  console.log(`   • Operate within $${Number(policy.dailyLimit) / 1e6} daily limit`);
  console.log(`   • Maintain LTV below ${policy.maxLTV / 100}%`);
  console.log('   • All operations require valid ZKML proofs');
  console.log();
}

/**
 * Revoke an agent's authorization
 */
async function revokeAgent(
  ownerAddress: Address,
  agentAddress: Address,
  gateAddress: Address,
): Promise<void> {
  console.log('🛑 Revoking agent authorization...');
  console.log(`   Agent: ${agentAddress}`);

  console.log('   [DEMO] Would call: gateContract.revokeAgent(agent)');
  await new Promise((r) => setTimeout(r, 1000));

  console.log('   ✅ Agent revoked');
}

/**
 * Update agent's policy
 */
async function updateAgentPolicy(
  ownerAddress: Address,
  agentAddress: Address,
  gateAddress: Address,
  newPolicy: SpendingPolicy,
): Promise<void> {
  console.log('🔄 Updating agent policy...');

  // Validate new policy
  const validation = validatePolicy(newPolicy);
  if (!validation.valid) {
    throw new Error('New policy is invalid');
  }

  // Register new policy
  const newPolicyHash = computePolicyHash(newPolicy);
  console.log('   [DEMO] Would register new policy');

  // Revoke old authorization
  console.log('   [DEMO] Would revoke old authorization');

  // Authorize with new policy
  console.log('   [DEMO] Would authorize with new policy');

  console.log(`   ✅ Agent updated with policy ${newPolicyHash.slice(0, 18)}...`);
}

// Main script
async function main() {
  const config: AgentSetupConfig = {
    ownerAddress: (process.env.OWNER_ADDRESS || '0x' + '1'.repeat(40)) as Address,
    agentAddress: (process.env.AGENT_ADDRESS || '0x' + '2'.repeat(40)) as Address,
    gateAddress: (process.env.GATE_ADDRESS || '0x' + '3'.repeat(40)) as Address,
    policyConfig: 'moderateRebalanceAgent',
    allowedMarkets: [
      '0x' + '4'.repeat(40) as Address,
      '0x' + '5'.repeat(40) as Address,
    ],
  };

  await setupAgent(config);
}

export { setupAgent, revokeAgent, updateAgentPolicy, AgentSetupConfig };

if (require.main === module) {
  main().catch(console.error);
}
