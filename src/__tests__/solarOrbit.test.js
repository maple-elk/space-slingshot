import { describe, it, expect } from 'vitest';
import { generateRandomLevel, getOrbitalPosition, getEvaluatedLevelAtTime, DEFAULT_G } from '../utils/physics';
import { simulateTrajectory } from '../game/ai/trajectorySimulator';
import { gameReducer, initialGameState } from '../game/gameReducer';

describe('Solar Orbit & Time Dimension Physics', () => {
  it('generates a central Sun and attaches orbital parameters to space bodies when enableSolarOrbit is true', () => {
    const level = generateRandomLevel(960, 600, {
      enableSolarOrbit: true,
      sunMass: 1200,
    });

    expect(level.enableSolarOrbit).toBe(true);
    expect(level.sun).toBeDefined();
    expect(level.sun.name).toBe('Sol Prime');
    expect(level.sun.mass).toBe(1200);

    // Planets should have orbitRadius and orbitInitialAngle
    expect(level.planets.length).toBeGreaterThan(0);
    level.planets.forEach((p) => {
      expect(p.orbitRadius).toBeGreaterThan(0);
      expect(typeof p.orbitInitialAngle).toBe('number');
    });

    // Launcher ship should also have orbital parameters
    expect(level.ship.orbitRadius).toBeGreaterThan(0);
  });

  it('calculates Keplerian orbital positions over time according to v ~ 1/sqrt(r)', () => {
    const sun = { x: 480, y: 300, mass: 1200 };
    const innerPlanet = { id: 1, x: 580, y: 300, orbitRadius: 100, orbitInitialAngle: 0, orbitDir: 1 };
    const outerPlanet = { id: 2, x: 880, y: 300, orbitRadius: 400, orbitInitialAngle: 0, orbitDir: 1 };

    const posInner0 = getOrbitalPosition(innerPlanet, sun, 0, DEFAULT_G);
    const posInner1 = getOrbitalPosition(innerPlanet, sun, 1.0, DEFAULT_G);

    const posOuter0 = getOrbitalPosition(outerPlanet, sun, 0, DEFAULT_G);
    const posOuter1 = getOrbitalPosition(outerPlanet, sun, 1.0, DEFAULT_G);

    // Initial position at t=0 should match (580, 300) and (880, 300)
    expect(Math.round(posInner0.x)).toBe(580);
    expect(Math.round(posInner0.y)).toBe(300);
    expect(Math.round(posOuter0.x)).toBe(880);
    expect(Math.round(posOuter0.y)).toBe(300);

    // Inner planet angular displacement should be larger than outer planet displacement (Kepler's 3rd Law)
    const innerAngleDiff = Math.abs(posInner1.currentAngle - posInner0.currentAngle);
    const outerAngleDiff = Math.abs(posOuter1.currentAngle - posOuter0.currentAngle);

    expect(innerAngleDiff).toBeGreaterThan(outerAngleDiff);
  });

  it('evaluates entire level at time t', () => {
    const level = generateRandomLevel(960, 600, {
      enableSolarOrbit: true,
      planetCount: 3,
    });

    const evaluated = getEvaluatedLevelAtTime(level, 2.5, DEFAULT_G);

    expect(evaluated.ship.x).not.toBe(level.ship.x);
    expect(evaluated.target.x).not.toBe(level.target.x);
    expect(evaluated.planets[0].x).not.toBe(level.planets[0].x);
  });

  it('simulates trajectory headless accurately in Solar Orbit mode', () => {
    const level = generateRandomLevel(960, 600, {
      enableSolarOrbit: true,
      planetCount: 2,
    });

    const simRes = simulateTrajectory({
      startPos: level.ship,
      angleDeg: 45,
      power: 60,
      level,
      gravityG: DEFAULT_G,
      maxFrames: 100,
      shooter: 'player',
      startTime: 0,
    });

    expect(simRes).toBeDefined();
    expect(simRes.frames).toBeGreaterThan(0);
    expect(simRes.finalPos).toBeDefined();
  });

  it('supports pausing orbits and auto-resumes when launching player shot', () => {
    let state = { ...initialGameState, enableSolarOrbit: true, isOrbitPaused: false };

    // Toggle pause on
    state = gameReducer(state, { type: 'TOGGLE_PAUSE_ORBITS' });
    expect(state.isOrbitPaused).toBe(true);

    // Trigger shot launch -> isOrbitPaused automatically resets to false
    state = gameReducer(state, { type: 'LAUNCH_PLAYER', pos: { x: 100, y: 100 }, vel: { x: 10, y: 10 } });
    expect(state.isOrbitPaused).toBe(false);
    expect(state.gameStatus).toBe('flying');
  });
});
