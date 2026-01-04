import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Github, ExternalLink } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="w-10 h-10 bg-gradient-to-br from-morpho-500 to-purple-600 rounded-xl flex items-center justify-center"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-white">Morpho ZKML</h1>
              <p className="text-xs text-dark-400">Spending Proofs Demo</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/hshadab/spendingproofs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-dark-300 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              Spending Proofs
            </a>
            <a
              href="https://github.com/morpho-org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-dark-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Morpho
            </a>
            <div className="h-6 w-px bg-dark-700" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-dark-400">Testnet</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
