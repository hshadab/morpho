import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Info } from 'lucide-react';

interface DemoAnnotationProps {
  title: string;
  description: string;
  highlight?: 'morpho' | 'zkml' | 'policy' | 'proof';
  position?: 'top' | 'bottom' | 'left' | 'right';
  isVisible: boolean;
  step?: number;
  totalSteps?: number;
}

const HIGHLIGHT_COLORS = {
  morpho: 'from-blue-500 to-cyan-500',
  zkml: 'from-purple-500 to-pink-500',
  policy: 'from-green-500 to-emerald-500',
  proof: 'from-orange-500 to-yellow-500',
};

const HIGHLIGHT_LABELS = {
  morpho: 'Morpho Integration',
  zkml: 'zkML Technology',
  policy: 'Policy Enforcement',
  proof: 'Proof Verification',
};

export function DemoAnnotation({
  title,
  description,
  highlight = 'morpho',
  isVisible,
  step,
  totalSteps,
}: DemoAnnotationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full px-4"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${HIGHLIGHT_COLORS[highlight]} opacity-20 blur-xl rounded-2xl`} />

            <div className="relative bg-dark-900/95 backdrop-blur-xl border border-dark-700 rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${HIGHLIGHT_COLORS[highlight]} text-white text-xs font-bold`}>
                    {HIGHLIGHT_LABELS[highlight]}
                  </div>
                  {step && totalSteps && (
                    <span className="text-dark-500 text-sm">
                      Step {step} of {totalSteps}
                    </span>
                  )}
                </div>
                <Sparkles className={`w-5 h-5 text-${highlight === 'morpho' ? 'cyan' : highlight === 'zkml' ? 'purple' : highlight === 'policy' ? 'green' : 'orange'}-400`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-dark-300 leading-relaxed">{description}</p>

              {/* Progress indicator */}
              {step && totalSteps && (
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < step ? `bg-gradient-to-r ${HIGHLIGHT_COLORS[highlight]}` : 'bg-dark-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface FloatingHighlightProps {
  children: React.ReactNode;
  label: string;
  isActive: boolean;
  color?: 'morpho' | 'zkml' | 'policy' | 'proof';
}

export function FloatingHighlight({ children, label, isActive, color = 'morpho' }: FloatingHighlightProps) {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r ${HIGHLIGHT_COLORS[color]} text-white text-xs font-bold shadow-lg z-10`}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 rounded-xl ring-2 ring-offset-2 ring-offset-dark-900 ring-${color === 'morpho' ? 'cyan' : color === 'zkml' ? 'purple' : color === 'policy' ? 'green' : 'orange'}-500 pointer-events-none`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
