'use client';

import { motion } from 'framer-motion';
import type { GridSize } from '../../types';

interface Props {
  onAllow: () => void;
  onGridChange: (n: GridSize) => void;
  gridSize: GridSize;
  error: string | null;
}

export function PermissionScreen({ onAllow, onGridChange, gridSize, error }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 100,
        background: '#000', overflow: 'hidden', padding: '24px 16px',
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: '#00e064', filter: 'blur(80px)', opacity: 0.12,
            top: -80, left: -100,
          }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: '#00c8ff', filter: 'blur(80px)', opacity: 0.12,
            bottom: -60, right: -60,
          }}
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 25, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: 200, height: 200, borderRadius: '50%',
            background: '#a78bfa', filter: 'blur(80px)', opacity: 0.1,
            top: '40%', left: '60%',
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, maxWidth: 500, width: '100%' }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(0,220,100,0.1)', border: '1px solid rgba(0,220,100,0.25)',
            borderRadius: 99, padding: '5px 14px', fontSize: 11, fontWeight: 500,
            color: 'rgba(80,255,140,0.9)', letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e064' }}
          />
          AI-powered · no touch needed
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ fontSize: 'clamp(36px,6vw,52px)', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 12 }}
        >
          AI{' '}
          <span style={{ background: 'linear-gradient(135deg,#00e064,#00c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Puzzle
          </span>{' '}
          Camera
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24, maxWidth: 380 }}
        >
          Frame a shot with your hands, pinch to capture, then solve the puzzle you just created.
        </motion.p>

        {/* Hand animation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ position: 'relative', width: 260, height: 120, marginBottom: 20 }}
        >
          <HandAnimation />
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}
        >
          {[
            { n: 1, icon: '📸', label: 'Make a frame' },
            { n: 2, icon: '🤏', label: 'Pinch to capture' },
            { n: 3, icon: '🧩', label: 'Solve the puzzle' },
          ].map(s => (
            <div key={s.n} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'rgba(255,255,255,0.55)',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(0,220,100,0.15)', border: '1px solid rgba(0,220,100,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'rgba(0,220,100,0.8)', fontWeight: 600, flexShrink: 0,
              }}>{s.n}</div>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              {s.label}
            </div>
          ))}
        </motion.div>

        {/* Grid selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}
        >
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Grid size:</span>
          {([3, 4, 5] as GridSize[]).map(n => (
            <button
              key={n}
              onClick={() => onGridChange(n)}
              style={{
                padding: '4px 13px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${gridSize === n ? 'rgba(0,180,255,0.45)' : 'rgba(255,255,255,0.1)'}`,
                background: gridSize === n ? 'rgba(0,180,255,0.15)' : 'transparent',
                color: gridSize === n ? 'rgba(80,200,255,0.9)' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
              }}
            >{n}×{n}</button>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {error ? (
            <div style={{
              background: 'rgba(40,0,0,0.8)', border: '1px solid rgba(255,60,60,0.3)',
              borderRadius: 12, padding: '10px 20px', color: 'rgba(255,120,120,0.9)',
              fontSize: 13, textAlign: 'center', maxWidth: 320,
            }}>
              {error}<br />
              <span style={{ fontSize: 11, opacity: 0.6 }}>Check camera permissions and reload.</span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAllow}
              style={{
                padding: '13px 36px', borderRadius: 99, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', letterSpacing: '0.01em',
                background: 'linear-gradient(135deg,rgba(0,220,100,0.2),rgba(0,200,100,0.12))',
                border: '1px solid rgba(0,220,100,0.45)',
                color: 'rgba(80,255,140,0.95)',
              }}
            >
              Allow Camera & Play
            </motion.button>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}
        >
          No data leaves your device · Built with MediaPipe Tasks Vision · Next.js 16
        </motion.p>
      </div>
    </motion.div>
  );
}

function HandAnimation() {
  return (
    <>
      <style>{`
        @keyframes hLeft{0%,100%{transform:translate(0,0) rotate(0deg);opacity:1}30%{transform:translate(20px,-5px) rotate(-10deg);opacity:1}70%{transform:translate(20px,-5px) rotate(-10deg);opacity:1}80%{opacity:0}85%{opacity:0}86%{opacity:1}}
        @keyframes hRight{0%,100%{transform:translate(0,0) rotate(0deg);opacity:1}30%{transform:translate(-20px,-5px) rotate(10deg);opacity:1}70%{transform:translate(-20px,-5px) rotate(10deg);opacity:1}80%{opacity:0}85%{opacity:0}86%{opacity:1}}
        @keyframes pLeft{0%,74%,86%,100%{opacity:0}76%,84%{opacity:1;transform:translate(20px,-5px) rotate(-10deg) scale(0.85)}}
        @keyframes pRight{0%,74%,86%,100%{opacity:0}76%,84%{opacity:1;transform:translate(-20px,-5px) rotate(10deg) scale(0.85)}}
        @keyframes lGrow{0%,25%,82%,100%{transform:scaleX(0);opacity:0}35%,72%{transform:scaleX(1);opacity:1}}
        @keyframes lGrowV{0%,25%,82%,100%{transform:scaleY(0);opacity:0}35%,72%{transform:scaleY(1);opacity:1}}
        @keyframes cShow{0%,28%,84%,100%{opacity:0}38%,74%{opacity:1}}
        @keyframes fRing{0%,73%,100%{width:0;height:0;opacity:1;border-color:rgba(255,255,255,0.8)}77%{width:100px;height:100px;opacity:0;border-color:rgba(255,255,255,0)}}
      `}</style>
      {/* Frame lines */}
      <div style={{ position:'absolute', height:2, background:'rgba(0,220,100,0.7)', top:32, left:52, right:52, transformOrigin:'center', animation:'lGrow 3s ease-in-out infinite' }} />
      <div style={{ position:'absolute', height:2, background:'rgba(0,220,100,0.7)', bottom:8, left:52, right:52, transformOrigin:'center', animation:'lGrow 3s ease-in-out infinite' }} />
      <div style={{ position:'absolute', width:2, background:'rgba(0,220,100,0.7)', top:32, bottom:8, left:52, transformOrigin:'center', animation:'lGrowV 3s ease-in-out infinite' }} />
      <div style={{ position:'absolute', width:2, background:'rgba(0,220,100,0.7)', top:32, bottom:8, right:52, transformOrigin:'center', animation:'lGrowV 3s ease-in-out infinite' }} />
      {/* Corners */}
      {[
        { top:30, left:50, borderWidth:'2px 0 0 2px' },
        { top:30, right:50, borderWidth:'2px 2px 0 0' },
        { bottom:6, left:50, borderWidth:'0 0 2px 2px' },
        { bottom:6, right:50, borderWidth:'0 2px 2px 0' },
      ].map((s, i) => (
        <div key={i} style={{ position:'absolute', width:14, height:14, borderColor:'rgba(0,220,100,0.9)', borderStyle:'solid', ...s, animation:'cShow 3s ease-in-out infinite' }} />
      ))}
      {/* Flash ring */}
      <div style={{ position:'absolute', top:'50%', left:'50%', width:0, height:0, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.8)', transform:'translate(-50%,-50%)', animation:'fRing 3s ease-in-out infinite' }} />
      {/* Hands */}
      <div style={{ position:'absolute', left:10, top:22, fontSize:40, filter:'drop-shadow(0 0 10px rgba(0,220,100,0.4))', animation:'hLeft 3s ease-in-out infinite' }}>🤙</div>
      <div style={{ position:'absolute', right:10, top:22, fontSize:40, filter:'drop-shadow(0 0 10px rgba(0,220,100,0.4))', transform:'scaleX(-1)', animation:'hRight 3s ease-in-out infinite' }}>🤙</div>
      <div style={{ position:'absolute', left:10, top:22, fontSize:40, opacity:0, animation:'pLeft 3s ease-in-out infinite' }}>🤏</div>
      <div style={{ position:'absolute', right:10, top:22, fontSize:40, opacity:0, transform:'scaleX(-1)', animation:'pRight 3s ease-in-out infinite' }}>🤏</div>
    </>
  );
}
