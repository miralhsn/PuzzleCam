'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  ready: boolean;
}

export function FingerFrameOverlay({ ready }: Props) {
  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          key="ready"
          className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="w-20 h-20 rounded-full border-2 border-emerald-400/70 flex items-center justify-center mb-3"
            animate={{ boxShadow: ['0 0 0 0 rgba(0,220,100,0.4)', '0 0 0 14px rgba(0,220,100,0)'] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <span className="text-2xl">✓</span>
          </motion.div>
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-emerald-400">
            Ready — Pinch!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
