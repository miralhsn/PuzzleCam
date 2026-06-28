'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  trigger: boolean;
  onDone: () => void;
}

export function CameraFlash({ trigger, onDone }: Props) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          key="flash"
          className="fixed inset-0 z-[200] pointer-events-none bg-white"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          onAnimationComplete={() => doneRef.current()}
        />
      )}
    </AnimatePresence>
  );
}
