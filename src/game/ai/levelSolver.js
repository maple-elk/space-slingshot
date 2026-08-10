import { simulateTrajectory } from './trajectorySimulator';
import { DEFAULT_G } from '../../utils/physics';

export const DIFFICULTY_TIERS = {
  easy: { key: 'easy', label: 'Easy', emoji: '🟢' },
  medium: { key: 'medium', label: 'Medium', emoji: '🟡' },
  hard: { key: 'hard', label: 'Hard', emoji: '🔴' },
  extreme: { key: 'extreme', label: 'Extreme', emoji: '⚡' },
  nightmare: { key: 'nightmare', label: 'Nightmare', emoji: '☠️' },
  unrated: { key: 'unrated', label: 'Unrated', emoji: '❓' },
};

/**
 * Analyzes all possible trajectories on a level across an angle x power grid.
 *
 * @param {import('../../types/entitySchemas').Level} level
 * @param {Object} [options]
 * @param {number} [options.angleSteps=72]
 * @param {number} [options.powerMin=30]
 * @param {number} [options.powerMax=200]
 * @param {number} [options.powerSteps=10]
 * @param {number} [options.maxFrames=600]
 * @param {'player'|'enemy'} [options.shooter='player']
 * @param {number} [options.gravityG]
 * @returns {Object} Analysis metrics and valid solutions array
 */
export function analyzeLevelSolutions(level, options = {}) {
  const {
    angleSteps = 72,
    powerMin = 30,
    powerMax = 200,
    powerSteps = 10,
    maxFrames = 600,
    shooter = 'player',
    gravityG = DEFAULT_G,
  } = options;

  const startPos = shooter === 'enemy' ? level.enemyShip : level.ship;
  const targetOutcome = shooter === 'enemy' ? 'hit_player' : 'target';

  if (!startPos) {
    return {
      solutions: [],
      solutionCount: 0,
      totalSampled: 0,
      windowDensity: 0,
      minTurnDeg: null,
      maxTurnDeg: null,
      averageTurnDeg: null,
      maxLoops: 0,
      hasDirectShot: false,
    };
  }

  const solutions = [];
  const angleIncrement = 360 / angleSteps;

  for (let a = 0; a < angleSteps; a++) {
    const angleDeg = a * angleIncrement;
    for (let p = 0; p < powerSteps; p++) {
      const power =
        powerSteps === 1
          ? powerMin
          : powerMin + (powerMax - powerMin) * (p / (powerSteps - 1));

      const sim = simulateTrajectory({
        startPos,
        angleDeg,
        power,
        level,
        gravityG,
        maxFrames,
        shooter,
      });

      if (sim.outcome === targetOutcome) {
        solutions.push({
          angleDeg,
          power,
          totalTurnDeg: sim.totalTurnDeg,
          loops: sim.loops,
          frames: sim.frames,
          points: sim.points,
        });
      }
    }
  }

  const totalSampled = angleSteps * powerSteps;
  const solutionCount = solutions.length;
  const windowDensity = totalSampled > 0 ? (solutionCount / totalSampled) * 100 : 0;

  const turns = solutions.map((s) => s.totalTurnDeg);
  const minTurnDeg = turns.length > 0 ? Math.min(...turns) : null;
  const maxTurnDeg = turns.length > 0 ? Math.max(...turns) : null;
  const averageTurnDeg =
    turns.length > 0 ? turns.reduce((acc, v) => acc + v, 0) / turns.length : null;
  const maxLoops = solutions.length > 0 ? Math.max(...solutions.map((s) => s.loops)) : 0;
  const hasDirectShot = solutions.some((s) => s.totalTurnDeg < 30);

  return {
    solutions,
    solutionCount,
    totalSampled,
    windowDensity,
    minTurnDeg,
    maxTurnDeg,
    averageTurnDeg,
    maxLoops,
    hasDirectShot,
  };
}

/**
 * Evaluates the difficulty rating of a level based on trajectory analysis.
 *
 * @param {import('../../types/entitySchemas').Level} level
 * @param {Object} [options]
 * @returns {import('../../types/entitySchemas').DifficultyRating & { solvable: boolean }}
 */
export function evaluateMapDifficulty(level, options = {}) {
  const analysis = analyzeLevelSolutions(level, options);
  const { solutionCount, windowDensity, maxTurnDeg, minTurnDeg, maxLoops, hasDirectShot } =
    analysis;

  let tier = 'easy';
  if (solutionCount > 0 && (minTurnDeg > 540 || windowDensity < 0.05)) {
    tier = 'nightmare';
  } else if (solutionCount > 0 && (minTurnDeg > 360 || windowDensity < 0.2)) {
    tier = 'extreme';
  } else if (solutionCount > 0 && (minTurnDeg > 180 || windowDensity < 1.0)) {
    tier = 'hard';
  } else if (solutionCount > 0 && (minTurnDeg > 60 || (!hasDirectShot && windowDensity < 5.0))) {
    tier = 'medium';
  } else if (solutionCount > 0) {
    tier = 'easy';
  } else {
    tier = 'unrated'; // Unsolvable or missed grid search falls into unrated
  }

  const tierMeta = DIFFICULTY_TIERS[tier] || DIFFICULTY_TIERS.unrated;

  return {
    tier,
    tierEmoji: tierMeta.emoji,
    tierLabel: tierMeta.label,
    solutionCount,
    windowDensity,
    minTurnDeg: minTurnDeg ?? 0,
    maxTurnDeg: maxTurnDeg ?? 0,
    maxLoops,
    hasDirectShot,
    solvable: solutionCount > 0,
  };
}
