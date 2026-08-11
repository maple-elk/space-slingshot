import { describe, it, expect } from 'vitest';
import { parseDeepLinkQuery, buildDeepLinkUrl, copyDeepLinkToClipboard } from '../utils/deepLink';
import { createInitialGameState } from '../game/gameReducer';

describe('Deep Link Utility', () => {
  it('parses empty query string returning default flags', () => {
    const result = parseDeepLinkQuery('');
    expect(result.parsedSettings).toEqual({});
    expect(result.seed).toBeUndefined();
    expect(result.isConfigOpen).toBe(false);
    expect(result.hasDeepLink).toBe(false);
  });

  it('parses valid query parameters correctly', () => {
    const query = '?tier=extreme&seed=987654&g=650&planets=4&scale=1.4&speed=1.5&mass=2.0&enemy=1&bh=1&ast=1&worm=1&pulsar=1&booster=1&shield=1&vectors=0&gradients=0&net=1&menu=open';
    const result = parseDeepLinkQuery(query);

    expect(result.parsedSettings.difficultyTier).toBe('extreme');
    expect(result.parsedSettings.seed).toBe(987654);
    expect(result.parsedSettings.gravityG).toBe(650);
    expect(result.parsedSettings.planetCount).toBe(4);
    expect(result.parsedSettings.boardScale).toBe(1.4);
    expect(result.parsedSettings.simSpeedScale).toBe(1.5);
    expect(result.parsedSettings.massMult).toBe(2.0);
    expect(result.parsedSettings.enableEnemyShip).toBe(true);
    expect(result.parsedSettings.enableBlackHoles).toBe(true);
    expect(result.parsedSettings.enableAsteroids).toBe(true);
    expect(result.parsedSettings.enableWormholes).toBe(true);
    expect(result.parsedSettings.enablePulsars).toBe(true);
    expect(result.parsedSettings.enableBoosters).toBe(true);
    expect(result.parsedSettings.enableShields).toBe(true);
    expect(result.parsedSettings.showGravityVectors).toBe(false);
    expect(result.parsedSettings.showGravityGradients).toBe(false);
    expect(result.parsedSettings.showNetVector).toBe(true);
    expect(result.isConfigOpen).toBe(true);
    expect(result.hasDeepLink).toBe(true);
  });

  it('handles invalid or out-of-bound query params gracefully', () => {
    const query = '?tier=invalid_tier&g=99999&planets=99&scale=0.1&enemy=invalid';
    const result = parseDeepLinkQuery(query);

    expect(result.parsedSettings.difficultyTier).toBeUndefined();
    expect(result.parsedSettings.gravityG).toBe(2000); // Clamped to max 2000
    expect(result.parsedSettings.planetCount).toBe(5); // Clamped to max 5
    expect(result.parsedSettings.boardScale).toBe(0.6); // Clamped to min 0.6
    expect(result.parsedSettings.enableEnemyShip).toBeUndefined();
  });

  it('serializes state and seed to deep link URL', () => {
    const state = {
      difficultyTier: 'hard',
      gravityG: 500,
      planetCount: 3,
      boardScale: 1.2,
      enableEnemyShip: true,
      enableBlackHoles: true,
      showNetVector: true,
    };
    const seed = 555123;

    const url = buildDeepLinkUrl(state, seed, true, 'https://example.com/app');
    expect(url).toContain('tier=hard');
    expect(url).toContain('seed=555123');
    expect(url).toContain('g=500');
    expect(url).toContain('planets=3');
    expect(url).toContain('scale=1.2');
    expect(url).toContain('enemy=1');
    expect(url).toContain('bh=1');
    expect(url).toContain('net=1');
    expect(url).toContain('menu=open');
  });

  it('performs roundtrip parsing and building correctly', () => {
    const originalQuery = '?tier=nightmare&seed=123456&g=750&planets=2&scale=1.3&enemy=1&bh=1&net=1&menu=open';
    const parsed = parseDeepLinkQuery(originalQuery);

    const rebuiltUrl = buildDeepLinkUrl(parsed.parsedSettings, parsed.seed, parsed.isConfigOpen);
    const reParsed = parseDeepLinkQuery(rebuiltUrl);

    expect(reParsed.parsedSettings.difficultyTier).toBe('nightmare');
    expect(reParsed.seed).toBe(123456);
    expect(reParsed.parsedSettings.gravityG).toBe(750);
    expect(reParsed.parsedSettings.planetCount).toBe(2);
    expect(reParsed.parsedSettings.boardScale).toBe(1.3);
    expect(reParsed.parsedSettings.enableEnemyShip).toBe(true);
    expect(reParsed.parsedSettings.enableBlackHoles).toBe(true);
    expect(reParsed.parsedSettings.showNetVector).toBe(true);
    expect(reParsed.isConfigOpen).toBe(true);
  });

  it('hydrates initial game state and seed deterministically from deep link', () => {
    const query = '?tier=hard&seed=424242&planets=3&enemy=1';
    const state1 = createInitialGameState(query);
    const state2 = createInitialGameState(query);

    expect(state1.difficultyTier).toBe('hard');
    expect(state1.planetCount).toBe(3);
    expect(state1.enableEnemyShip).toBe(true);
    expect(state1.level.seed).toBe(424242);

    // Verify level generation is identical for identical seed
    expect(state1.level.ship).toEqual(state2.level.ship);
    expect(state1.level.target).toEqual(state2.level.target);
    expect(state1.level.planets.length).toEqual(state2.level.planets.length);
  });

  it('correctly parses full URL strings with origin and path', () => {
    const fullUrl = 'http://localhost:5180/?tier=extreme&enemy=1&bh=1&menu=open';
    const state = createInitialGameState(fullUrl);

    expect(state.difficultyTier).toBe('extreme');
    expect(state.enableEnemyShip).toBe(true);
    expect(state.enableBlackHoles).toBe(true);
    expect(state.level.enemyShip).not.toBeNull();
    expect(state.level.blackHoles.length).toBeGreaterThan(0);
  });

  it('strips hash fragments from URL query strings', () => {
    const urlWithHash = 'http://localhost:5180/?tier=hard&seed=12345#analytics-section';
    const result = parseDeepLinkQuery(urlWithHash);

    expect(result.parsedSettings.difficultyTier).toBe('hard');
    expect(result.seed).toBe(12345);
  });

  it('normalizes float and negative seed parameters into positive integers', () => {
    const resultNeg = parseDeepLinkQuery('?seed=-98765');
    expect(resultNeg.seed).toBe(98765);

    const resultFloat = parseDeepLinkQuery('?seed=12345.67');
    expect(resultFloat.seed).toBe(12345);
  });

  it('handles explicit false flags correctly (e.g., enemy=0, bh=0)', () => {
    const query = '?tier=extreme&enemy=0&bh=0';
    const result = parseDeepLinkQuery(query);

    expect(result.parsedSettings.enableEnemyShip).toBe(false);
    expect(result.parsedSettings.enableBlackHoles).toBe(false);

    const state = createInitialGameState(query);
    expect(state.enableEnemyShip).toBe(false);
    expect(state.enableBlackHoles).toBe(false);
    expect(state.level.enemyShip).toBeNull();
    expect(state.level.blackHoles).toHaveLength(0);
  });

  it('correctly clamps numeric parameters at upper and lower boundaries', () => {
    const queryUnder = '?g=50&planets=0&scale=0.1&speed=0.01&mass=0.05';
    const resultUnder = parseDeepLinkQuery(queryUnder);
    expect(resultUnder.parsedSettings.gravityG).toBe(100);
    expect(resultUnder.parsedSettings.planetCount).toBe(1);
    expect(resultUnder.parsedSettings.boardScale).toBe(0.6);
    expect(resultUnder.parsedSettings.simSpeedScale).toBe(0.1);
    expect(resultUnder.parsedSettings.massMult).toBe(0.2);

    const queryOver = '?g=9999&planets=20&scale=10.0&speed=10.0&mass=10.0';
    const resultOver = parseDeepLinkQuery(queryOver);
    expect(resultOver.parsedSettings.gravityG).toBe(2000);
    expect(resultOver.parsedSettings.planetCount).toBe(5);
    expect(resultOver.parsedSettings.boardScale).toBe(2.5);
    expect(resultOver.parsedSettings.simSpeedScale).toBe(3.0);
    expect(resultOver.parsedSettings.massMult).toBe(5.0);
  });

  it('hydrates Singularity golden seed preset via deep link URL', () => {
    const singularitySeed = 61513071;
    const url = `?tier=singularity&seed=${singularitySeed}`;

    const parsed = parseDeepLinkQuery(url);
    expect(parsed.parsedSettings.difficultyTier).toBe('singularity');
    expect(parsed.seed).toBe(singularitySeed);

    const state = createInitialGameState(url);
    expect(state.level.seed).toBe(singularitySeed);
    expect(state.level.planets.length).toBeGreaterThanOrEqual(3);

    const rebuiltUrl = buildDeepLinkUrl(state, state.level.seed);
    expect(rebuiltUrl).toContain('tier=singularity');
    expect(rebuiltUrl).toContain(`seed=${singularitySeed}`);
  });
});
