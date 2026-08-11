import { describe, it, expect } from 'vitest';
import { getAllGoldenPresets, getGoldenPreset, normalizeTierKey } from '../game/data/presetRegistry';
import { generateRandomLevel } from '../utils/physics';

describe('Golden Seed Preset Registry', () => {
  it('loads all 4 catalog tiers correctly', () => {
    const all = getAllGoldenPresets();
    expect(all.level2).toBeDefined();
    expect(all.level3).toBeDefined();
    expect(all.level4).toBeDefined();
    expect(all.level5).toBeDefined();

    expect(all.level2.length).toBeGreaterThanOrEqual(10);
    expect(all.level3.length).toBeGreaterThanOrEqual(10);
    expect(all.level4.length).toBeGreaterThanOrEqual(10);
    expect(all.level5.length).toBeGreaterThanOrEqual(10);

    // Verify zero duplicate seeds exist in any catalog tier
    Object.keys(all).forEach((tier) => {
      const seeds = all[tier].map((p) => p.seed);
      const uniqueSeeds = new Set(seeds);
      expect(seeds.length).toBe(uniqueSeeds.size);
    });
  });

  it('normalizes tier aliases correctly', () => {
    expect(normalizeTierKey('easy')).toBe('level2');
    expect(normalizeTierKey('medium')).toBe('level3');
    expect(normalizeTierKey('hard')).toBe('level4');
    expect(normalizeTierKey('nightmare')).toBe('level4');
    expect(normalizeTierKey('singularity')).toBe('level5');
    expect(normalizeTierKey('level5')).toBe('level5');
  });

  it('retrieves a seed-specific golden preset when requested', () => {
    const singularityList = getAllGoldenPresets().level5;
    const knownSeed = singularityList[0].seed;

    const preset = getGoldenPreset('singularity', knownSeed);
    expect(preset).toBeDefined();
    expect(preset.seed).toBe(knownSeed);
  });

  it('integrates with generateRandomLevel when requesting Singularity tier', () => {
    const level = generateRandomLevel(960, 600, {
      difficultyTier: 'singularity',
      generationMode: 'preset',
    });

    expect(level).toBeDefined();
    expect(level.generationMode).toBe('preset');
    expect(level.planets.length).toBeGreaterThanOrEqual(2);
    expect(level.difficultyRating).toBeDefined();
  });

  it('supports explicit generationMode: random pathway', () => {
    const level = generateRandomLevel(960, 600, {
      generationMode: 'random',
      seed: 4242,
    });

    expect(level).toBeDefined();
    expect(level.generationMode).toBe('random');
    expect(level.difficultyRating).toBeDefined();
  });

  it('supports explicit generationMode: runtime_scored pathway', () => {
    const level = generateRandomLevel(960, 600, {
      generationMode: 'runtime_scored',
      difficultyTier: 'easy',
      seed: 1234,
    });

    expect(level).toBeDefined();
    expect(level.generationMode).toBe('runtime_scored');
    expect(level.difficultyRating).toBeDefined();
  });
});
