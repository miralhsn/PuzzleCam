'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { PuzzleState, GridSize } from '../../types';
import { createPuzzle, countCorrect, isSolved } from '../../lib/puzzle';
import { shuffleGuaranteed }  from '../../utils/shuffle';
import { formatTime }         from '../../utils/math';
import { PuzzleBoard }        from './PuzzleBoard';
import { WinModal }           from '../ui/WinModal';
import { Confetti }           from '../ui/Confetti';

interface Props {
  capturedImage: string;
  gridSize: GridSize;
  onNewPhoto: () => void;
}

export function PuzzleScreen({ capturedImage, gridSize, onNewPhoto }: Props) {
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [moves,       setMoves]       = useState(0);
  const [seconds,     setSeconds]     = useState(0);
  const [solved,      setSolved]      = useState(false);
  const [confetti,    setConfetti]    = useState(false);
  const [peeking,     setPeeking]     = useState(false);
  const [progress,    setProgress]    = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  // --- Init puzzle ---
  const initPuzzle = useCallback(async () => {
    const ps = await createPuzzle(capturedImage, gridSize);
    setPuzzleState(ps);
    setMoves(0);
    setSolved(false);
    setConfetti(false);
    setProgress(0);
    setSeconds(0);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [capturedImage, gridSize]);

  useEffect(() => { initPuzzle(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [initPuzzle]);

  // --- Move handler ---
  const onMove = useCallback((newOrder: string[], didSolve: boolean) => {
    setMoves(m => m + 1);
    setPuzzleState(prev => {
      if (!prev) return prev;
      const next = { ...prev, order: newOrder };
      const correct = countCorrect(next);
      setProgress(Math.round(correct / next.pieces.length * 100));
      return next;
    });

    if (didSolve) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => { setSolved(true); setConfetti(true); }, 350);
    }
  }, []);

  // --- Reshuffle ---
  const reshuffle = useCallback(() => {
    if (!puzzleState) return;
    const newOrder = shuffleGuaranteed(puzzleState.pieces.map(p => p.id));
    setPuzzleState(prev => prev ? { ...prev, order: newOrder } : prev);
    setMoves(0);
    setSolved(false);
    setProgress(0);
    startTimeRef.current = Date.now();
    setSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [puzzleState]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,150,80,.05) 0%, transparent 70%)' }}
      />

      {/* Stats bar */}
      <div className="flex gap-4 items-center z-10">
        {[
          { label: 'Time',  value: formatTime(seconds) },
          { label: 'Moves', value: String(moves) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-2.5 text-center min-w-[72px]">
            <div className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">{label}</div>
            <div className="text-lg font-semibold text-white">{value}</div>
          </div>
        ))}
        <div className="flex flex-col gap-1.5 items-center">
          <div className="text-[9px] uppercase tracking-widest text-white/30">Progress</div>
          <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-[10px] text-white/30">{progress}%</div>
        </div>
      </div>

      {/* Board */}
      <div className="relative z-10">
        {puzzleState ? (
          <PuzzleBoard state={puzzleState} onMove={onMove} />
        ) : (
          <div className="w-80 h-80 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-emerald-400/70 animate-spin" />
          </div>
        )}

        {/* Peek overlay */}
        <AnimatePresence>
          {peeking && puzzleState && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="reference"
                className="w-full h-full object-cover"
                style={{ opacity: 0.55 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex gap-2 z-10">
        <button
          onClick={reshuffle}
          className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-white/55 text-xs hover:bg-white/[0.08] hover:border-white/20 transition-all"
        >
          Shuffle again
        </button>
        <button
          onMouseDown={() => setPeeking(true)}
          onMouseUp={() => setPeeking(false)}
          onMouseLeave={() => setPeeking(false)}
          onTouchStart={() => setPeeking(true)}
          onTouchEnd={() => setPeeking(false)}
          className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-white/55 text-xs hover:bg-white/[0.08] hover:border-white/20 transition-all"
        >
          Hold to peek 👁
        </button>
        <button
          onClick={onNewPhoto}
          className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-white/55 text-xs hover:bg-white/[0.08] hover:border-white/20 transition-all"
        >
          New photo
        </button>
      </div>

      <Confetti active={confetti} />

      <WinModal
        open={solved}
        moves={moves}
        seconds={seconds}
        capturedImage={capturedImage}
        onPlayAgain={initPuzzle}
        onNewPhoto={onNewPhoto}
      />
    </motion.div>
  );
}
