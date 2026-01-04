import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, DollarSign, Percent, Heart, Check } from 'lucide-react';
import { SpendingPolicy } from '../lib/types';
import { STRATEGY_PRESETS, MOCK_MARKETS } from '../lib/mockData';

interface PolicyConfigProps {
  onComplete: (policy: SpendingPolicy) => void;
}

export function PolicyConfig({ onComplete }: PolicyConfigProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('moderate');
  const [customMode, setCustomMode] = useState(false);
  const [policy, setPolicy] = useState<SpendingPolicy>({
    dailyLimit: 10000,
    maxSingleTx: 5000,
    maxLTV: 70,
    minHealthFactor: 1.2,
    allowedMarkets: MOCK_MARKETS.map(m => m.address),
    requireProofForSupply: true,
    requireProofForBorrow: true,
    requireProofForWithdraw: true,
  });

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    const presetData = STRATEGY_PRESETS[preset as keyof typeof STRATEGY_PRESETS];
    setPolicy({
      ...policy,
      dailyLimit: presetData.dailyLimit,
      maxSingleTx: presetData.maxSingleTx,
      maxLTV: presetData.maxLTV,
      minHealthFactor: presetData.minHealthFactor,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-morpho-600/20 rounded-2xl mb-4"
        >
          <Shield className="w-8 h-8 text-morpho-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Define Spending Policy</h2>
        <p className="text-dark-400">Set the constraints your AI agent must operate within</p>
      </div>

      {/* Strategy Presets */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Object.entries(STRATEGY_PRESETS).map(([key, preset]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePresetSelect(key)}
            className={`card p-4 text-left transition-all ${
              selectedPreset === key
                ? 'border-morpho-500 bg-morpho-500/10'
                : 'hover:border-dark-500'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                preset.color === 'green' ? 'bg-green-500/20 text-green-400' :
                preset.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                {preset.name}
              </span>
              {selectedPreset === key && (
                <Check className="w-5 h-5 text-morpho-400" />
              )}
            </div>
            <p className="text-sm text-dark-400 mb-3">{preset.description}</p>
            <div className="space-y-1 text-xs text-dark-500">
              <div>Daily: ${preset.dailyLimit.toLocaleString()}</div>
              <div>Max LTV: {preset.maxLTV}%</div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Policy Details */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Policy Parameters</h3>
          <button
            onClick={() => setCustomMode(!customMode)}
            className="text-sm text-morpho-400 hover:text-morpho-300"
          >
            {customMode ? 'Use Preset' : 'Customize'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Daily Limit */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
              <DollarSign className="w-4 h-4" />
              Daily Limit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">$</span>
              <input
                type="number"
                value={policy.dailyLimit}
                onChange={(e) => setPolicy({ ...policy, dailyLimit: Number(e.target.value) })}
                disabled={!customMode}
                className="input pl-7"
              />
            </div>
            <p className="mt-1 text-xs text-dark-500">Maximum spend per 24 hours</p>
          </div>

          {/* Max Single Tx */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
              <DollarSign className="w-4 h-4" />
              Max Single Transaction
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">$</span>
              <input
                type="number"
                value={policy.maxSingleTx}
                onChange={(e) => setPolicy({ ...policy, maxSingleTx: Number(e.target.value) })}
                disabled={!customMode}
                className="input pl-7"
              />
            </div>
            <p className="mt-1 text-xs text-dark-500">Maximum per transaction</p>
          </div>

          {/* Max LTV */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
              <Percent className="w-4 h-4" />
              Maximum LTV
            </label>
            <div className="relative">
              <input
                type="number"
                value={policy.maxLTV}
                onChange={(e) => setPolicy({ ...policy, maxLTV: Number(e.target.value) })}
                disabled={!customMode}
                className="input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500">%</span>
            </div>
            <p className="mt-1 text-xs text-dark-500">Loan-to-value ceiling</p>
          </div>

          {/* Min Health Factor */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
              <Heart className="w-4 h-4" />
              Min Health Factor
            </label>
            <input
              type="number"
              step="0.1"
              value={policy.minHealthFactor}
              onChange={(e) => setPolicy({ ...policy, minHealthFactor: Number(e.target.value) })}
              disabled={!customMode}
              className="input"
            />
            <p className="mt-1 text-xs text-dark-500">Minimum safety threshold</p>
          </div>
        </div>

        {/* Proof Requirements */}
        <div className="mt-6 pt-6 border-t border-dark-700">
          <h4 className="text-sm font-medium text-dark-300 mb-3">Proof Requirements</h4>
          <div className="flex gap-4">
            {[
              { key: 'requireProofForSupply', label: 'Supply' },
              { key: 'requireProofForBorrow', label: 'Borrow' },
              { key: 'requireProofForWithdraw', label: 'Withdraw' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy[item.key as keyof SpendingPolicy] as boolean}
                  onChange={(e) => setPolicy({ ...policy, [item.key]: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-500 bg-dark-800 text-morpho-500 focus:ring-morpho-500"
                />
                <span className="text-sm text-dark-300">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Allowed Markets */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Allowed Markets</h3>
        <div className="space-y-2">
          {MOCK_MARKETS.map((market) => (
            <label
              key={market.address}
              className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50 hover:bg-dark-900 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={policy.allowedMarkets.includes(market.address)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPolicy({ ...policy, allowedMarkets: [...policy.allowedMarkets, market.address] });
                    } else {
                      setPolicy({ ...policy, allowedMarkets: policy.allowedMarkets.filter(a => a !== market.address) });
                    }
                  }}
                  className="w-4 h-4 rounded border-dark-500 bg-dark-800 text-morpho-500 focus:ring-morpho-500"
                />
                <span className="font-medium text-dark-200">{market.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-400">{market.supplyAPY.toFixed(2)}% APY</span>
                <span className="text-dark-500">|</span>
                <span className="text-dark-400">${(market.totalSupply / 1e6).toFixed(0)}M TVL</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onComplete(policy)}
        className="w-full btn-primary py-4 text-lg font-semibold"
      >
        Register Policy & Continue
      </motion.button>
    </motion.div>
  );
}
