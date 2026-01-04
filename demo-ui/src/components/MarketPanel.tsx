import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { MarketData } from '../lib/types';

interface MarketPanelProps {
  markets: MarketData[];
}

export function MarketPanel({ markets }: MarketPanelProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-morpho-400" />
          Morpho Markets
        </h3>
        <span className="text-sm text-dark-500">{markets.length} markets</span>
      </div>

      <div className="space-y-3">
        {markets.map((market, index) => (
          <motion.div
            key={market.address}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-dark-900/50 rounded-lg hover:bg-dark-900 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-morpho-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {market.name.split('/')[0].slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-white">{market.name}</div>
                  <div className="text-xs text-dark-500 font-mono">{market.address}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-bold">{market.supplyAPY.toFixed(2)}%</span>
                </div>
                <div className="text-xs text-dark-500">Supply APY</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-dark-500 mb-1">Total Supply</div>
                <div className="font-medium text-dark-200">
                  ${(market.totalSupply / 1e6).toFixed(1)}M
                </div>
              </div>
              <div>
                <div className="text-dark-500 mb-1">Total Borrow</div>
                <div className="font-medium text-dark-200">
                  ${(market.totalBorrow / 1e6).toFixed(1)}M
                </div>
              </div>
              <div>
                <div className="text-dark-500 mb-1">Utilization</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-morpho-500 rounded-full"
                      style={{ width: `${market.utilization}%` }}
                    />
                  </div>
                  <span className="font-medium text-dark-200">{market.utilization}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
