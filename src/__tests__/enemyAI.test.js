import { describe, it, expect } from 'vitest';
import { calculateEnemyAim } from '../utils/physics';

describe('Enemy AI Aiming', () => {
  const activeEnemy = {
    id: 'enemy_1',
    x: 800,
    y: 200,
    radius: 20,
    status: 'active',
    name: 'Enemy Interceptor',
  };
  const playerShip = { x: 150, y: 300 };
  const sampleLevel = {
    ship: playerShip,
    enemyShip: activeEnemy,
    planets: [{ id: 1, x: 450, y: 250, radius: 35, mass: 120 }],
  };

  it('returns null if enemy ship is missing or not active', () => {
    expect(calculateEnemyAim(null, playerShip, sampleLevel)).toBeNull();

    const disabledEnemy = { ...activeEnemy, status: 'disabled' };
    expect(calculateEnemyAim(disabledEnemy, playerShip, sampleLevel)).toBeNull();
  });

  it('returns valid trajectory parameters when active', () => {
    const aim = calculateEnemyAim(activeEnemy, playerShip, sampleLevel);

    expect(aim).not.toBeNull();
    expect(['direct', 'slingshot', 'lob']).toContain(aim.archetype);
    expect(aim.archetypeName).toBeDefined();
    expect(aim.angleDeg).toBeGreaterThanOrEqual(0);
    expect(aim.angleDeg).toBeLessThan(360);
    expect(aim.power).toBeGreaterThan(0);
    expect(aim.initialVel).toHaveProperty('x');
    expect(aim.initialVel).toHaveProperty('y');
  });

  it('handles empty planets list in slingshot archetype mode', () => {
    const emptyLevel = { ...sampleLevel, planets: [] };
    const aim = calculateEnemyAim(activeEnemy, playerShip, emptyLevel);

    expect(aim).not.toBeNull();
    expect(aim.power).toBeGreaterThan(0);
  });
});
