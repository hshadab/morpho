import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle, XCircle,
  Clock, ExternalLink, FileText
} from 'lucide-react';
import { Transaction, MorphoOperation } from '../lib/types';

interface TransactionLogProps {
  transactions: Transaction[];
}

const OPERATION_ICONS = {
  [MorphoOperation.SUPPLY]: ArrowUpRight,
  [MorphoOperation.BORROW]: ArrowDownRight,
  [MorphoOperation.WITHDRAW]: ArrowDownRight,
  [MorphoOperation.REPAY]: RefreshCw,
};

const OPERATION_COLORS = {
  [MorphoOperation.SUPPLY]: 'text-green-400 bg-green-500/10',
  [MorphoOperation.BORROW]: 'text-purple-400 bg-purple-500/10',
  [MorphoOperation.WITHDRAW]: 'text-orange-400 bg-orange-500/10',
  [MorphoOperation.REPAY]: 'text-blue-400 bg-blue-500/10',
};

const OPERATION_NAMES = ['SUPPLY', 'BORROW', 'WITHDRAW', 'REPAY'];

export function TransactionLog({ transactions }: TransactionLogProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-morpho-400" />
          Transaction Log
        </h3>
        <span className="text-sm text-dark-500">{transactions.length} txs</span>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        <AnimatePresence>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-dark-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Start the agent to see transactions</p>
            </div>
          ) : (
            transactions.map((tx, index) => {
              const Icon = OPERATION_ICONS[tx.operation];
              const colorClass = OPERATION_COLORS[tx.operation];

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-dark-900/50 rounded-lg hover:bg-dark-900 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${colorClass.split(' ')[0]}`}>
                          {OPERATION_NAMES[tx.operation]}
                        </span>
                        <span className="text-xs text-dark-500">
                          {formatTime(tx.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white">
                          ${tx.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-dark-400">{tx.market}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {tx.status === 'success' ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : tx.status === 'failed' ? (
                          <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}

                        <span className="text-dark-600">|</span>

                        <span className="text-dark-500 font-mono truncate">
                          {tx.proofHash.slice(0, 12)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details on hover */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    whileHover={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 mt-3 border-t border-dark-700 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-dark-500">Tx Hash</span>
                        <span className="font-mono text-dark-400 flex items-center gap-1">
                          {tx.txHash.slice(0, 16)}...
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Gas Used</span>
                        <span className="font-mono text-dark-400">
                          {tx.gasUsed?.toLocaleString() || '~195,000'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Proof Size</span>
                        <span className="font-mono text-dark-400">48 KB</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
