'use client';

import { useRef, useEffect, useState, useCallback, memo } from 'react';
import type { FrameRect, HandLandmark, GridSize } from '../../types';
import { useHandTracking }     from '../../hooks/useHandTracking';
import { useGestureDetection } from '../../hooks/useGestureDetection';
import { drawHandSkeleton, drawFrameOverlay } from '../../lib/geometry';
import { captureFrame } from '../../lib/capture';
import { HUD }                from './HUD';
import { FingerFrameOverlay } from './FingerFrameOverlay';
import { CameraFlash }        from './CameraFlash';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  gridSize: GridSize;
  onGridChange: (n: GridSize) => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraView = memo(function CameraView({
  videoRef,
  cameraActive,
  gridSize,
  onGridChange,
  onCapture,
}: Props) {
  const overlayRef       = useRef<HTMLCanvasElement | null>(null);
  const rafRef           = useRef<number>(0);
  const animPhase        = useRef(0);
  const fpsCountRef      = useRef(0);
  const fpsTimerRef      = useRef(performance.now());
  const frameRectRef     = useRef<FrameRect | null>(null);
  const stableRef        = useRef(false);
  const landmarksRef     = useRef<HandLandmark[][]>([]);
  const captureActiveRef = useRef(false);

  const [fps,    setFps]    = useState(0);
  const [handsN, setHandsN] = useState(0);
  const [stable, setStable] = useState(false);
  const [flash,  setFlash]  = useState(false);

  const { detect, status: aiStatus, loadingMsg } = useHandTracking((lm) => {
    landmarksRef.current = lm;
  });

  // Keep aiStatus in a ref so the rAF loop always sees the latest value
  const aiStatusRef = useRef(aiStatus);
  aiStatusRef.current = aiStatus;

  const onFrameUpdate = useCallback((rect: FrameRect | null, isStable: boolean) => {
    frameRectRef.current = rect;
    stableRef.current    = isStable;
    setStable(isStable);
  }, []);

  const onPinch = useCallback(() => {
    if (captureActiveRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    captureActiveRef.current = true;
    setFlash(true);
    onCapture(captureFrame(video));
    setTimeout(() => { captureActiveRef.current = false; }, 2500);
  }, [videoRef, onCapture]);

  const { process } = useGestureDetection({ onFrameUpdate, onPinch });

  // Single rAF loop — drives overlay canvas only (video renders itself)
  useEffect(() => {
    if (!cameraActive) return;
    let running = true;

    function loop() {
      if (!running) return;
      rafRef.current = requestAnimationFrame(loop);

      const video   = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay || video.videoWidth === 0) return;

      const W = video.videoWidth;
      const H = video.videoHeight;

      if (overlay.width !== W || overlay.height !== H) {
        overlay.width  = W;
        overlay.height = H;
      }

      const ctx = overlay.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, W, H);

      if (aiStatusRef.current === 'ready') {
        detect(video, performance.now());
      }

      const landmarks = landmarksRef.current;
      for (const hand of landmarks) drawHandSkeleton(ctx, hand, W, H);

      process(landmarks, W, H);
      animPhase.current = (animPhase.current + 0.008) % 1;
      const rect = frameRectRef.current;
      if (rect) drawFrameOverlay(ctx, rect, stableRef.current, animPhase.current);

      fpsCountRef.current++;
      const now = performance.now();
      if (now - fpsTimerRef.current >= 500) {
        setFps(Math.round(fpsCountRef.current * 1000 / (now - fpsTimerRef.current)));
        setHandsN(landmarks.length);
        fpsCountRef.current = 0;
        fpsTimerRef.current = now;
      }
    }

    loop();
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  // Only restart loop if cameraActive changes — everything else uses refs
  }, [cameraActive, videoRef, detect, process]);

  return (
    <div style={{
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 'min(720px, 90vw)',
      aspectRatio: '4/3',
      background: '#0a0a0a',
      boxShadow: '0 0 60px rgba(0,200,100,.07), 0 0 0 1px rgba(255,255,255,.07)',
    }}>

      {/* Video renders itself — browser native pipeline, no drawImage */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay playsInline muted
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: 'block',
        }}
      />

      {/* Transparent overlay canvas for skeleton + gesture rect */}
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          transform: 'scaleX(-1)',
          pointerEvents: 'none',
          display: 'block',
        }}
      />

      {/* AI status — only while loading, hidden once ready */}
      {aiStatus === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 25,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: 'rgba(0,220,100,0.8)',
            animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 260 }}>
            {loadingMsg}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            First load only — cached after
          </p>
        </div>
      )}

      {aiStatus === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 25,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'rgba(0,0,0,0.7)',
        }}>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,100,100,0.9)' }}>⚠ Hand tracking failed</p>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', maxWidth: 280, textAlign: 'center' }}>{loadingMsg}</p>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 8, padding: '6px 18px', borderRadius: 99,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer',
          }}>Reload</button>
        </div>
      )}

      <FingerFrameOverlay ready={stable} />
      <HUD fps={fps} handsCount={handsN} gridSize={gridSize} onGridChange={onGridChange} />
      <CameraFlash trigger={flash} onDone={() => setFlash(false)} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
});
