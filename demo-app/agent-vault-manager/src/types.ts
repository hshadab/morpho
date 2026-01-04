/**
 * Types for Agentic Vault Manager
 */

import type { Address, SpendingPolicy, MorphoOperation } from '@hshadab/morpho-spending-proofs';

/**
 * Agent decision result from AI model
 */
export interface AgentDecision {
  /** Whether to execute an operation */
  shouldExecute: boolean;
  /** Type of operation to execute */
  operation?: MorphoOperation;
  /** Amount to transact */
  amount?: bigint;
  /** Target market */
  market?: Address;
  /** Reasoning for the decision */
  reasoning: string;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Market conditions for agent analysis
 */
export interface MarketConditions {
  /** Current APY for supply */
  supplyAPY: number;
  /** Current APY for borrow */
  borrowAPY: number;
  /** Total supply in the market */
  totalSupply: bigint;
  /** Total borrow in the market */
  totalBorrow: bigint;
  /** Utilization rate (0-1) */
  utilizationRate: number;
  /** Oracle price */
  oraclePrice: bigint;
}

/**
 * Agent position state
 */
export interface AgentPosition {
  /** Supplied assets */
  supplied: bigint;
  /** Borrowed assets */
  borrowed: bigint;
  /** Collateral provided */
  collateral: bigint;
  /** Current LTV ratio */
  currentLTV: number;
  /** Current health factor */
  healthFactor: number;
  /** Unrealized PnL */
  unrealizedPnL: bigint;
}

/**
 * Agent operation history entry
 */
export interface OperationHistoryEntry {
  /** Timestamp of operation */
  timestamp: number;
  /** Type of operation */
  operation: MorphoOperation;
  /** Amount transacted */
  amount: bigint;
  /** Target market */
  market: Address;
  /** Proof hash */
  proofHash: string;
  /** Transaction hash */
  txHash: string;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Agent strategy configuration
 */
export interface AgentStrategy {
  /** Name of the strategy */
  name: string;
  /** Description */
  description: string;
  /** Target APY threshold to trigger supply */
  minSupplyAPY: number;
  /** Maximum borrow APY to accept */
  maxBorrowAPY: number;
  /** Target LTV for leveraged positions */
  targetLTV: number;
  /** Rebalance threshold (deviation from target) */
  rebalanceThreshold: number;
  /** Risk tolerance (0-1) */
  riskTolerance: number;
}

/**
 * Predefined strategies
 */
export const STRATEGIES: Record<string, AgentStrategy> = {
  /** Conservative yield farming */
  conservativeYield: {
    name: 'Conservative Yield',
    description: 'Focus on stable yield with minimal risk',
    minSupplyAPY: 3,
    maxBorrowAPY: 5,
    targetLTV: 30,
    rebalanceThreshold: 5,
    riskTolerance: 0.2,
  },
  /** Moderate leveraged yield */
  moderateLeverage: {
    name: 'Moderate Leverage',
    description: 'Balanced leverage for enhanced yields',
    minSupplyAPY: 4,
    maxBorrowAPY: 8,
    targetLTV: 50,
    rebalanceThreshold: 10,
    riskTolerance: 0.5,
  },
  /** Aggressive yield optimization */
  aggressiveYield: {
    name: 'Aggressive Yield',
    description: 'Maximum yield with higher risk tolerance',
    minSupplyAPY: 5,
    maxBorrowAPY: 12,
    targetLTV: 70,
    rebalanceThreshold: 15,
    riskTolerance: 0.8,
  },
};

/**
 * Agent configuration
 */
export interface AgentVaultConfig {
  /** Agent wallet address */
  agentAddress: Address;
  /** Owner wallet address */
  ownerAddress: Address;
  /** Spending policy to enforce */
  policy: SpendingPolicy;
  /** Strategy to follow */
  strategy: AgentStrategy;
  /** Markets to operate on */
  targetMarkets: Address[];
  /** Minimum operation interval (seconds) */
  minOperationInterval: number;
  /** Maximum operations per day */
  maxOperationsPerDay: number;
}

/**
 * Agent state
 */
export interface AgentState {
  /** Current configuration */
  config: AgentVaultConfig;
  /** Current positions by market */
  positions: Map<Address, AgentPosition>;
  /** Operation history */
  history: OperationHistoryEntry[];
  /** Daily operation count */
  dailyOperationCount: number;
  /** Last operation timestamp */
  lastOperationTimestamp: number;
  /** Total value locked */
  totalValueLocked: bigint;
  /** Lifetime earnings */
  lifetimeEarnings: bigint;
  /** Is agent currently active */
  isActive: boolean;
}
