import { updateProjectilePhysics, checkCollisions, getEvaluatedLevelAtTime, DEFAULT_G } from '../../utils/physics';

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
 * @param {number} [params.startTime]
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
  startTime = 0,
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
    const elapsed = startTime + frame * 0.016;
    const currentLevel = level.enableSolarOrbit
      ? getEvaluatedLevelAtTime(level, elapsed, gravityG)
      : level;

    const physRes = updateProjectilePhysics(
      pos,
      vel,
      currentLevel,
      0.016,
      gravityG,
      1.0,
      warpCooldown,
      boostedIds
    );

    pos = physRes.pos;
    vel = physRes.vel;
    warpCooldown = physRes.warpCooldown;

    const curTargetPoint = shooter === 'enemy' ? currentLevel.ship : currentLevel.target;
    const currentDist = Math.hypot(pos.x - curTargetPoint.x, pos.y - curTargetPoint.y);
    if (currentDist < minDistance) {
      minDistance = currentDist;
    }

    const collision = checkCollisions(pos, vel, currentLevel, shooter);

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
