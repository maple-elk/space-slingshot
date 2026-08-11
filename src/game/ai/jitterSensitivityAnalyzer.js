import { simulateTrajectory } from './trajectorySimulator.js';
import { DEFAULT_G } from '../../utils/physics.js';

/**
 * Evaluates human playability and aiming jitter sensitivity for a level's solution set.
 *
 * @param {import('../../types/entitySchemas').Level} level 
 * @param {Array<Object>} solutions Array of valid solution objects from analyzeLevelSolutions
 * @param {Object} [options]
 * @param {number} [options.samplesPerSolution=10]
 * @param {number} [options.gravityG=DEFAULT_G]
 * @returns {Object} Sensitivity metrics & Human Playability Index
 */
export function analyzeJitterSensitivity(level, solutions = [], options = {}) {
  const { samplesPerSolution = 10, gravityG = DEFAULT_G } = options;

  if (!solutions || solutions.length === 0) {
    return {
      solvable: false,
      humanPlayabilityIndex: 0,
      hitRate0_5deg: 0,
      hitRate1_0deg: 0,
      category: 'unsolvable',
    };
  }

  let hits0_5 = 0;
  let total0_5 = 0;
  let hits1_0 = 0;
  let total1_0 = 0;

  // Best single solution window analysis
  solutions.forEach((sol) => {
    // Probe 0.5 degree jitter range (-0.5° to +0.5°)
    for (let i = 0; i < samplesPerSolution; i++) {
      total0_5++;
      const jitter = (Math.random() - 0.5) * 1.0; // [-0.5, 0.5]
      const sim = simulateTrajectory({
        startPos: level.ship,
        angleDeg: (sol.angleDeg + jitter + 360) % 360,
        power: sol.power,
        level,
        gravityG,
        shooter: 'player',
      });
      if (sim.outcome === 'target') {
        hits0_5++;
      }
    }

    // Probe 1.0 degree jitter range (-1.0° to +1.0°)
    for (let i = 0; i < samplesPerSolution; i++) {
      total1_0++;
      const jitter = (Math.random() - 0.5) * 2.0; // [-1.0, 1.0]
      const sim = simulateTrajectory({
        startPos: level.ship,
        angleDeg: (sol.angleDeg + jitter + 360) % 360,
        power: sol.power,
        level,
        gravityG,
        shooter: 'player',
      });
      if (sim.outcome === 'target') {
        hits1_0++;
      }
    }
  });

  const hitRate0_5deg = total0_5 > 0 ? Number(((hits0_5 / total0_5) * 100).toFixed(1)) : 0;
  const hitRate1_0deg = total1_0 > 0 ? Number(((hits1_0 / total1_0) * 100).toFixed(1)) : 0;

  const humanPlayabilityIndex = Number(
    (0.6 * hitRate0_5deg + 0.4 * hitRate1_0deg).toFixed(1)
  );

  let category = 'forgiving';
  if (humanPlayabilityIndex < 25) {
    category = 'fragile_pixel_hunting';
  } else if (humanPlayabilityIndex < 60) {
    category = 'moderate';
  }

  return {
    solvable: true,
    humanPlayabilityIndex,
    hitRate0_5deg,
    hitRate1_0deg,
    category,
  };
}
