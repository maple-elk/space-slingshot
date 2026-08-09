import { describe, it, expect } from 'vitest';
import { generateRandomLevel } from '../utils/physics';
import { simulateTrajectory } from '../game/ai/trajectorySimulator';
import { calculateSmartEnemyAim } from '../game/ai/enemyAISolver';

describe('Integration Flight Scenarios (Deterministic Seeds)', () => {
  it('Scenario 1: Player launches along cleared path and hits target station', () => {
    const level = {
      ship: { x: 100, y: 300 },
      target: { x: 500, y: 300, radius: 24 },
      planets: [],
      blackHoles: [],
      asteroids: [],
      wormholes: [],
      pulsars: [],
      boosters: [],
      shields: [],
    };

    const sim = simulateTrajectory({
      startPos: level.ship,
      angleDeg: 0,
      power: 60,
      level,
      shooter: 'player',
      maxFrames: 600,
    });

    expect(sim.outcome).toBe('target');
    expect(sim.frames).toBeLessThan(400);
  });

  it('Scenario 2: Enemy Interceptor uses AI solver to score counter-attack against player', () => {
    const level = generateRandomLevel(960, 600, {
      seed: 4004,
      planetCount: 2,
      enableEnemyShip: true,
    });

    const aim = calculateSmartEnemyAim(level.enemyShip, level.ship, level);

    expect(aim).not.toBeNull();
    expect(aim.simOutcome).toBe('hit_player');

    const sim = simulateTrajectory({
      startPos: level.enemyShip,
      angleDeg: aim.angleDeg,
      power: aim.power,
      level,
      shooter: 'enemy',
      maxFrames: 600,
    });

    expect(sim.outcome).toBe('hit_player');
  });

  it('Scenario 3: Probe trajectory caught by Black Hole Event Horizon', () => {
    const level = {
      ship: { x: 100, y: 300 },
      target: { x: 900, y: 300, radius: 24 },
      blackHoles: [{ id: 'bh_1', x: 500, y: 300, eventRadius: 50, radius: 20, mass: 400 }],
      planets: [],
      asteroids: [],
      wormholes: [],
      pulsars: [],
      boosters: [],
      shields: [],
    };

    const sim = simulateTrajectory({
      startPos: level.ship,
      angleDeg: 0,
      power: 50,
      level,
      shooter: 'player',
    });

    expect(sim.outcome).toBe('black_hole');
  });
});
