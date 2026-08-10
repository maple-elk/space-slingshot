import { describe, it, expect } from 'vitest';
import { analyzeLevelSolutions, evaluateMapDifficulty, DIFFICULTY_TIERS } from '../game/ai/levelSolver';

describe('Shared Level Solver Engine', () => {
  const emptyLevel = {
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

  it('detects a direct shot with low angular turn in unobstructed space', () => {
    const analysis = analyzeLevelSolutions(emptyLevel, {
      angleSteps: 36,
      powerSteps: 5,
    });

    expect(analysis.solutionCount).toBeGreaterThan(0);
    expect(analysis.hasDirectShot).toBe(true);
    expect(analysis.minTurnDeg).toBeLessThan(30);
  });

  it('calculates window density accurately', () => {
    const angleSteps = 36;
    const powerSteps = 10;
    const analysis = analyzeLevelSolutions(emptyLevel, {
      angleSteps,
      powerSteps,
    });

    const expectedDensity = (analysis.solutionCount / (angleSteps * powerSteps)) * 100;
    expect(analysis.totalSampled).toBe(angleSteps * powerSteps);
    expect(analysis.windowDensity).toBeCloseTo(expectedDensity, 5);
  });

  it('classifies an empty unobstructed map as Easy', () => {
    const rating = evaluateMapDifficulty(emptyLevel);

    expect(rating.tier).toBe('easy');
    expect(rating.tierLabel).toBe('Easy');
    expect(rating.tierEmoji).toBe(DIFFICULTY_TIERS.easy.emoji);
    expect(rating.hasDirectShot).toBe(true);
    expect(rating.solvable).toBe(true);
  });

  it('measures angular deflection around a heavy gravity source', () => {
    // Single heavy planet blocking direct sightline forcing a curved slingshot arc
    const gravityLevel = {
      ship: { x: 100, y: 300 },
      target: { x: 700, y: 300, radius: 24 },
      planets: [
        { id: 'p1', x: 400, y: 300, radius: 60, mass: 3500, type: 'terrestrial' },
      ],
      blackHoles: [],
      asteroids: [],
      wormholes: [],
      pulsars: [],
      boosters: [],
      shields: [],
    };

    const analysis = analyzeLevelSolutions(gravityLevel, {
      angleSteps: 120,
      powerSteps: 15,
      powerMin: 30,
      powerMax: 200,
    });

    expect(analysis.solutionCount).toBeGreaterThan(0);
    expect(analysis.maxTurnDeg).toBeGreaterThan(30);
  });
});
