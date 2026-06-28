'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#00e064','#00c8ff','#a78bfa','#f59e0b','#ec4899','#fff'];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
  angle: number;
  spin: number;
}

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;

    const particles: Particle[] = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -16,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      r:  Math.random() * 7 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.15,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x     += p.vx;
        p.y     += p.vy;
        p.vy    += 0.06;
        p.angle += p.spin;
        if (p.y < canvas.height + 20) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height * 1.2);
        ctx.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * 0.55);
        ctx.restore();
      });
      if (alive) rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[150]"
    />
  );
}
