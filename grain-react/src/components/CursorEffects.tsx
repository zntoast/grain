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

    const addParticles = (x: number, y: number, count: number, kind: 'trail' | 'click', spread: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spread;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * dist,
          vy: Math.sin(angle) * dist - (kind === 'trail' ? 2 : 0),
          size: 2 + Math.random() * (kind === 'click' ? 5 : 3),
          hue: kind === 'click' ? 290 + Math.random() * 55 : 205 + Math.random() * 80,
          life: 0,
          maxLife: kind === 'click' ? 40 : 30,
          kind,
        });
      }
    };

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

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 92%, 70%, ${alpha})`;
        ctx.fill();

        if (p.kind === 'click') {
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsla(${p.hue}, 92%, 70%, ${alpha * 0.5})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mouseRef.current = { x: e.clientX, y: e.clientY };

      const now = Date.now();
      if (now - trailTimerRef.current > 30) {
        trailTimerRef.current = now;
        addParticles(e.clientX, e.clientY, 1, 'trail', 6);
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const count = mode === 'burst' ? 14 : 8;
      const spread = mode === 'burst' ? 50 : 30;
      addParticles(e.clientX, e.clientY, count, 'click', spread);
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
