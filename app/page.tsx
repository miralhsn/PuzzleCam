'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Script from 'next/script';

import type { GamePhase, GridSize } from './types';
import { useCamera }        from './hooks/useCamera';
import { CameraView }       from './components/camera/CameraView';
import { PuzzleScreen }     from './components/puzzle/PuzzleScreen';
import { PermissionScreen } from './components/ui/PermissionScreen';

export default function GameOrchestrator() {
  const [phase,    setPhase]    = useState<GamePhase>('permission');
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [captured, setCaptured] = useState<string>('');

  const { videoRef, status, error, startCamera } = useCamera();

  const handleAllow = useCallback(async () => {
    setPhase('camera');
    // Wait two rAF ticks so React flushes + <video> mounts
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    await startCamera();
  }, [startCamera]);

  const handleCapture = useCallback((dataUrl: string) => {
    setCaptured(dataUrl);
    setTimeout(() => setPhase('puzzle'), 350);
  }, []);

  const handleNewPhoto = useCallback(() => setPhase('camera'), []);

  const showCamera = phase === 'camera' || phase === 'capturing';
  const showPuzzle = phase === 'puzzle' && !!captured;

  return (
    <>
      {/* Load MediaPipe from local /public/mediapipe/ — avoids CDN version mismatch */}
      <Script src="/mediapipe/hands.js" strategy="afterInteractive" />

      <main style={{
        width:'100%', minHeight:'100vh',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        background:'#000', overflow:'hidden', position:'relative',
      }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 40%, rgba(0,60,30,.35) 0%, transparent 55%)' }}/>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 70% 60%, rgba(0,40,80,.25) 0%, transparent 55%)' }}/>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'permission' && (
            <PermissionScreen key="perm" onAllow={handleAllow} error={error} />
          )}
        </AnimatePresence>

        {showCamera && (
          <div style={{
            display:'flex', flexDirection:'column',
            alignItems:'center', gap:48,
            position:'relative', zIndex:10,
          }}>
            <CameraView
              videoRef={videoRef}
              cameraActive={showCamera}
              gridSize={gridSize}
              onGridChange={setGridSize}
              onCapture={handleCapture}
            />
          </div>
        )}

        <AnimatePresence>
          {showPuzzle && (
            <PuzzleScreen
              key="puzzle"
              capturedImage={captured}
              gridSize={gridSize}
              onNewPhoto={handleNewPhoto}
            />
          )}
        </AnimatePresence>

        {status === 'error' && error && (
          <div style={{
            position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
            background:'rgba(40,0,0,0.9)', border:'1px solid rgba(255,60,60,0.35)',
            borderRadius:12, padding:'10px 20px',
            color:'rgba(255,120,120,0.9)', fontSize:13, zIndex:999,
          }}>
            {error}
          </div>
        )}
      </main>
    </>
  );
}
