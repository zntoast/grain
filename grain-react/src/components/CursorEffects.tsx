import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
  maxLife: number;
  kind: 'trail' | 'click';
}

const supportsCursorEffects = () => {
  if (typeof window === 'undefined') return false;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return finePointer && !reducedMotion;
};

export const CursorEffects: React.FC = () => {
  const mode = useStore((s) => s.cursorMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -100, y: -100 });
  const trailTimerRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!supportsCursorEffects() || mode === 'off') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life > p.maxLife) { particles.splice(i, 1); continue; }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.96;

        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;
        const size = p.size * (1 - progress * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;

        if (p.kind === 'click') {
          // 星芒（spark）：四角星；花火（burst）：六角星
          ctx.translate(p.x, p.y);
          ctx.rotate(progress * Math.PI);
          const points = mode === 'burst' ? 6 : 4;
          drawStar(ctx, 0, 0, size * 0.4, size, points);
          ctx.fillStyle = `hsl(${p.hue}, 92%, 70%)`;
          ctx.fill();
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsla(${p.hue}, 92%, 70%, ${alpha * 0.6})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${p.hue}, 92%, 70%)`;
          ctx.fill();
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, inner: number, outer: number, points: number) => {
      const step = Math.PI / points;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = i * step - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mouseRef.current = { x: e.clientX, y: e.clientY };

      const now = Date.now();
      if (now - trailTimerRef.current > 30) {
        trailTimerRef.current = now;
        const hue = mode === 'burst' ? 280 + Math.random() * 60 : 190 + Math.random() * 70;
        particlesRef.current.push({
          x: e.clientX, y: e.clientY,
          vx: -3 + Math.random() * 6,
          vy: 6 + Math.random() * 8,
          size: 2 + Math.random() * 3,
          hue,
          life: 0, maxLife: 30,
          kind: 'trail',
        });
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const count = mode === 'burst' ? 16 : 10;
      const spread = mode === 'burst' ? 60 : 35;
      const hueBase = mode === 'burst' ? 280 : 190;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const dist = Math.random() * spread;
        particlesRef.current.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * dist,
          vy: Math.sin(angle) * dist,
          size: 3 + Math.random() * (mode === 'burst' ? 6 : 4),
          hue: hueBase + Math.random() * 60,
          life: 0, maxLife: 40,
          kind: 'click',
        });
      }
    };

    animate();

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', resize);
      particlesRef.current = [];
    };
  }, [mode]);

  if (!supportsCursorEffects() || mode === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  );
};
