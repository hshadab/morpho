import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { DemoState } from '../lib/types';

interface StepIndicatorProps {
  currentStep: DemoState['step'];
}

const STEPS = [
  { key: 'policy', label: 'Define Policy', description: 'Set spending constraints' },
  { key: 'authorize', label: 'Authorize Agent', description: 'Grant permissions' },
  { key: 'running', label: 'Agent Running', description: 'Autonomous operations' },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = step.key === currentStep;

        return (
          <React.Fragment key={step.key}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-morpho-500 text-white ring-4 ring-morpho-500/30'
                    : 'bg-dark-700 text-dark-400'
                }`}
              >
                {isComplete ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <div className="hidden sm:block">
                <div
                  className={`font-medium ${
                    isCurrent ? 'text-white' : isComplete ? 'text-dark-300' : 'text-dark-500'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-xs text-dark-500">{step.description}</div>
              </div>
            </motion.div>

            {index < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-24 h-0.5 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-dark-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
