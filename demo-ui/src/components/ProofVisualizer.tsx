import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cpu, FileCheck, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { ProofState } from '../lib/types';

interface ProofVisualizerProps {
  state: ProofState;
  operation?: string;
  amount?: number;
}

export function ProofVisualizer({ state, operation, amount }: ProofVisualizerProps) {
  const stages = [
    { key: 'preparing', label: 'Preparing', icon: FileCheck },
    { key: 'generating', label: 'Generating SNARK', icon: Cpu },
    { key: 'signing', label: 'Signing', icon: Shield },
    { key: 'verifying', label: 'Verifying', icon: Zap },
  ];

  const currentStageIndex = stages.findIndex(s => s.key === state.status);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="card p-6 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">zkML Proof Generation</h3>
          {operation && amount && (
            <p className="text-sm text-dark-400">
              {operation} ${amount.toLocaleString()}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-morpho-400">{state.progress}%</div>
          <div className="text-xs text-dark-500">Progress</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-dark-700 rounded-full mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${state.progress}%` }}
          transition={{ duration: 0.3 }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-morpho-600 to-purple-500 rounded-full"
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Stages */}
      <div className="flex justify-between mb-6">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = state.status === stage.key;
          const isComplete = currentStageIndex > index || state.status === 'complete';

          return (
            <div key={stage.key} className="flex flex-col items-center">
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                  isComplete ? 'bg-green-500/20 text-green-400' :
                  isActive ? 'bg-morpho-500/20 text-morpho-400' :
                  'bg-dark-700 text-dark-500'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                )}
              </motion.div>
              <span className={`text-xs font-medium ${
                isComplete ? 'text-green-400' :
                isActive ? 'text-morpho-400' :
                'text-dark-500'
              }`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Proof Visualization */}
      <div className="bg-dark-900 rounded-lg p-4 mb-4">
        <div className="text-xs text-dark-500 mb-2">Jolt-Atlas SNARK Proof</div>
        <div className="relative h-20 overflow-hidden rounded">
          <div className="absolute inset-0 flex flex-wrap gap-0.5 opacity-50">
            {Array.from({ length: 200 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: i < (state.progress * 2) ? '#0ea5e9' : '#1e293b',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.005 }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-mono text-morpho-400">
                {state.proofSize ? `${(state.proofSize / 1024).toFixed(1)} KB` : '~48 KB'}
              </div>
              <div className="text-xs text-dark-500">Proof Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 text-sm"
        >
          {state.status === 'complete' ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Proof generated and verified successfully</span>
            </>
          ) : state.status === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400">{state.error || 'Proof generation failed'}</span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-morpho-500 border-t-transparent rounded-full"
              />
              <span className="text-dark-400">
                {state.status === 'preparing' && 'Preparing proof inputs...'}
                {state.status === 'generating' && 'Running neural network in SNARK circuit...'}
                {state.status === 'signing' && 'Agent signing proof commitment...'}
                {state.status === 'verifying' && 'Verifying proof on-chain...'}
              </span>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Proof Details */}
      {state.proofHash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 pt-4 border-t border-dark-700"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-dark-500 mb-1">Proof Hash</div>
              <div className="font-mono text-dark-300 truncate">{state.proofHash}</div>
            </div>
            <div>
              <div className="text-xs text-dark-500 mb-1">Gas Estimate</div>
              <div className="font-mono text-dark-300">
                {state.gasEstimate?.toLocaleString() || '~200,000'} gas
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
