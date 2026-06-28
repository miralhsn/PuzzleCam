import type { HandLandmark, FrameRect } from '../types';
import { dist } from './math';

// MediaPipe landmark indices
export const THUMB_TIP = 4;
export const INDEX_TIP = 8;

/** Euclidean distance between two landmarks in canvas space */
export function landmarkDist(
  a: HandLandmark,
  b: HandLandmark,
  width: number,
  height: number
): number {
  return dist(
    { x: a.x * width, y: a.y * height },
    { x: b.x * width, y: b.y * height }
  );
}

/** Detect pinch between thumb and index of any hand */
export function detectPinch(
  landmarks: HandLandmark[][],
  width: number,
  height: number,
  threshold = 32
): boolean {
  return landmarks.some(lm => {
    const d = landmarkDist(lm[THUMB_TIP], lm[INDEX_TIP], width, height);
    return d < threshold;
  });
}

/**
 * Build a FrameRect from two hands' thumb+index tips.
 * Canvas coords are already mirrored (x = (1-lm.x)*W).
 */
export function buildFrameRect(
  landmarks: HandLandmark[][],
  width: number,
  height: number
): FrameRect | null {
  if (landmarks.length < 2) return null;

  // Collect thumb & index tips from every hand
  const pts = landmarks.flatMap(lm => [
    { x: (1 - lm[THUMB_TIP].x) * width,  y: lm[THUMB_TIP].y  * height },
    { x: (1 - lm[INDEX_TIP].x)  * width,  y: lm[INDEX_TIP].y  * height },
  ]);

  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX;
  const h = maxY - minY;

  // Reject degenerate frames
  if (w < 80 || h < 60 || w > width * 0.95 || h > height * 0.95) return null;

  return { x: minX, y: minY, w, h };
}
