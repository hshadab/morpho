import { MarketData, SpendingPolicy } from './types';

export const MOCK_MARKETS: MarketData[] = [
  {
    address: '0x1234...5678',
    name: 'USDC/WETH',
    supplyAPY: 4.82,
    borrowAPY: 6.15,
    totalSupply: 125_000_000,
    totalBorrow: 87_500_000,
    utilization: 70,
  },
  {
    address: '0x2345...6789',
    name: 'USDC/wstETH',
    supplyAPY: 5.21,
    borrowAPY: 7.03,
    totalSupply: 89_000_000,
    totalBorrow: 58_850_000,
    utilization: 66,
  },
  {
    address: '0x3456...7890',
    name: 'DAI/WETH',
    supplyAPY: 3.95,
    borrowAPY: 5.42,
    totalSupply: 67_000_000,
    totalBorrow: 40_200_000,
    utilization: 60,
  },
];

export const DEFAULT_POLICY: SpendingPolicy = {
  dailyLimit: 10000,
  maxSingleTx: 5000,
  maxLTV: 70,
  minHealthFactor: 1.2,
  allowedMarkets: MOCK_MARKETS.map(m => m.address),
  requireProofForSupply: true,
  requireProofForBorrow: true,
  requireProofForWithdraw: true,
};

export const STRATEGY_PRESETS = {
  conservative: {
    name: 'Conservative Yield',
    description: 'Focus on stable yield with minimal risk',
    dailyLimit: 5000,
    maxSingleTx: 2500,
    maxLTV: 50,
    minHealthFactor: 1.5,
    color: 'green',
  },
  moderate: {
    name: 'Moderate Leverage',
    description: 'Balanced leverage for enhanced yields',
    dailyLimit: 10000,
    maxSingleTx: 5000,
    maxLTV: 70,
    minHealthFactor: 1.2,
    color: 'blue',
  },
  aggressive: {
    name: 'Aggressive Yield',
    description: 'Maximum yield with higher risk tolerance',
    dailyLimit: 25000,
    maxSingleTx: 10000,
    maxLTV: 85,
    minHealthFactor: 1.1,
    color: 'purple',
  },
};

export const AGENT_DECISIONS = [
  {
    operation: 0, // SUPPLY
    reasoning: 'High supply APY (5.21%) detected in USDC/wstETH market. Deploying capital to capture yield.',
    confidence: 0.92,
  },
  {
    operation: 1, // BORROW
    reasoning: 'Current LTV at 45%, below target of 70%. Adding leverage to increase yield.',
    confidence: 0.78,
  },
  {
    operation: 3, // REPAY
    reasoning: 'LTV drifted to 73%, above target. Deleveraging to maintain safety margin.',
    confidence: 0.95,
  },
  {
    operation: 2, // WITHDRAW
    reasoning: 'Profit target reached. Taking partial profits while maintaining core position.',
    confidence: 0.85,
  },
];

export function generateMockTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

export function generateMockProofHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}
