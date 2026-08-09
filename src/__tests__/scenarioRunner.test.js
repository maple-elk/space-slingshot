import { describe, it, expect } from 'vitest';
import {
  generateRandomLevel,
  updateProjectilePhysics,
  checkCollisions,
  DEFAULT_G,
} from '../utils/physics';

/**
 * Headless Scenario Simulator Function
 * Simulates a full trajectory step-by-step for up to maxFrames without DOM or React.
 */
export function runHeadlessSimulation(
  level,
  shooter = 'player',
  angleDeg,
  power,
  maxFrames = 600,
  config = {}
) {
  const gravityG = config.gravityG || DEFAULT_G;
  const dt = 0.016;

  const startPos = shooter === 'player' ? level.ship : level.enemyShip;
  let pos = { x: startPos.x, y: startPos.y };

  const rad = (angleDeg * Math.PI) / 180;
  let vel = {
    x: (power / 4.8) * Math.cos(rad),
    y: (power / 4.8) * Math.sin(rad),
  };

  let warpCooldown = 0;
  const boostedBoosterIds = new Set();
  const trail = [{ x: pos.x, y: pos.y }];

  for (let frame = 1; frame <= maxFrames; frame++) {
    const physRes = updateProjectilePhysics(
      pos,
      vel,
      level,
      dt,
      gravityG,
      1.0,
      warpCooldown,
      boostedBoosterIds
    );

    pos = physRes.pos;
    vel = physRes.vel;
    warpCooldown = physRes.warpCooldown;
    trail.push({ x: pos.x, y: pos.y });

    const collision = checkCollisions(pos, vel, level, shooter);

    if (collision.type === 'shield_bounce') {
      vel = collision.reflectedVel;
      continue;
    }

    if (collision.type !== 'none') {
      return {
        outcome: collision.type,
        collision,
        finalPos: pos,
        frames: frame,
        trail,
      };
    }
  }

  return {
    outcome: 'timeout',
    collision: { type: 'none' },
    finalPos: pos,
    frames: maxFrames,
    trail,
  };
}

describe('Headless Scenario Simulator', () => {
  it('simulates direct line-of-sight victory on clear level', () => {
    // Level with target placed directly to the right of ship, zero planets
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
      enemyShip: null,
    };

    // Aim straight right (0 degrees) with power 50
    const sim = runHeadlessSimulation(level, 'player', 0, 50, 600);

    expect(sim.outcome).toBe('target');
    expect(sim.frames).toBeLessThan(150);
    expect(sim.finalPos.x).toBeGreaterThan(470);
  });

  it('simulates black hole destruction scenario', () => {
    const level = {
      ship: { x: 100, y: 300 },
      target: { x: 900, y: 300, radius: 24 },
      planets: [],
      blackHoles: [{ id: 'bh_1', x: 300, y: 300, radius: 18, eventRadius: 46, mass: 220 }],
      asteroids: [],
      wormholes: [],
      pulsars: [],
      boosters: [],
      shields: [],
      enemyShip: null,
    };

    const sim = runHeadlessSimulation(level, 'player', 0, 50, 600);

    expect(sim.outcome).toBe('black_hole');
  });

  it('simulates out of bounds trajectory for high-powered deep space shot', () => {
    const level = {
      ship: { x: 100, y: 300 },
      target: { x: 900, y: 300, radius: 24 },
      planets: [],
      blackHoles: [],
      asteroids: [],
      wormholes: [],
      pulsars: [],
      boosters: [],
      shields: [],
      enemyShip: null,
    };
    // Shoot left (180 deg) at high power (200)
    const sim = runHeadlessSimulation(level, 'player', 180, 200, 600);

    expect(sim.outcome).toBe('out_of_bounds');
  });

  it('guarantees 100% deterministic trajectory simulation given seed and input', () => {
    const level = generateRandomLevel(960, 600, { seed: 8888, enableBlackHoles: true });
    const sim1 = runHeadlessSimulation(level, 'player', 315, 65, 600);
    const sim2 = runHeadlessSimulation(level, 'player', 315, 65, 600);

    expect(sim1.outcome).toBe(sim2.outcome);
    expect(sim1.frames).toBe(sim2.frames);
    expect(sim1.finalPos).toEqual(sim2.finalPos);
    expect(sim1.trail).toEqual(sim2.trail);
  });
});
