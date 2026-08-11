import { simulateTrajectory } from './trajectorySimulator.js';
import { DEFAULT_G } from '../../utils/physics.js';

/**
 * Analyzes orbital complexity, multi-loop rotation degree counts, and velocity-gradient chaos divergence (Lyapunov Index).
 * Uses Velocity-Gradient Mid-Flight Divergence ∇_θ v(t) to eliminate absorbing barrier bias from black holes/planets.
 *
 * @param {import('../../types/entitySchemas').Level} level
 * @param {Array<{ angleDeg: number, power: number, totalTurnDeg: number, loops: number }>} solutions
 * @param {Object} [options]
 * @param {number} [options.gravityG=DEFAULT_G]
 * @param {number} [options.maxFrames=2500]
 * @param {'player'|'enemy'} [options.shooter='player']
 * @returns {{ maxTurnDeg: number, maxLoops: number, has3600DegreeOrbit: boolean, chaosLyapunovIndex: number, category: string }}
 */
export function analyzeOrbitComplexity(level, solutions = [], options = {}) {
  const { gravityG = DEFAULT_G, maxFrames = 2500, shooter = 'player' } = options;

  if (!solutions || solutions.length === 0) {
    return {
      maxTurnDeg: 0,
      maxLoops: 0,
      has3600DegreeOrbit: false,
      chaosLyapunovIndex: 0,
      category: 'unsolvable',
    };
  }

  const turns = solutions.map((s) => s.totalTurnDeg || 0);
  const loopsList = solutions.map((s) => s.loops || 0);

  const maxTurnDeg = turns.length > 0 ? Math.max(...turns) : 0;
  const maxLoops = loopsList.length > 0 ? Math.max(...loopsList) : 0;
  const has3600DegreeOrbit = maxTurnDeg >= 3600;

  // Find best hitting solution (highest turn degree or first solution)
  const bestSol = [...solutions].sort((a, b) => (b.totalTurnDeg || 0) - (a.totalTurnDeg || 0))[0];
  const startPos = shooter === 'enemy' ? level.enemyShip : level.ship;

  let lambda = 0;

  if (startPos && bestSol) {
    const deltaDeg = 0.02; // Perturbation delta θ
    const angle1 = bestSol.angleDeg - deltaDeg / 2;
    const angle2 = bestSol.angleDeg + deltaDeg / 2;
    const power = bestSol.power;

    const sim1 = simulateTrajectory({
      startPos,
      angleDeg: angle1,
      power,
      level,
      gravityG,
      maxFrames,
      shooter,
    });

    const sim2 = simulateTrajectory({
      startPos,
      angleDeg: angle2,
      power,
      level,
      gravityG,
      maxFrames,
      shooter,
    });

    const pts1 = sim1.points || [];
    const pts2 = sim2.points || [];
    const minLen = Math.min(pts1.length, pts2.length);

    let maxVelGradient = 0;

    for (let t = 1; t < minLen; t++) {
      const vx1 = pts1[t].x - pts1[t - 1].x;
      const vy1 = pts1[t].y - pts1[t - 1].y;
      const vx2 = pts2[t].x - pts2[t - 1].x;
      const vy2 = pts2[t].y - pts2[t - 1].y;

      const dvx = vx1 - vx2;
      const dvy = vy1 - vy2;
      const dvMag = Math.hypot(dvx, dvy);
      const velGradient = dvMag / deltaDeg;

      if (velGradient > maxVelGradient) {
        maxVelGradient = velGradient;
      }
    }

    lambda = Math.log(1 + maxVelGradient);
  }

  const chaosLyapunovIndex = Number(lambda.toFixed(3));

  let category = 'laminar';
  if (maxTurnDeg >= 3600 || chaosLyapunovIndex >= 4.0) {
    category = 'chaotic_hyper_sensitive';
  } else if (maxTurnDeg >= 180 || chaosLyapunovIndex >= 2.0) {
    category = 'stable_slingshot';
  } else {
    category = 'laminar';
  }

  return {
    maxTurnDeg: Number(maxTurnDeg.toFixed(2)),
    maxLoops,
    has3600DegreeOrbit,
    chaosLyapunovIndex,
    category,
  };
}
