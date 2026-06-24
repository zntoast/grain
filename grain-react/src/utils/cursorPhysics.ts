export interface CursorParticle {
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

export const advanceParticle = (particle: CursorParticle) => {
  particle.x += particle.vx;
  particle.y += particle.vy;
  if (particle.kind === 'click') {
    particle.vy += 0.12;
  } else {
    particle.vy *= 0.96;
  }
  particle.vx *= 0.96;
};
