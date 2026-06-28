'use client';

import { useRef, useCallback, useEffect, useState, memo } from 'react';
import type { FrameRect, HandLandmark, GridSize } from '../../types';
import { useHandTracking }     from '../../hooks/useHandTracking';
import { useGestureDetection } from '../../hooks/useGestureDetection';
import { drawHandSkeleton, drawFrameOverlay } from '../../lib/geometry';
import { captureFrame }        from '../../lib/capture';
import { HUD }                 from './HUD';
import { FingerFrameOverlay }  from './FingerFrameOverlay';
import { CameraFlash }         from './CameraFlash';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onVideoMounted: (el: HTMLVideoElement | null) => void;
  cameraActive: boolean;
  gridSize: GridSize;
  onGridChange: (n: GridSize) => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraView = memo(function CameraView({
  videoRef,
  onVideoMounted,
  cameraActive,
  gridSize,
  onGridChange,
  onCapture,
}: Props) {
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const mirrorRef  = useRef<HTMLCanvasElement | null>(null);
  const mirrorRaf  = useRef<number>(0);
  const animRaf    = useRef<number>(0);

  const [fps,       setFps]       = useState(0);
  const [handsN,    setHandsN]    = useState(0);
  const [stable,    setStable]    = useState(false);
  const [flash,     setFlash]     = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const fpsFrames  = useRef(0);
  const fpsLast    = useRef(performance.now());
  const animPhase  = useRef(0);
  const frameRectR = useRef<FrameRect | null>(null);
  const stableR    = useRef(false);

  // ── Watch for video becoming ready ──────────────────────────────────────
  // Poll because the video element might start playing after mount
  useEffect(() => {
    if (!cameraActive) return;
    let timer: ReturnType<typeof setInterval>;
    let cancelled = false;

    function check() {
      const v = videoRef.current;
      if (!cancelled && v && v.readyState >= 2 && v.videoWidth > 0) {
        setVideoReady(true);
        clearInterval(timer);
      }
    }

    timer = setInterval(check, 100);
    check(); // immediate check
    return () => { cancelled = true; clearInterval(timer); };
  }, [cameraActive, videoRef]);

  // ── Mirror loop ──────────────────────────────────────────────────────────
  // Draws the video frame flipped onto a visible canvas every rAF.
  // We do NOT use CSS transform on <video> — that causes black screen on some GPUs.
  useEffect(() => {
    if (!cameraActive || !videoReady) return;
    let running = true;

    function loop() {
      if (!running) return;

      const video  = videoRef.current;
      const canvas = mirrorRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        const W = video.videoWidth;
        const H = video.videoHeight;

        // Sync canvas resolution to video once
        if (canvas.width !== W || canvas.height !== H) {
          canvas.width  = W;
          canvas.height = H;
          const ov = overlayRef.current;
          if (ov) { ov.width = W; ov.height = H; }
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (ctx) {
          ctx.save();
          ctx.translate(W, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, W, H);
          ctx.restore();
        }
      }

      mirrorRaf.current = requestAnimationFrame(loop);
    }

    loop();
    return () => { running = false; cancelAnimationFrame(mirrorRaf.current); };
  }, [cameraActive, videoReady, videoRef]);

  // ── FPS counter ──────────────────────────────────────────────────────────
  const tickFps = useCallback(() => {
    fpsFrames.current++;
    const now = performance.now();
    if (now - fpsLast.current >= 500) {
      setFps(Math.round(fpsFrames.current * 1000 / (now - fpsLast.current)));
      fpsFrames.current = 0;
      fpsLast.current   = now;
    }
  }, []);

  // ── Gesture callbacks ────────────────────────────────────────────────────
  const onFrameUpdate = useCallback((rect: FrameRect | null, isStable: boolean) => {
    frameRectR.current = rect;
    stableR.current    = isStable;
    setStable(isStable);
  }, []);

  const onPinch = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setFlash(true);
    onCapture(captureFrame(video));
  }, [videoRef, onCapture]);

  const { process } = useGestureDetection(
    overlayRef.current?.width  ?? 1280,
    overlayRef.current?.height ?? 720,
    { onFrameUpdate, onPinch }
  );

  // ── Hand results → draw skeleton ─────────────────────────────────────────
  const onHandResults = useCallback((landmarks: HandLandmark[][]) => {
    tickFps();
    setHandsN(landmarks.length);

    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    landmarks.forEach(lm => drawHandSkeleton(ctx, lm, canvas.width, canvas.height));
    process(landmarks);
  }, [tickFps, process]);

  useHandTracking({ videoRef, enabled: cameraActive && videoReady, onResults: onHandResults });

  // ── Frame overlay animation loop ─────────────────────────────────────────
  useEffect(() => {
    if (!cameraActive) return;
    let running = true;

    function animLoop() {
      if (!running) return;
      animPhase.current = (animPhase.current + 0.008) % 1;
      const canvas = overlayRef.current;
      const rect   = frameRectR.current;
      if (canvas && rect) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawFrameOverlay(ctx, rect, stableR.current, animPhase.current);
      }
      animRaf.current = requestAnimationFrame(animLoop);
    }
    animLoop();
    return () => { running = false; cancelAnimationFrame(animRaf.current); };
  }, [cameraActive]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden w-full"
      style={{
        maxWidth: 'min(720px, 90vw)',
        aspectRatio: '4/3',
        background: '#0a0a0a',
        boxShadow: '0 0 60px rgba(0,200,100,.07), 0 0 0 1px rgba(255,255,255,.07)',
      }}
    >
      {/* Real <video> — hidden, used only as pixel source for MediaPipe + mirror canvas */}
      <video
        ref={onVideoMounted}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '1px', height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Visible mirror canvas — renders the flipped video frame */}
      <canvas
        ref={mirrorRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          display: 'block',
        }}
      />

      {/* Loading state — shown until video starts producing frames */}
      {!videoReady && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 30,
        }}>
          <div style={{
            width: 36, height: 36,
            border: '2px solid rgba(255,255,255,0.08)',
            borderTopColor: 'rgba(0,220,100,0.7)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Starting camera…</p>
        </div>
      )}

      {/* Landmark / gesture overlay canvas */}
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
        }}
      />

      <FingerFrameOverlay ready={stable} />
      <HUD fps={fps} handsCount={handsN} gridSize={gridSize} onGridChange={onGridChange} />
      <CameraFlash trigger={flash} onDone={() => setFlash(false)} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
});
