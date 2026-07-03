'use client';

import type { GridSize } from '../../types';

interface Props {
  fps: number;
  handsCount: number;
  gridSize: GridSize;
  onGridChange: (n: GridSize) => void;
}

export function HUD({ fps, handsCount, gridSize, onGridChange }: Props) {
  const handLabel =
    handsCount === 0 ? 'Searching for hands…' :
    handsCount === 1 ? '1 hand — need 2' : '2 hands detected ✓';

  const handColor = handsCount === 2
    ? { color: 'rgba(80,255,140,.9)', background: 'rgba(0,80,30,.5)', borderColor: 'rgba(0,230,100,.3)' }
    : { color: 'rgba(255,255,255,.6)', background: 'rgba(0,0,0,.4)', borderColor: 'rgba(255,255,255,.1)' };

  return (
    <>
      {/* Top-left */}
      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 20, pointerEvents: 'none' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.8)' }}>
          AI Puzzle Camera
        </span>
        <span style={{ ...pill, ...handColor }}>{handLabel}</span>
      </div>

      {/* Top-right */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 20, pointerEvents: 'none' }}>
        <span style={{ ...pill, color: 'rgba(255,255,255,.5)', background: 'rgba(0,0,0,.4)', borderColor: 'rgba(255,255,255,.1)' }}>{fps} FPS</span>
        <span style={{ ...pill, color: 'rgba(80,255,140,.9)', background: 'rgba(0,80,30,.5)', borderColor: 'rgba(0,230,100,.3)' }}>● Live</span>
      </div>

      {/* Bottom instructions */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 20, pointerEvents: 'none' }}>
        {['📸 Make a frame', '🤏 Pinch to capture', '🧩 Solve the puzzle'].map(t => (
          <span key={t} style={{ ...pill, color: 'rgba(255,255,255,.55)', background: 'rgba(0,0,0,.5)', borderColor: 'rgba(255,255,255,.1)', fontSize: 11 }}>{t}</span>
        ))}
      </div>

      {/* Grid selector */}
      <div style={{ position: 'absolute', bottom: -44, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 20 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Grid:</span>
        {([3, 4, 5] as GridSize[]).map(n => (
          <button
            key={n}
            onClick={() => onGridChange(n)}
            style={{
              fontSize: 12, padding: '3px 12px', borderRadius: 999,
              border: `1px solid ${gridSize === n ? 'rgba(0,180,255,.5)' : 'rgba(255,255,255,.1)'}`,
              background: gridSize === n ? 'rgba(0,180,255,.15)' : 'transparent',
              color: gridSize === n ? 'rgba(80,200,255,.9)' : 'rgba(255,255,255,.4)',
              cursor: 'pointer', transition: 'all .2s',
            }}
          >
            {n}×{n}
          </button>
        ))}
      </div>
    </>
  );
}

const pill: React.CSSProperties = {
  fontSize: 12, padding: '3px 10px', borderRadius: 999,
  border: '1px solid', backdropFilter: 'blur(12px)', fontWeight: 500,
};
