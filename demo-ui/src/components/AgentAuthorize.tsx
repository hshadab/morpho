import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Key, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { SpendingPolicy, AgentConfig } from '../lib/types';

interface AgentAuthorizeProps {
  policy: SpendingPolicy;
  onComplete: (agent: AgentConfig) => void;
}

export function AgentAuthorize({ policy, onComplete }: AgentAuthorizeProps) {
  const [step, setStep] = useState<'info' | 'registering' | 'authorizing' | 'complete'>('info');
  const [policyHash, setPolicyHash] = useState<string>('');

  const agentAddress = '0x7a3b...9c4e';
  const ownerAddress = '0x1f2d...8a5b';

  const startAuthorization = async () => {
    setStep('registering');

    // Simulate policy registration
    await new Promise(r => setTimeout(r, 2000));
    const hash = '0x' + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setPolicyHash(hash);

    setStep('authorizing');

    // Simulate agent authorization
    await new Promise(r => setTimeout(r, 2000));

    setStep('complete');

    await new Promise(r => setTimeout(r, 1000));

    onComplete({
      address: agentAddress,
      ownerAddress: ownerAddress,
      policyHash: hash,
      strategy: 'Moderate Leverage',
      isActive: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-2xl mb-4"
        >
          <Bot className="w-8 h-8 text-purple-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Authorize AI Agent</h2>
        <p className="text-dark-400">Grant your agent permission to operate with spending proofs</p>
      </div>

      {/* Address Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-4">
          <div className="text-xs text-dark-500 mb-1">Owner Wallet</div>
          <div className="font-mono text-dark-200">{ownerAddress}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-dark-500 mb-1">Agent Wallet</div>
          <div className="font-mono text-dark-200">{agentAddress}</div>
        </div>
      </div>

      {/* Policy Summary */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Policy Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-dark-900/50 rounded-lg">
            <div className="text-xs text-dark-500 mb-1">Daily Limit</div>
            <div className="text-xl font-bold text-white">${policy.dailyLimit.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-dark-900/50 rounded-lg">
            <div className="text-xs text-dark-500 mb-1">Max Single Tx</div>
            <div className="text-xl font-bold text-white">${policy.maxSingleTx.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-dark-900/50 rounded-lg">
            <div className="text-xs text-dark-500 mb-1">Max LTV</div>
            <div className="text-xl font-bold text-white">{policy.maxLTV}%</div>
          </div>
          <div className="p-3 bg-dark-900/50 rounded-lg">
            <div className="text-xs text-dark-500 mb-1">Min Health Factor</div>
            <div className="text-xl font-bold text-white">{policy.minHealthFactor}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-dark-700">
          <div className="text-xs text-dark-500 mb-2">Allowed Markets</div>
          <div className="flex gap-2">
            {policy.allowedMarkets.slice(0, 3).map((market, i) => (
              <span key={i} className="px-2 py-1 bg-dark-800 rounded text-xs text-dark-300 font-mono">
                {market}
              </span>
            ))}
            {policy.allowedMarkets.length > 3 && (
              <span className="px-2 py-1 text-xs text-dark-500">
                +{policy.allowedMarkets.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Authorization Steps */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Authorization Process</h3>

        <div className="space-y-4">
          {/* Step 1: Register Policy */}
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step === 'registering' ? 'bg-morpho-500/20 text-morpho-400' :
              step === 'authorizing' || step === 'complete' ? 'bg-green-500/20 text-green-400' :
              'bg-dark-700 text-dark-400'
            }`}>
              {step === 'registering' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 'authorizing' || step === 'complete' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span>1</span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-dark-200">Register Policy On-Chain</div>
              <div className="text-sm text-dark-500">
                {step === 'registering' ? 'Submitting to MorphoSpendingGate...' :
                 step === 'authorizing' || step === 'complete' ? 'Policy registered successfully' :
                 'Submit policy to smart contract'}
              </div>
              {policyHash && (
                <div className="mt-1 text-xs text-dark-500 font-mono">
                  Hash: {policyHash.slice(0, 22)}...
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className={`w-5 h-5 ${
              step === 'authorizing' || step === 'complete' ? 'text-morpho-500' : 'text-dark-600'
            }`} />
          </div>

          {/* Step 2: Authorize Agent */}
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step === 'authorizing' ? 'bg-morpho-500/20 text-morpho-400' :
              step === 'complete' ? 'bg-green-500/20 text-green-400' :
              'bg-dark-700 text-dark-400'
            }`}>
              {step === 'authorizing' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 'complete' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span>2</span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-dark-200">Authorize Agent</div>
              <div className="text-sm text-dark-500">
                {step === 'authorizing' ? 'Granting agent permissions...' :
                 step === 'complete' ? 'Agent authorized with policy' :
                 'Bind agent to policy constraints'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {step === 'info' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startAuthorization}
          className="w-full btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-2"
        >
          <Key className="w-5 h-5" />
          Authorize Agent
        </motion.button>
      )}

      {step === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-green-500/10 border border-green-500/30 rounded-xl"
        >
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <div className="text-lg font-semibold text-white mb-1">Agent Authorized!</div>
          <div className="text-sm text-dark-400">Starting autonomous operations...</div>
        </motion.div>
      )}
    </motion.div>
  );
}
