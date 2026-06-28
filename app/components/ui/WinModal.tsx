'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatTime }              from '../../utils/math';

interface Props {
  open: boolean;
  moves: number;
  seconds: number;
  capturedImage: string;
  onPlayAgain: () => void;
  onNewPhoto: () => void;
}

export function WinModal({ open, moves, seconds, capturedImage, onPlayAgain, onNewPhoto }: Props) {
  const download = () => {
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `puzzle-${Date.now()}.jpg`;
    a.click();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[180] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-[rgba(8,14,8,0.97)] border border-emerald-500/25 rounded-2xl px-10 py-9 text-center max-w-sm w-full mx-4"
            style={{ boxShadow: '0 0 60px rgba(0,220,100,0.1)' }}
            initial={{ scale: 0.88, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-white mb-1">Puzzle solved!</h2>
            <p className="text-sm text-white/40 mb-6">Great work</p>

            <div className="flex gap-4 justify-center mb-7">
              {[
                { label: 'Time',  value: formatTime(seconds) },
                { label: 'Moves', value: String(moves) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.03] rounded-xl px-5 py-3 min-w-[76px]">
                  <div className="text-[10px] uppercase tracking-widest text-white/35 mb-1">{label}</div>
                  <div className="text-xl font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onPlayAgain}
                className="w-full py-2.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-all"
              >
                Play again
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onNewPhoto}
                  className="flex-1 py-2.5 rounded-full bg-white/[0.04] border border-white/10 text-white/60 text-sm hover:bg-white/[0.08] transition-all"
                >
                  New photo
                </button>
                <button
                  onClick={download}
                  className="flex-1 py-2.5 rounded-full bg-white/[0.04] border border-white/10 text-white/60 text-sm hover:bg-white/[0.08] transition-all"
                >
                  Download ↓
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
