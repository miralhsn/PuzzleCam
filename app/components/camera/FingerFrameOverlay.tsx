'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function FingerFrameOverlay({ ready }: { ready: boolean }) {
  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          key="ready"
          style={{
            position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '2px solid rgba(0,220,100,.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}
            animate={{ boxShadow: ['0 0 0 0 rgba(0,220,100,0.4)', '0 0 0 14px rgba(0,220,100,0)'] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <span style={{ fontSize: 24 }}>✓</span>
          </motion.div>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(80,255,140,.9)' }}>
            Ready — Pinch!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
