import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Play, Pause, TrendingUp, TrendingDown, DollarSign,
  Activity, Clock, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { SpendingPolicy, AgentConfig, Transaction, ProofState, MorphoOperation } from '../lib/types';
import { MOCK_MARKETS, AGENT_DECISIONS, generateMockTxHash, generateMockProofHash } from '../lib/mockData';
import { ProofVisualizer } from './ProofVisualizer';
import { MarketPanel } from './MarketPanel';
import { TransactionLog } from './TransactionLog';

interface AgentDashboardProps {
  policy: SpendingPolicy;
  agent: AgentConfig;
}

const OPERATION_NAMES = ['SUPPLY', 'BORROW', 'WITHDRAW', 'REPAY'];
const OPERATION_COLORS = ['text-green-400', 'text-purple-400', 'text-orange-400', 'text-blue-400'];

export function AgentDashboard({ policy, agent }: AgentDashboardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailySpent, setDailySpent] = useState(0);
  const [proofState, setProofState] = useState<ProofState>({ status: 'idle', progress: 0 });
  const [currentDecision, setCurrentDecision] = useState<typeof AGENT_DECISIONS[0] | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const runProofGeneration = useCallback(async () => {
    const stages: Array<{ status: ProofState['status']; duration: number; progressEnd: number }> = [
      { status: 'preparing', duration: 800, progressEnd: 20 },
      { status: 'generating', duration: 2500, progressEnd: 70 },
      { status: 'signing', duration: 600, progressEnd: 85 },
      { status: 'verifying', duration: 1000, progressEnd: 100 },
    ];

    let progress = 0;
    for (const stage of stages) {
      setProofState({ status: stage.status, progress });

      const steps = 10;
      const stepDuration = stage.duration / steps;
      const progressStep = (stage.progressEnd - progress) / steps;

      for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, stepDuration));
        progress += progressStep;
        setProofState({ status: stage.status, progress: Math.round(progress) });
      }
    }

    const proofHash = generateMockProofHash();
    setProofState({
      status: 'complete',
      progress: 100,
      proofSize: 48 * 1024,
      proofHash,
      gasEstimate: 195000 + Math.floor(Math.random() * 10000),
    });

    return proofHash;
  }, []);

  const runAgentCycle = useCallback(async () => {
    if (!isRunning) return;

    // Pick a decision
    const decision = AGENT_DECISIONS[cycleCount % AGENT_DECISIONS.length];
    setCurrentDecision(decision);

    // Calculate amount (random within policy limits)
    const maxAmount = Math.min(policy.maxSingleTx, policy.dailyLimit - dailySpent);
    if (maxAmount <= 0) {
      setIsRunning(false);
      return;
    }
    const amount = Math.floor(Math.random() * maxAmount * 0.8) + maxAmount * 0.2;

    // Wait for user to see decision
    await new Promise(r => setTimeout(r, 1500));

    // Generate proof
    const proofHash = await runProofGeneration();

    // Create transaction
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
      operation: decision.operation as MorphoOperation,
      market: MOCK_MARKETS[Math.floor(Math.random() * MOCK_MARKETS.length)].name,
      amount,
      proofHash,
      txHash: generateMockTxHash(),
      status: 'success',
      gasUsed: 195000 + Math.floor(Math.random() * 10000),
    };

    setTransactions(prev => [tx, ...prev]);
    setDailySpent(prev => prev + amount);
    setTotalEarnings(prev => prev + amount * 0.0001); // Mock earnings
    setCycleCount(prev => prev + 1);

    // Reset for next cycle
    await new Promise(r => setTimeout(r, 2000));
    setProofState({ status: 'idle', progress: 0 });
    setCurrentDecision(null);

    // Continue if still running
    if (isRunning) {
      setTimeout(runAgentCycle, 1000);
    }
  }, [isRunning, cycleCount, dailySpent, policy, runProofGeneration]);

  useEffect(() => {
    if (isRunning && proofState.status === 'idle') {
      runAgentCycle();
    }
  }, [isRunning, proofState.status, runAgentCycle]);

  const remainingLimit = policy.dailyLimit - dailySpent;
  const limitUsedPercent = (dailySpent / policy.dailyLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bot className="w-8 h-8 text-purple-400" />
            Agentic Vault Manager
          </h2>
          <p className="text-dark-400 mt-1">
            Autonomous DeFi operations with zkML spending proofs
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            isRunning
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Stop Agent
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Agent
            </>
          )}
        </motion.button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-dark-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Daily Spent</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${dailySpent.toLocaleString()}
          </div>
          <div className="mt-2 h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-morpho-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(limitUsedPercent, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-dark-500">
            ${remainingLimit.toLocaleString()} remaining
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-dark-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Transactions</span>
          </div>
          <div className="text-2xl font-bold text-white">{transactions.length}</div>
          <div className="mt-1 text-xs text-dark-500">
            {transactions.filter(t => t.status === 'success').length} successful
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-dark-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Earnings</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            +${totalEarnings.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-dark-500">Lifetime earnings</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-dark-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Status</span>
          </div>
          <div className={`text-2xl font-bold ${isRunning ? 'text-green-400' : 'text-dark-400'}`}>
            {isRunning ? 'Active' : 'Idle'}
          </div>
          <div className="mt-1 text-xs text-dark-500">
            {cycleCount} cycles completed
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Markets & Decision */}
        <div className="col-span-2 space-y-6">
          {/* Current Decision */}
          <AnimatePresence>
            {currentDecision && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card p-6 border-morpho-500/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-dark-500 mb-1">Agent Decision</div>
                    <div className={`text-xl font-bold ${OPERATION_COLORS[currentDecision.operation]}`}>
                      {OPERATION_NAMES[currentDecision.operation]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-dark-500 mb-1">Confidence</div>
                    <div className="text-xl font-bold text-white">
                      {(currentDecision.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <p className="text-dark-300">{currentDecision.reasoning}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proof Visualizer */}
          <AnimatePresence>
            {proofState.status !== 'idle' && (
              <ProofVisualizer
                state={proofState}
                operation={currentDecision ? OPERATION_NAMES[currentDecision.operation] : undefined}
                amount={Math.floor(Math.random() * policy.maxSingleTx)}
              />
            )}
          </AnimatePresence>

          {/* Markets */}
          <MarketPanel markets={MOCK_MARKETS} />
        </div>

        {/* Right Column: Transactions */}
        <div>
          <TransactionLog transactions={transactions} />
        </div>
      </div>

      {/* Policy Footer */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="text-dark-500">Policy Constraints:</span>
            <span className="text-dark-300">
              Daily: <span className="text-white">${policy.dailyLimit.toLocaleString()}</span>
            </span>
            <span className="text-dark-300">
              Max Tx: <span className="text-white">${policy.maxSingleTx.toLocaleString()}</span>
            </span>
            <span className="text-dark-300">
              Max LTV: <span className="text-white">{policy.maxLTV}%</span>
            </span>
            <span className="text-dark-300">
              Min HF: <span className="text-white">{policy.minHealthFactor}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>All operations verified with zkML proofs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
