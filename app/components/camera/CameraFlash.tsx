'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CameraFlash({ trigger, onDone }: { trigger: boolean; onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          key="flash"
          style={{ position: 'fixed', inset: 0, background: '#fff', pointerEvents: 'none', zIndex: 200 }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          onAnimationComplete={() => doneRef.current()}
        />
      )}
    </AnimatePresence>
  );
}
