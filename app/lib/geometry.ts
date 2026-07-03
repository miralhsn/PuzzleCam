import type { FrameRect, HandLandmark } from '../types';

const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
];

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  W: number,
  H: number
): void {
  const px = (lm: HandLandmark): [number, number] => [(1 - lm.x) * W, lm.y * H];

  ctx.save();
  ctx.strokeStyle = 'rgba(0,220,100,0.4)';
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';

  for (const [a, b] of CONNECTIONS) {
    const [ax, ay] = px(landmarks[a]);
    const [bx, by] = px(landmarks[b]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  for (let i = 0; i < landmarks.length; i++) {
    const [x, y] = px(landmarks[i]);
    const isKey  = i === 4 || i === 8;
    ctx.beginPath();
    ctx.arc(x, y, isKey ? 6 : 3, 0, Math.PI * 2);
    ctx.fillStyle = isKey ? 'rgba(0,255,120,0.9)' : 'rgba(255,255,255,0.35)';
    ctx.fill();
  }
  ctx.restore();
}

export function drawFrameOverlay(
  ctx: CanvasRenderingContext2D,
  rect: FrameRect,
  ready: boolean,
  animPhase: number
): void {
  const { x, y, w, h } = rect;
  const cLen  = Math.min(w, h) * 0.18;
  const alpha = ready ? 1 : 0.7 + Math.sin(animPhase * Math.PI * 2) * 0.3;
  const color = ready ? `rgba(0,220,100,${alpha})` : `rgba(0,160,255,${alpha})`;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 3;
  ctx.lineCap     = 'round';

  for (const [cx, cy, sx, sy] of [
    [x,     y,      1,  1],
    [x + w, y,     -1,  1],
    [x + w, y + h, -1, -1],
    [x,     y + h,  1, -1],
  ] as [number, number, number, number][]) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * cLen, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * cLen);
    ctx.stroke();
  }

  ctx.fillStyle = ready ? 'rgba(0,220,100,0.05)' : 'rgba(0,160,255,0.04)';
  ctx.fillRect(x, y, w, h);

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
