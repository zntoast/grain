import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

interface CursorParticle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  hue: number;
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
  const [isSupported, setIsSupported] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [particles, setParticles] = useState<CursorParticle[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const lastTrailTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const latestPointRef = useRef({ x: -80, y: -80 });

  useEffect(() => {
    const updateSupport = () => setIsSupported(supportsCursorEffects());
    updateSupport();

    const pointerQuery = window.matchMedia('(pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    pointerQuery.addEventListener('change', updateSupport);
    motionQuery.addEventListener('change', updateSupport);

    return () => {
      pointerQuery.removeEventListener('change', updateSupport);
      motionQuery.removeEventListener('change', updateSupport);
    };
  }, []);

  useEffect(() => {
    if (!isSupported || mode === 'off') {
      document.body.classList.remove('anime-cursor-enabled');
      return;
    }

    document.body.classList.add('anime-cursor-enabled');

    return () => {
      document.body.classList.remove('anime-cursor-enabled');
    };
  }, [isSupported, mode]);

  useEffect(() => {
    if (!isSupported || mode === 'off') return;

    const moveCursor = () => {
      rafRef.current = null;
      const cursor = cursorRef.current;
      if (!cursor) return;
      const { x, y } = latestPointRef.current;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const queueCursorMove = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(moveCursor);
    };

    const addParticles = (nextParticles: CursorParticle[]) => {
      setParticles((current) => [...current.slice(-34), ...nextParticles]);
      window.setTimeout(() => {
        const ids = new Set(nextParticles.map((particle) => particle.id));
        setParticles((current) => current.filter((particle) => !ids.has(particle.id)));
      }, 720);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      latestPointRef.current = { x: event.clientX, y: event.clientY };
      queueCursorMove();

      const now = performance.now();
      if (now - lastTrailTimeRef.current < 28) return;
      lastTrailTimeRef.current = now;

      addParticles([
        {
          id: particleIdRef.current++,
          x: event.clientX,
          y: event.clientY,
          dx: -4 + Math.random() * 8,
          dy: 8 + Math.random() * 8,
          size: 4 + Math.random() * 4,
          hue: 205 + Math.random() * 80,
          kind: 'trail',
        },
      ]);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      setIsPressed(true);
      const count = mode === 'burst' ? 14 : 8;
      const nextParticles = Array.from({ length: count }, (_, index) => {
        const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
        const distance = mode === 'burst' ? 24 + Math.random() * 26 : 12 + Math.random() * 18;
        return {
          id: particleIdRef.current++,
          x: event.clientX,
          y: event.clientY,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          size: mode === 'burst' ? 4 + Math.random() * 6 : 5 + Math.random() * 5,
          hue: mode === 'burst' ? 290 + Math.random() * 55 : 190 + Math.random() * 90,
          kind: 'click' as const,
        };
      });
      addParticles(nextParticles);
    };

    const handlePointerUp = () => setIsPressed(false);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isSupported, mode]);

  if (!isSupported) return null;

  return (
    <>
      {mode !== 'off' && (
        <>
          <div
            ref={cursorRef}
            className={`anime-cursor ${isPressed ? 'anime-cursor--pressed' : ''}`}
            aria-hidden="true"
          >
            <div className="anime-cursor__wand" />
            <div className="anime-cursor__star anime-cursor__star--one" />
            <div className="anime-cursor__star anime-cursor__star--two" />
          </div>
          <div className="anime-cursor-particles" aria-hidden="true">
            {particles.map((particle) => (
              <span
                key={particle.id}
                className={`anime-cursor-particle anime-cursor-particle--${particle.kind}`}
                style={
                  {
                    left: particle.x,
                    top: particle.y,
                    width: particle.size,
                    height: particle.size,
                    '--particle-x': `${particle.dx}px`,
                    '--particle-y': `${particle.dy}px`,
                    '--particle-hue': particle.hue,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </>
      )}

    </>
  );
};
