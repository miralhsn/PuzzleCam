'use client';

import type { GridSize } from '../../types';

interface HUDProps {
  fps: number;
  handsCount: number;
  gridSize: GridSize;
  onGridChange: (n: GridSize) => void;
}

export function HUD({ fps, handsCount, gridSize, onGridChange }: HUDProps) {
  const handLabel =
    handsCount === 0 ? 'Searching for hands…'
    : handsCount === 1 ? '1 hand — need 2'
    : '2 hands detected ✓';

  const handColor =
    handsCount === 2 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/50'
    : 'text-white/60 border-white/10 bg-black/40';

  return (
    <>
      {/* Top-left */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-none">
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/80">
          AI Puzzle Camera
        </span>
        <span className={`pill ${handColor}`}>{handLabel}</span>
      </div>

      {/* Top-right */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20 pointer-events-none">
        <span className="pill text-white/50 bg-black/40 border-white/10">{fps} FPS</span>
        <span className="pill text-emerald-400 bg-emerald-950/50 border-emerald-500/30">● Live</span>
      </div>

      {/* Bottom instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 pointer-events-none">
        {[
          { icon: '📸', label: 'Make a frame' },
          { icon: '🤏', label: 'Pinch to capture' },
          { icon: '🧩', label: 'Solve the puzzle' },
        ].map(({ icon, label }) => (
          <span key={label} className="pill bg-black/50 border-white/10 text-white/60 text-[11px]">
            {icon} {label}
          </span>
        ))}
      </div>

      {/* Grid selector — pointer-events on */}
      <div className="absolute bottom-[-48px] left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        <span className="text-xs text-white/30">Grid:</span>
        {([3, 4, 5] as GridSize[]).map(n => (
          <button
            key={n}
            onClick={() => onGridChange(n)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              gridSize === n
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                : 'bg-transparent border-white/10 text-white/40 hover:border-white/25 hover:text-white/60'
            }`}
          >
            {n}×{n}
          </button>
        ))}
      </div>
    </>
  );
}
