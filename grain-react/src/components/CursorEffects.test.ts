import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceParticle } from '../utils/cursorPhysics.ts';

test('mouse trail particles do not accelerate downward', () => {
  const particle = {
    x: 100,
    y: 100,
    vx: 1,
    vy: 0,
    size: 3,
    hue: 220,
    life: 0,
    maxLife: 30,
    kind: 'trail' as const,
  };

  advanceParticle(particle);

  assert.equal(particle.y, 100);
  assert.equal(particle.vy, 0);
});

test('click particles keep gravity after expanding', () => {
  const particle = {
    x: 100,
    y: 100,
    vx: 0,
    vy: 1,
    size: 5,
    hue: 290,
    life: 0,
    maxLife: 40,
    kind: 'click' as const,
  };

  advanceParticle(particle);

  assert.equal(particle.y, 101);
  assert.equal(particle.vy, 1.12);
});
