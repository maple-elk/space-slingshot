import { updateProjectilePhysics, checkCollisions, DEFAULT_G } from '../../utils/physics';

/**
 * Headless Trajectory Simulator for AI Solver and Trajectory Prediction
 * Runs pure physics integration with zero DOM access.
 * 
 * @param {Object} params
 * @param {{x: number, y: number}} params.startPos
 * @param {number} params.angleDeg
 * @param {number} params.power
 * @param {import('../../types/entitySchemas').Level} params.level
 * @param {number} [params.gravityG]
 * @param {number} [params.maxFrames]
 * @param {'player'|'enemy'} [params.shooter]
 * @returns {Object} Simulation result metrics
 */
export function simulateTrajectory({
  startPos,
  angleDeg,
  power,
  level,
  gravityG = DEFAULT_G,
  maxFrames = 600,
  shooter = 'enemy',
}) {
  let pos = { x: startPos.x, y: startPos.y };
  const rad = (angleDeg * Math.PI) / 180;
  let vel = {
    x: (power / 4.8) * Math.cos(rad),
    y: (power / 4.8) * Math.sin(rad),
  };

  let warpCooldown = 0;
  const boostedIds = new Set();

  const targetPoint = shooter === 'enemy' ? level.ship : level.target;
  let minDistance = Math.hypot(pos.x - targetPoint.x, pos.y - targetPoint.y);

  for (let frame = 1; frame <= maxFrames; frame++) {
    const physRes = updateProjectilePhysics(
      pos,
      vel,
      level,
      0.016,
      gravityG,
      1.0,
      warpCooldown,
      boostedIds
    );

    pos = physRes.pos;
    vel = physRes.vel;
    warpCooldown = physRes.warpCooldown;

    const currentDist = Math.hypot(pos.x - targetPoint.x, pos.y - targetPoint.y);
    if (currentDist < minDistance) {
      minDistance = currentDist;
    }

    const collision = checkCollisions(pos, vel, level, shooter);

    if (collision.type === 'shield_bounce') {
      vel = collision.reflectedVel;
      continue;
    }

    if (collision.type !== 'none') {
      return {
        outcome: collision.type,
        collision,
        minDistance,
        frames: frame,
        finalPos: pos,
      };
    }
  }

  return {
    outcome: 'timeout',
    collision: { type: 'none' },
    minDistance,
    frames: maxFrames,
    finalPos: pos,
  };
}
