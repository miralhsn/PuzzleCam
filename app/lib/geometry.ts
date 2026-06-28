import type { FrameRect, HandLandmark } from '../types';

// MediaPipe hand skeleton connections
const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
];

/** Draw skeleton + landmark dots for one hand */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number
): void {
  // Mirror x for display
  const px = (lm: HandLandmark) => [(1 - lm.x) * width, lm.y * height] as [number, number];

  // Skeleton lines
  ctx.save();
  ctx.strokeStyle = 'rgba(0,220,100,0.35)';
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';
  CONNECTIONS.forEach(([a, b]) => {
    const [ax, ay] = px(landmarks[a]);
    const [bx, by] = px(landmarks[b]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  });

  // Dots
  landmarks.forEach((lm, i) => {
    const [x, y] = px(lm);
    const isKey = i === 4 || i === 8;
    ctx.beginPath();
    ctx.arc(x, y, isKey ? 6 : 3, 0, Math.PI * 2);
    ctx.fillStyle = isKey
      ? 'rgba(0,255,120,0.9)'
      : 'rgba(255,255,255,0.35)';
    ctx.fill();
  });
  ctx.restore();
}

/** Draw the animated corner-bracket frame overlay */
export function drawFrameOverlay(
  ctx: CanvasRenderingContext2D,
  rect: FrameRect,
  ready: boolean,
  animPhase: number   // 0..1 cycling value for pulse animation
): void {
  const { x, y, w, h } = rect;
  const cLen = Math.min(w, h) * 0.18;
  const alpha = ready ? 1 : 0.7 + Math.sin(animPhase * Math.PI * 2) * 0.3;
  const color = ready
    ? `rgba(0,220,100,${alpha})`
    : `rgba(0,160,255,${alpha})`;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 3;
  ctx.lineCap     = 'round';

  // Corner brackets
  const brackets: [number, number, number, number][] = [
    [x,     y,      1,  1],
    [x + w, y,     -1,  1],
    [x + w, y + h, -1, -1],
    [x,     y + h,  1, -1],
  ];
  brackets.forEach(([cx, cy, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + sx * cLen, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * cLen);
    ctx.stroke();
  });

  // Subtle fill tint
  ctx.fillStyle = ready
    ? 'rgba(0,220,100,0.05)'
    : 'rgba(0,160,255,0.04)';
  ctx.fillRect(x, y, w, h);

  // Glow border when ready
  if (ready) {
    ctx.strokeStyle = 'rgba(0,220,100,0.25)';
    ctx.lineWidth   = 1;
    ctx.shadowColor = 'rgba(0,220,100,0.6)';
    ctx.shadowBlur  = 18;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur  = 0;
  }

  ctx.restore();
}
