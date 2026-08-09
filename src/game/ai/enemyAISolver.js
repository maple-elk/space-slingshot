import { simulateTrajectory } from './trajectorySimulator';
import { DEFAULT_G } from '../../utils/physics';

/**
 * Intelligent Multi-Candidate Trajectory AI Solver
 * Simulates candidate trajectories headlessly using trajectorySimulator and picks optimal shot.
 * 
 * @param {import('../../types/entitySchemas').EnemyShip} enemyShip 
 * @param {import('../../types/entitySchemas').Ship} playerShip 
 * @param {import('../../types/entitySchemas').Level} level 
 * @param {number} [gravityG] 
 * @returns {import('../../types/entitySchemas').TrajectoryShot|null}
 */
export function calculateSmartEnemyAim(enemyShip, playerShip, level, gravityG = DEFAULT_G) {
  if (!enemyShip || enemyShip.status !== 'active') return null;

  const dx = playerShip.x - enemyShip.x;
  const dy = playerShip.y - enemyShip.y;
  const baseAngleRad = Math.atan2(dy, dx);
  const baseAngleDeg = ((baseAngleRad * 180) / Math.PI + 360) % 360;

  const candidateAngles = [];
  // Sample candidate angles around base angle (-45° to +45° in 5° steps)
  for (let offset = -45; offset <= 45; offset += 5) {
    candidateAngles.push((baseAngleDeg + offset + 360) % 360);
  }

  const candidatePowers = [35, 50, 70, 95, 125, 155, 185];
  let bestCandidate = null;
  let bestScore = -Infinity;

  for (const angleDeg of candidateAngles) {
    for (const power of candidatePowers) {
      const sim = simulateTrajectory({
        startPos: enemyShip,
        angleDeg,
        power,
        level,
        gravityG,
        maxFrames: 450,
        shooter: 'enemy',
      });

      let score = -sim.minDistance; // Closer to player = higher score

      if (sim.outcome === 'hit_player') {
        score += 5000; // Priority: direct hit
      } else if (sim.outcome === 'planet' || sim.outcome === 'black_hole') {
        score -= 500; // Penalty: premature collision
      }

      if (score > bestScore) {
        bestScore = score;
        const rad = (angleDeg * Math.PI) / 180;
        bestCandidate = {
          archetype: 'solver',
          archetypeName: sim.outcome === 'hit_player' ? '🎯 Precision Lock-On' : '🪐 Calculated Gravity Curve',
          angleDeg: Math.round(angleDeg),
          power,
          initialVel: {
            x: (power / 4.8) * Math.cos(rad),
            y: (power / 4.8) * Math.sin(rad),
          },
          simOutcome: sim.outcome,
          minDistance: Math.round(sim.minDistance),
        };
      }
    }
  }

  return bestCandidate;
}
