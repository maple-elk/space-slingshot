import { describe, it, expect } from 'vitest';
import { generateRandomLevel, mulberry32 } from '../utils/physics';

describe('Level Generator & Seeded PRNG', () => {
  it('mulberry32 PRNG generates deterministic floats in [0, 1)', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);

    const val1 = [rng1(), rng1(), rng1()];
    const val2 = [rng2(), rng2(), rng2()];

    expect(val1).toEqual(val2);
    val1.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
  });

  it('generateRandomLevel with identical seeds produces identical levels', () => {
    const config = {
      seed: 424242,
      planetCount: 3,
      enableBlackHoles: true,
      enableWormholes: true,
      enableEnemyShip: true,
    };

    const levelA = generateRandomLevel(960, 600, config);
    const levelB = generateRandomLevel(960, 600, config);

    expect(levelA.seed).toBe(424242);
    expect(levelB.seed).toBe(424242);
    expect(levelA.ship).toEqual(levelB.ship);
    expect(levelA.target).toEqual(levelB.target);
    expect(levelA.planets).toEqual(levelB.planets);
    expect(levelA.blackHoles).toEqual(levelB.blackHoles);
    expect(levelA.wormholes).toEqual(levelB.wormholes);
    expect(levelA.enemyShip).toEqual(levelB.enemyShip);
  });

  it('different seeds produce different level layouts', () => {
    const level1 = generateRandomLevel(960, 600, { seed: 100 });
    const level2 = generateRandomLevel(960, 600, { seed: 200 });

    expect(level1.target).not.toEqual(level2.target);
    expect(level1.ship).not.toEqual(level2.ship);
  });

  it('respects planet count settings', () => {
    const level1 = generateRandomLevel(960, 600, { seed: 1, planetCount: 1 });
    expect(level1.planets).toHaveLength(1);

    const level5 = generateRandomLevel(960, 600, { seed: 1, planetCount: 5 });
    expect(level5.planets).toHaveLength(5);
  });

  it('enables optional phenomena toggles correctly', () => {
    const fullConfig = {
      seed: 999,
      enableBlackHoles: true,
      enableAsteroids: true,
      enableWormholes: true,
      enablePulsars: true,
      enableBoosters: true,
      enableShields: true,
      enableEnemyShip: true,
    };

    const level = generateRandomLevel(960, 600, fullConfig);

    expect(level.blackHoles.length).toBeGreaterThan(0);
    expect(level.asteroids.length).toBeGreaterThan(0);
    expect(level.wormholes.length).toBe(2);
    expect(level.pulsars.length).toBeGreaterThan(0);
    expect(level.boosters.length).toBeGreaterThan(0);
    expect(level.shields.length).toBeGreaterThan(0);
    expect(level.enemyShip).not.toBeNull();
  });

  it('ensures objects do not overlap player ship or target', () => {
    const level = generateRandomLevel(960, 600, { seed: 777, planetCount: 4 });

    for (const p of level.planets) {
      const dShip = Math.hypot(p.x - level.ship.x, p.y - level.ship.y);
      const dTarget = Math.hypot(p.x - level.target.x, p.y - level.target.y);

      expect(dShip).toBeGreaterThan(p.radius + 30);
      expect(dTarget).toBeGreaterThan(p.radius + 30);
    }
  });
});
