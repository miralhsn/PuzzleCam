import type { Point2D } from '../types';

export function dist(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Smooth a series of Point2D arrays (moving average) */
export function averagePoints(frames: Point2D[][]): Point2D[] {
  if (frames.length === 0) return [];
  const n = frames[0].length;
  return Array.from({ length: n }, (_, i) => {
    const xs = frames.map(f => f[i]?.x ?? 0);
    const ys = frames.map(f => f[i]?.y ?? 0);
    return {
      x: xs.reduce((a, b) => a + b, 0) / xs.length,
      y: ys.reduce((a, b) => a + b, 0) / ys.length,
    };
  });
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
