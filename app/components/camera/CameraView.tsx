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
  const overlayRef   = useRef<HTMLCanvasElement | null>(null);
  const mirrorRef    = useRef<HTMLCanvasElement | null>(null);
  const mirrorRafRef = useRef<number>(0);
  const animRafRef   = useRef<number>(0);

  const [fps,        setFps]        = useState(0);
  const [handsN,     setHandsN]     = useState(0);
  const [stable,     setStable]     = useState(false);
  const [flash,      setFlash]      = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const fpsFrames  = useRef(0);
  const fpsLast    = useRef(performance.now());
  const animPhase  = useRef(0);
  const frameRectR = useRef<FrameRect | null>(null);
  const stableR    = useRef(false);

  // ── Poll until video has real pixel data ──────────────────────────────
  useEffect(() => {
    if (!cameraActive) { setVideoReady(false); return; }

    let cancelled = false;
    const timer = setInterval(() => {
      const v = videoRef.current;
      if (!cancelled && v && v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
        setVideoReady(true);
        clearInterval(timer);
      }
    }, 50);

    return () => { cancelled = true; clearInterval(timer); };
  }, [cameraActive, videoRef]);

  // ── Mirror loop: canvas-based flip (no CSS transform) ─────────────────
  useEffect(() => {
    if (!videoReady) return;
    let running = true;

    function loop() {
      if (!running) return;
      const video  = videoRef.current;
      const canvas = mirrorRef.current;
      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        const W = video.videoWidth;
        const H = video.videoHeight;
        if (canvas.width !== W || canvas.height !== H) {
          canvas.width  = W;
          canvas.height = H;
          const ov = overlayRef.current;
          if (ov) { ov.width = W; ov.height = H; }
        }
        const ctx = canvas.getContext('2d')!;
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, W, H);
        ctx.restore();
      }
      mirrorRafRef.current = requestAnimationFrame(loop);
    }
    loop();
    return () => { running = false; cancelAnimationFrame(mirrorRafRef.current); };
  }, [videoReady, videoRef]);

  // ── FPS ───────────────────────────────────────────────────────────────
  const tickFps = useCallback(() => {
    fpsFrames.current++;
    const now = performance.now();
    if (now - fpsLast.current >= 500) {
      setFps(Math.round(fpsFrames.current * 1000 / (now - fpsLast.current)));
      fpsFrames.current = 0;
      fpsLast.current   = now;
    }
  }, []);

  // ── Gesture callbacks ─────────────────────────────────────────────────
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

  // ── Hand results ──────────────────────────────────────────────────────
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

  useHandTracking({ videoRef, enabled: cameraActive, onResults: onHandResults });

  // ── Frame overlay anim ────────────────────────────────────────────────
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
      animRafRef.current = requestAnimationFrame(animLoop);
    }
    animLoop();
    return () => { running = false; cancelAnimationFrame(animRafRef.current); };
  }, [cameraActive]);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 'min(720px, 90vw)',
        aspectRatio: '4/3',
        background: '#0a0a0a',
        boxShadow: '0 0 60px rgba(0,200,100,.07), 0 0 0 1px rgba(255,255,255,.07)',
      }}
    >
      {/* Hidden video — pixel source only */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        playsInline
        muted
        style={{ position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none', top:0, left:0 }}
      />

      {/* Visible mirrored canvas */}
      <canvas
        ref={mirrorRef}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }}
      />

      {/* Loading spinner */}
      {!videoReady && (
        <div style={{
          position:'absolute', inset:0, zIndex:30,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12,
          background:'rgba(0,0,0,0.9)',
        }}>
          <div style={{
            width:36, height:36, borderRadius:'50%',
            border:'2px solid rgba(255,255,255,0.08)',
            borderTopColor:'rgba(0,220,100,0.8)',
            animation:'spin 0.8s linear infinite',
          }}/>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', margin:0 }}>Starting camera…</p>
        </div>
      )}

      {/* Landmark overlay */}
      <canvas
        ref={overlayRef}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
      />

      <FingerFrameOverlay ready={stable} />
      <HUD fps={fps} handsCount={handsN} gridSize={gridSize} onGridChange={onGridChange} />
      <CameraFlash trigger={flash} onDone={() => setFlash(false)} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
});
