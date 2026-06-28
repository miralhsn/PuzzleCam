'use client';

import { motion } from 'framer-motion';

interface Props {
  onAllow: () => void;
  error: string | null;
}

export function PermissionScreen({ onAllow, error }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black gap-6 text-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,200,100,.08) 0%, transparent 70%)' }}
      />

      <div className="text-5xl">📸</div>
      <div>
        <h1 className="text-2xl font-semibold text-white mb-2">AI Puzzle Camera</h1>
        <p className="text-sm text-white/45 max-w-xs leading-relaxed">
          Frame a shot with your hands, pinch to capture, then drag the pieces to solve your puzzle.
        </p>
      </div>

      {error ? (
        <div className="bg-red-950/60 border border-red-500/30 rounded-xl px-5 py-3 max-w-xs">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-red-500/60 text-xs mt-1">Check browser permissions and reload.</p>
        </div>
      ) : (
        <button
          onClick={onAllow}
          className="px-7 py-3 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-medium text-sm hover:bg-emerald-500/30 active:scale-95 transition-all"
        >
          Allow camera access
        </button>
      )}

      <p className="text-[11px] text-white/18 mt-2">No data leaves your device</p>
    </motion.div>
  );
}
