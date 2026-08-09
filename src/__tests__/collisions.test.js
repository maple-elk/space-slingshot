import { describe, it, expect } from 'vitest';
import { checkCollisions } from '../utils/physics';

describe('Collision Detection', () => {
  const sampleLevel = {
    ship: { x: 100, y: 300 },
    target: { x: 800, y: 300, radius: 24 },
    enemyShip: { id: 'enemy_1', x: 700, y: 300, radius: 20, status: 'active', name: 'Enemy Interceptor' },
    planets: [{ id: 1, x: 400, y: 300, radius: 30, name: 'Magenta Prime' }],
    blackHoles: [{ id: 'bh_1', x: 500, y: 500, radius: 18, eventRadius: 46 }],
    shields: [{ id: 'shield_1', x: 300, y: 150, radius: 20, shieldRadius: 40, mass: 40 }],
  };

  it('detects player hitting the target', () => {
    const res = checkCollisions({ x: 805, y: 300 }, { x: 5, y: 0 }, sampleLevel, 'player');
    expect(res.type).toBe('target');
  });

  it('detects player hitting enemy ship when active', () => {
    const res = checkCollisions({ x: 705, y: 300 }, { x: 5, y: 0 }, sampleLevel, 'player');
    expect(res.type).toBe('hit_enemy');
    expect(res.name).toBe('Enemy Interceptor');
  });

  it('ignores enemy ship when disabled', () => {
    const disabledLevel = {
      ...sampleLevel,
      enemyShip: { ...sampleLevel.enemyShip, status: 'disabled' },
    };
    const res = checkCollisions({ x: 705, y: 300 }, { x: 5, y: 0 }, disabledLevel, 'player');
    expect(res.type).toBe('none');
  });

  it('detects enemy shot hitting player ship', () => {
    const res = checkCollisions({ x: 105, y: 300 }, { x: -5, y: 0 }, sampleLevel, 'enemy');
    expect(res.type).toBe('hit_player');
  });

  it('detects black hole event horizon collision', () => {
    const res = checkCollisions({ x: 520, y: 500 }, { x: 0, y: 0 }, sampleLevel, 'player');
    expect(res.type).toBe('black_hole');
  });

  it('detects planet collision', () => {
    const res = checkCollisions({ x: 410, y: 300 }, { x: 1, y: 1 }, sampleLevel, 'player');
    expect(res.type).toBe('planet');
    expect(res.name).toBe('Magenta Prime');
  });

  it('reflects velocity on elastic shield moon bounce', () => {
    // Shield center is at (300, 150), shield inner radius 20, outer shieldRadius 40
    // Projectile at (330, 150) moving left (-x) toward shield center
    const pos = { x: 330, y: 150 };
    const vel = { x: -10, y: 0 };
    const res = checkCollisions(pos, vel, sampleLevel, 'player');

    expect(res.type).toBe('shield_bounce');
    expect(res.reflectedVel.x).toBeGreaterThan(0); // Bounced backward (+x)
  });

  it('detects out of bounds when far outside arena', () => {
    const res = checkCollisions({ x: -10000, y: 0 }, { x: 0, y: 0 }, sampleLevel, 'player');
    expect(res.type).toBe('out_of_bounds');
  });

  it('returns none when projectile is in clear space', () => {
    const res = checkCollisions({ x: 100, y: 100 }, { x: 5, y: 5 }, sampleLevel, 'player');
    expect(res.type).toBe('none');
  });
});
