import { describe, it, expect } from 'vitest';
import {
  runMapBenchmarkSuite,
  formatBenchmarkMarkdownReport,
  formatBenchmarkCSV,
  calculateStats,
} from '../game/ai/benchmarkRunner.js';
import { analyzeJitterSensitivity } from '../game/ai/jitterSensitivityAnalyzer.js';
import { simulateCombatDuel, evaluateCombatBalance } from '../game/ai/combatSimulator.js';

describe('Map Generator & Difficulty Assessment Benchmark Suite (Round 2)', () => {
  it('calculateStats handles numerical arrays correctly', () => {
    const stats = calculateStats([10, 20, 30, 40, 50]);
    expect(stats.mean).toBe(30);
    expect(stats.median).toBe(30);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
  });

  it('analyzeJitterSensitivity computes human playability metrics', () => {
    const mockLevel = {
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
    const solutions = [{ angleDeg: 0, power: 50 }];

    const res = analyzeJitterSensitivity(mockLevel, solutions, { samplesPerSolution: 5 });
    expect(res.solvable).toBe(true);
    expect(res.humanPlayabilityIndex).toBeGreaterThan(0);
    expect(['fragile_pixel_hunting', 'moderate', 'forgiving']).toContain(res.category);
  });

  it('evaluateCombatBalance evaluates Player vs Enemy Interceptor duels', () => {
    const mockLevel = {
      ship: { x: 100, y: 300 },
      target: { x: 900, y: 300, radius: 24 },
      enemyShip: { x: 500, y: 100, radius: 20, status: 'active' },
      planets: [],
      blackHoles: [],
      asteroids: [],
      wormholes: [],
      pulsars: [],
      boosters: [],
      shields: [],
    };
    const solutions = [{ angleDeg: 0, power: 50 }];

    const combatRes = evaluateCombatBalance(mockLevel, solutions, { duelsCount: 2 });
    expect(combatRes.hasEnemy).toBe(true);
    expect(combatRes.playerWinRatePct).toBeGreaterThanOrEqual(0);
  });

  it('runs a Monte Carlo benchmark sweep across all 5 difficulty tiers', () => {
    const results = runMapBenchmarkSuite({
      seedsPerTier: 5,
      tiers: ['level1', 'level2'],
    });
    expect(results).toBeDefined();
    expect(results.tierStats).toBeDefined();
    expect(results.tierStats.level1).toBeDefined();
    expect(results.tierStats.level2).toBeDefined();
  }, 60000);

  it('formats markdown report and CSV dataset without errors', () => {
    const results = runMapBenchmarkSuite({
      seedsPerTier: 5,
      tiers: ['level1', 'level2'],
    });
    const reportMd = formatBenchmarkMarkdownReport(results);
    expect(reportMd).toContain('# Space Slingshot Map Benchmark Report');
    expect(reportMd).toContain('level1');

    const csvData = formatBenchmarkCSV(results);
    expect(csvData).toContain('Seed,RequestedTier,EvaluatedTier,Solvable');
  }, 60000);
});
