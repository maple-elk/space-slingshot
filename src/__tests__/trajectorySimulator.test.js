import { describe, it, expect } from 'vitest';
import { simulateTrajectory } from '../game/ai/trajectorySimulator';

describe('Headless Trajectory Simulator', () => {
  const level = {
    ship: { x: 100, y: 300 },
    target: { x: 500, y: 300, radius: 24 },
    enemyShip: { id: 'enemy_1', x: 800, y: 300, radius: 20, status: 'active' },
    planets: [],
    blackHoles: [],
    asteroids: [],
    wormholes: [],
    pulsars: [],
    boosters: [],
    shields: [],
  };

  it('forward-simulates enemy shot toward player ship', () => {
    // Enemy at (800, 300) aims 180 deg (straight left) toward player ship at (100, 300)
    const result = simulateTrajectory({
      startPos: level.enemyShip,
      angleDeg: 180,
      power: 60,
      level,
      shooter: 'enemy',
    });

    expect(result.outcome).toBe('hit_player');
    expect(result.minDistance).toBeLessThan(18);
    expect(result.frames).toBeLessThan(250);
    expect(result.totalTurnDeg).toBeDefined();
    expect(result.totalTurnDeg).toBeLessThan(1.0);
    expect(result.loops).toBe(0);
  });

  it('forward-simulates player shot toward target', () => {
    const result = simulateTrajectory({
      startPos: level.ship,
      angleDeg: 0,
      power: 50,
      level,
      shooter: 'player',
    });

    expect(result.outcome).toBe('target');
    expect(result.minDistance).toBeLessThan(30); // Target hit threshold is radius + 6 = 30
    expect(result.totalTurnDeg).toBeDefined();
    expect(result.totalTurnDeg).toBeLessThan(1.0);
    expect(result.loops).toBe(0);
  });
});
