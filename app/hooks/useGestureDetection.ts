'use client';

import { useRef } from 'react';
import type { HandLandmark, FrameRect } from '../types';

const SMOOTH_WINDOW      = 8;
const STABLE_MS          = 500;
const PINCH_THRESHOLD_PX = 32;
const PINCH_COOLDOWN_MS  = 2000;

interface GestureCallbacks {
  onFrameUpdate: (rect: FrameRect | null, stable: boolean) => void;
  onPinch: () => void;
}

/**
 * Pure gesture logic — no canvas, no DOM, no rAF.
 * Call process() inside your render loop with current landmarks + canvas dims.
 */
export function useGestureDetection(callbacks: GestureCallbacks) {
  // Keep callbacks in ref so callers don't need to worry about referential stability
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const smoothBuf      = useRef<{ x: number; y: number }[][]>([]);
  const stableStartRef = useRef<number | null>(null);
  const lastPinchRef   = useRef<number>(0);

  function process(
    landmarks: HandLandmark[][],
    canvasW: number,
    canvasH: number
  ): void {
    if (landmarks.length < 2) {
      smoothBuf.current    = [];
      stableStartRef.current = null;
      cbRef.current.onFrameUpdate(null, false);
      return;
    }

    // Collect normalised thumb (4) + index (8) tips from each hand
    const rawPts = landmarks.flatMap(lm => [
      { x: lm[4].x, y: lm[4].y },
      { x: lm[8].x, y: lm[8].y },
    ]);

    // Moving-average smoothing
    smoothBuf.current.push(rawPts);
    if (smoothBuf.current.length > SMOOTH_WINDOW) smoothBuf.current.shift();

    const n = rawPts.length;
    const averaged = Array.from({ length: n }, (_, i) => ({
      x: smoothBuf.current.reduce((s, f) => s + (f[i]?.x ?? 0), 0) / smoothBuf.current.length,
      y: smoothBuf.current.reduce((s, f) => s + (f[i]?.y ?? 0), 0) / smoothBuf.current.length,
    }));

    // Convert to canvas pixels (mirror x)
    const pts = averaged.map(p => ({ x: (1 - p.x) * canvasW, y: p.y * canvasH }));
    const xs  = pts.map(p => p.x);
    const ys  = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const fw = maxX - minX, fh = maxY - minY;

    // Reject degenerate frames
    if (fw < 80 || fh < 60 || fw > canvasW * 0.95 || fh > canvasH * 0.95) {
      stableStartRef.current = null;
      cbRef.current.onFrameUpdate(null, false);
      return;
    }

    const rect: FrameRect = { x: minX, y: minY, w: fw, h: fh };
    const now = performance.now();

    if (!stableStartRef.current) stableStartRef.current = now;
    const stable = now - stableStartRef.current >= STABLE_MS;

    cbRef.current.onFrameUpdate(rect, stable);

    // Pinch — only trigger when frame is stable and cooldown has passed
    if (stable && now - lastPinchRef.current > PINCH_COOLDOWN_MS) {
      const pinching = landmarks.some(lm => {
        const dx = (lm[4].x - lm[8].x) * canvasW;
        const dy = (lm[4].y - lm[8].y) * canvasH;
        return Math.sqrt(dx * dx + dy * dy) < PINCH_THRESHOLD_PX;
      });
      if (pinching) {
        lastPinchRef.current = now;
        cbRef.current.onPinch();
      }
    }
  }

  return { process };
}
