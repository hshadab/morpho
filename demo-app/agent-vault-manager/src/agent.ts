/**
 * Agentic Vault Manager
 *
 * AI agent that autonomously manages Morpho vault positions
 * while proving every action complies with owner-defined spending policies.
 */

import {
  MorphoSpendingProofsClient,
  createCombinedPolicy,
  MorphoOperation,
  type SpendingPolicy,
  type SpendingProof,
  type Address,
} from '@hshadab/morpho-spending-proofs';

import type {
  AgentDecision,
  MarketConditions,
  AgentPosition,
  AgentVaultConfig,
  AgentState,
  AgentStrategy,
  OperationHistoryEntry,
} from './types';
import { STRATEGIES } from './types';

/**
 * AgentVaultManager - Autonomous DeFi agent with ZKML spending proofs
 */
export class AgentVaultManager {
  private readonly client: MorphoSpendingProofsClient;
  private readonly signer: { signMessage: (message: string) => Promise<string> };
  private state: AgentState;
  private isRunning: boolean = false;

  constructor(
    client: MorphoSpendingProofsClient,
    signer: { signMessage: (message: string) => Promise<string> },
    config: AgentVaultConfig,
  ) {
    this.client = client;
    this.signer = signer;
    this.state = {
      config,
      positions: new Map(),
      history: [],
      dailyOperationCount: 0,
      lastOperationTimestamp: 0,
      totalValueLocked: BigInt(0),
      lifetimeEarnings: BigInt(0),
      isActive: false,
    };
  }

  /**
   * Start the agent loop
   */
  async start(): Promise<void> {
    console.log('🤖 Agent starting...');
    console.log(`   Strategy: ${this.state.config.strategy.name}`);
    console.log(`   Daily limit: $${Number(this.state.config.policy.dailyLimit) / 1e6}`);
    console.log(`   Max LTV: ${this.state.config.policy.maxLTV / 100}%`);

    this.isRunning = true;
    this.state.isActive = true;

    while (this.isRunning) {
      try {
        await this.runCycle();
      } catch (error) {
        console.error('❌ Agent cycle error:', error);
      }

      // Wait before next cycle
      await this.sleep(60000); // 1 minute between cycles
    }
  }

  /**
   * Stop the agent
   */
  stop(): void {
    console.log('🛑 Agent stopping...');
    this.isRunning = false;
    this.state.isActive = false;
  }

  /**
   * Run a single agent cycle
   */
  private async runCycle(): Promise<void> {
    console.log('\n--- Agent Cycle ---');

    // Check if we can operate
    if (!this.canOperate()) {
      console.log('⏸️  Operation limits reached, waiting...');
      return;
    }

    // Analyze each target market
    for (const market of this.state.config.targetMarkets) {
      const conditions = await this.getMarketConditions(market);
      const position = await this.getPosition(market);

      console.log(`\n📊 Market ${market.slice(0, 10)}...`);
      console.log(`   Supply APY: ${conditions.supplyAPY.toFixed(2)}%`);
      console.log(`   Borrow APY: ${conditions.borrowAPY.toFixed(2)}%`);
      console.log(`   Utilization: ${(conditions.utilizationRate * 100).toFixed(1)}%`);

      // Make decision
      const decision = await this.analyzeAndDecide(conditions, position);

      if (decision.shouldExecute && decision.operation !== undefined) {
        console.log(`\n🎯 Decision: ${this.operationName(decision.operation)}`);
        console.log(`   Amount: $${Number(decision.amount || 0) / 1e6}`);
        console.log(`   Confidence: ${(decision.confidence * 100).toFixed(0)}%`);
        console.log(`   Reasoning: ${decision.reasoning}`);

        // Execute with proof
        await this.executeWithProof(market, decision);
      } else {
        console.log(`   Decision: Hold (${decision.reasoning})`);
      }
    }
  }

  /**
   * Analyze market conditions and decide on action
   */
  private async analyzeAndDecide(
    conditions: MarketConditions,
    position: AgentPosition,
  ): Promise<AgentDecision> {
    const strategy = this.state.config.strategy;

    // Check for supply opportunity
    if (conditions.supplyAPY >= strategy.minSupplyAPY && position.supplied === BigInt(0)) {
      const amount = this.calculateOptimalSupplyAmount(conditions);
      return {
        shouldExecute: true,
        operation: MorphoOperation.SUPPLY,
        amount,
        reasoning: `Supply APY ${conditions.supplyAPY.toFixed(2)}% exceeds threshold ${strategy.minSupplyAPY}%`,
        confidence: 0.85,
      };
    }

    // Check for leverage opportunity
    if (
      position.supplied > BigInt(0) &&
      position.currentLTV < strategy.targetLTV - strategy.rebalanceThreshold &&
      conditions.borrowAPY <= strategy.maxBorrowAPY
    ) {
      const amount = this.calculateOptimalBorrowAmount(position, conditions);
      return {
        shouldExecute: true,
        operation: MorphoOperation.BORROW,
        amount,
        reasoning: `LTV ${position.currentLTV}% below target ${strategy.targetLTV}%, adding leverage`,
        confidence: 0.75,
      };
    }

    // Check for deleverage need
    if (position.currentLTV > strategy.targetLTV + strategy.rebalanceThreshold) {
      const amount = this.calculateRepayAmount(position);
      return {
        shouldExecute: true,
        operation: MorphoOperation.REPAY,
        amount,
        reasoning: `LTV ${position.currentLTV}% exceeds target ${strategy.targetLTV}%, deleveraging`,
        confidence: 0.9,
      };
    }

    // Check for profit taking
    if (position.unrealizedPnL > BigInt(1000 * 1e6)) {
      // > $1000 profit
      const amount = position.unrealizedPnL / BigInt(2);
      return {
        shouldExecute: true,
        operation: MorphoOperation.WITHDRAW,
        amount,
        reasoning: `Taking profits: $${Number(position.unrealizedPnL) / 1e6}`,
        confidence: 0.7,
      };
    }

    return {
      shouldExecute: false,
      reasoning: 'No action needed - position within target parameters',
      confidence: 1.0,
    };
  }

  /**
   * Execute an operation with ZKML proof
   */
  private async executeWithProof(market: Address, decision: AgentDecision): Promise<void> {
    if (!decision.operation || !decision.amount) return;

    console.log('\n🔐 Generating ZKML proof...');

    try {
      // Generate proof
      const proof = await this.client.generateProof(
        {
          policy: this.state.config.policy,
          operation: decision.operation,
          amount: decision.amount,
          market,
          agent: this.state.config.agentAddress,
        },
        this.signer,
        (status, progress) => {
          process.stdout.write(`\r   Proof status: ${status} (${progress}%)`);
        },
      );

      console.log('\n✅ Proof generated successfully');
      console.log(`   Proof size: ${proof.proof.length / 2} bytes`);
      console.log(`   Policy hash: ${proof.policyHash.slice(0, 18)}...`);

      // Simulate transaction execution
      console.log('\n📤 Submitting transaction...');
      const txHash = await this.simulateTransaction(market, decision, proof);

      // Record in history
      const historyEntry: OperationHistoryEntry = {
        timestamp: Date.now(),
        operation: decision.operation,
        amount: decision.amount,
        market,
        proofHash: proof.policyHash,
        txHash,
        success: true,
      };
      this.state.history.push(historyEntry);
      this.state.dailyOperationCount++;
      this.state.lastOperationTimestamp = Date.now();

      console.log(`✅ Transaction successful: ${txHash.slice(0, 18)}...`);
    } catch (error) {
      console.error('❌ Operation failed:', error);

      // Record failure
      this.state.history.push({
        timestamp: Date.now(),
        operation: decision.operation,
        amount: decision.amount,
        market,
        proofHash: '',
        txHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Simulate transaction (in production, this would send to chain)
   */
  private async simulateTransaction(
    market: Address,
    decision: AgentDecision,
    proof: SpendingProof,
  ): Promise<string> {
    // Simulate network delay
    await this.sleep(2000);

    // Return mock tx hash
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  // ============ Helper Methods ============

  private canOperate(): boolean {
    const now = Date.now();
    const dayStart = new Date().setHours(0, 0, 0, 0);

    // Reset daily count if new day
    if (this.state.lastOperationTimestamp < dayStart) {
      this.state.dailyOperationCount = 0;
    }

    // Check daily limit
    if (this.state.dailyOperationCount >= this.state.config.maxOperationsPerDay) {
      return false;
    }

    // Check minimum interval
    if (now - this.state.lastOperationTimestamp < this.state.config.minOperationInterval * 1000) {
      return false;
    }

    return true;
  }

  private async getMarketConditions(market: Address): Promise<MarketConditions> {
    // In production, fetch from chain/oracles
    // Mock data for demo
    return {
      supplyAPY: 4.5 + Math.random() * 2,
      borrowAPY: 6.2 + Math.random() * 3,
      totalSupply: BigInt(50_000_000 * 1e6),
      totalBorrow: BigInt(35_000_000 * 1e6),
      utilizationRate: 0.7,
      oraclePrice: BigInt(1e18),
    };
  }

  private async getPosition(market: Address): Promise<AgentPosition> {
    // In production, fetch from chain
    const cached = this.state.positions.get(market);
    if (cached) return cached;

    // Mock initial position
    return {
      supplied: BigInt(0),
      borrowed: BigInt(0),
      collateral: BigInt(0),
      currentLTV: 0,
      healthFactor: 100,
      unrealizedPnL: BigInt(0),
    };
  }

  private calculateOptimalSupplyAmount(conditions: MarketConditions): bigint {
    const policy = this.state.config.policy;
    // Use 50% of max single tx for initial supply
    return policy.maxSingleTx / BigInt(2);
  }

  private calculateOptimalBorrowAmount(
    position: AgentPosition,
    conditions: MarketConditions,
  ): bigint {
    const strategy = this.state.config.strategy;
    const targetBorrow = (position.supplied * BigInt(strategy.targetLTV)) / BigInt(100);
    return targetBorrow - position.borrowed;
  }

  private calculateRepayAmount(position: AgentPosition): bigint {
    const strategy = this.state.config.strategy;
    const targetBorrow = (position.supplied * BigInt(strategy.targetLTV)) / BigInt(100);
    return position.borrowed - targetBorrow;
  }

  private operationName(op: MorphoOperation): string {
    const names = ['SUPPLY', 'BORROW', 'WITHDRAW', 'REPAY'];
    return names[op] || 'UNKNOWN';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============ Public Getters ============

  getState(): AgentState {
    return { ...this.state };
  }

  getHistory(): OperationHistoryEntry[] {
    return [...this.state.history];
  }

  isActive(): boolean {
    return this.state.isActive;
  }
}

/**
 * Create a new agent instance with default configuration
 */
export function createAgentVaultManager(
  proverUrl: string,
  gateAddress: Address,
  morphoAddress: Address,
  agentAddress: Address,
  ownerAddress: Address,
  signer: { signMessage: (message: string) => Promise<string> },
  strategyName: keyof typeof STRATEGIES = 'conservativeYield',
): AgentVaultManager {
  const client = new MorphoSpendingProofsClient({
    proverUrl,
    chainId: 1,
    gateAddress,
    morphoAddress,
  });

  const strategy = STRATEGIES[strategyName];
  const policy = createCombinedPolicy({
    dailyLimitUSD: 10_000,
    maxSingleTxUSD: 5_000,
    maxLTVPercent: strategy.targetLTV + 10,
    minHealthFactor: 1.2,
  });

  const config: AgentVaultConfig = {
    agentAddress,
    ownerAddress,
    policy,
    strategy,
    targetMarkets: [],
    minOperationInterval: 300, // 5 minutes
    maxOperationsPerDay: 20,
  };

  return new AgentVaultManager(client, signer, config);
}
