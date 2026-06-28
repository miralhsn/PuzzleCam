'use client';

import { useRef, useCallback } from 'react';
import type { HandLandmark, FrameRect } from '../types';
import { buildFrameRect, detectPinch } from '../utils/gestures';
import { averagePoints } from '../utils/math';

const SMOOTH_WINDOW = 8;
const STABLE_MS     = 500;
const PINCH_COOLDOWN_MS = 2000;

interface GestureCallbacks {
  onFrameUpdate: (rect: FrameRect | null, stable: boolean) => void;
  onPinch: () => void;
}

export function useGestureDetection(
  canvasWidth: number,
  canvasHeight: number,
  callbacks: GestureCallbacks
) {
  const smoothBuf     = useRef<{ x: number; y: number }[][]>([]);
  const stableStartRef = useRef<number | null>(null);
  const lastPinchRef  = useRef<number>(0);
  const readyRef      = useRef(false);

  const process = useCallback(
    (landmarks: HandLandmark[][]) => {
      if (landmarks.length < 2) {
        smoothBuf.current = [];
        stableStartRef.current = null;
        readyRef.current = false;
        callbacks.onFrameUpdate(null, false);
        return;
      }

      const W = canvasWidth, H = canvasHeight;

      // Collect thumb+index tips from all hands
      const rawPts = landmarks.flatMap(lm => [
        { x: lm[4].x, y: lm[4].y },
        { x: lm[8].x, y: lm[8].y },
      ]);

      smoothBuf.current.push(rawPts);
      if (smoothBuf.current.length > SMOOTH_WINDOW) smoothBuf.current.shift();

      const averaged = averagePoints(smoothBuf.current);

      // Convert to canvas coords (mirrored)
      const canvasPts = averaged.map(p => ({ x: (1 - p.x) * W, y: p.y * H }));
      const xs = canvasPts.map(p => p.x);
      const ys = canvasPts.map(p => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const fw = maxX - minX, fh = maxY - minY;

      if (fw < 80 || fh < 60 || fw > W * 0.95 || fh > H * 0.95) {
        stableStartRef.current = null;
        readyRef.current = false;
        callbacks.onFrameUpdate(null, false);
        return;
      }

      const rect: FrameRect = { x: minX, y: minY, w: fw, h: fh };
      const now = performance.now();

      if (!stableStartRef.current) stableStartRef.current = now;
      const stable = now - stableStartRef.current >= STABLE_MS;

      if (stable && !readyRef.current) readyRef.current = true;
      if (!stable)                      readyRef.current = false;

      callbacks.onFrameUpdate(rect, stable);

      // Pinch detection — only when stable
      if (stable && now - lastPinchRef.current > PINCH_COOLDOWN_MS) {
        if (detectPinch(landmarks, W, H)) {
          lastPinchRef.current = now;
          callbacks.onPinch();
        }
      }
    },
    [canvasWidth, canvasHeight, callbacks]
  );

  return { process };
}
