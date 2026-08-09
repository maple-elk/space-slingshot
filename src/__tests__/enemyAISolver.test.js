import { describe, it, expect } from 'vitest';
import { calculateSmartEnemyAim } from '../game/ai/enemyAISolver';

describe('Smart Enemy AI Solver', () => {
  const activeEnemy = {
    id: 'enemy_1',
    x: 800,
    y: 300,
    radius: 20,
    status: 'active',
  };
  const playerShip = { x: 100, y: 300 };

  it('returns null when enemy ship is inactive', () => {
    expect(calculateSmartEnemyAim(null, playerShip, {})).toBeNull();

    const disabledEnemy = { ...activeEnemy, status: 'disabled' };
    expect(calculateSmartEnemyAim(disabledEnemy, playerShip, {})).toBeNull();
  });

  it('calculates lock-on direct hit on clear level', () => {
    const level = {
      ship: playerShip,
      enemyShip: activeEnemy,
      planets: [],
      blackHoles: [],
    };

    const aim = calculateSmartEnemyAim(activeEnemy, playerShip, level);

    expect(aim).not.toBeNull();
    expect(aim.simOutcome).toBe('hit_player');
    expect(aim.angleDeg).toBe(180);
  });

  it('finds optimal trajectory around obstructing planet', () => {
    const level = {
      ship: playerShip,
      enemyShip: activeEnemy,
      // Planet directly blocking center line (450, 300)
      planets: [{ id: 1, x: 450, y: 300, radius: 40, mass: 150 }],
      blackHoles: [],
    };

    const aim = calculateSmartEnemyAim(activeEnemy, playerShip, level);

    expect(aim).not.toBeNull();
    expect(aim.angleDeg).not.toBe(180); // Curved away from direct collision
    expect(aim.minDistance).toBeLessThan(100);
  });
});
