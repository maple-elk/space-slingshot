import { simulateTrajectory } from './trajectorySimulator.js';
import { analyzeLevelSolutions } from './levelSolver.js';
import { DEFAULT_G } from '../../utils/physics.js';

/**
 * Intelligent & Varied Enemy AI Aim Solver
 * Simulates candidate trajectories and selects interesting, close-call, or curved shots.
 * 
 * @param {import('../../types/entitySchemas').EnemyShip} enemyShip 
 * @param {import('../../types/entitySchemas').Ship} playerShip 
 * @param {import('../../types/entitySchemas').Level} level 
 * @param {number} [gravityG] 
 * @param {number} [skillLevel=0.5]
 * @returns {import('../../types/entitySchemas').TrajectoryShot|null}
 */
export function calculateSmartEnemyAim(
  enemyShip,
  playerShip,
  level,
  gravityG = DEFAULT_G,
  skillLevel = 0.5
) {
  if (!enemyShip || enemyShip.status !== 'active') return null;

  if (skillLevel > 0.7) {
    const fullAnalysis = analyzeLevelSolutions(level, {
      angleSteps: 120,
      powerSteps: 12,
      maxFrames: 900,
      shooter: 'enemy',
      gravityG,
    });

    if (fullAnalysis.solutions.length > 0) {
      const sortedByCurve = [...fullAnalysis.solutions].sort(
        (a, b) => b.totalTurnDeg - a.totalTurnDeg
      );
      const seedHash = Math.abs(
        Math.sin((enemyShip.x * 13 + enemyShip.y * 37 + playerShip.x * 7) * 0.01)
      );

      const choiceIdx = Math.floor(seedHash * Math.min(3, sortedByCurve.length));
      const selectedSol = sortedByCurve[choiceIdx] || sortedByCurve[0];
      const archetypeName =
        selectedSol.totalTurnDeg > 180
          ? '☠️ Nightmare Orbital Trick Shot'
          : '🎯 High-Skill Precision Intercept';
      const rad = (selectedSol.angleDeg * Math.PI) / 180;

      return {
        archetype: 'smart_enemy',
        archetypeName,
        angleDeg: Math.round(selectedSol.angleDeg),
        power: selectedSol.power,
        initialVel: {
          x: (selectedSol.power / 4.8) * Math.cos(rad),
          y: (selectedSol.power / 4.8) * Math.sin(rad),
        },
        simOutcome: 'hit_player',
        minDistance: 0,
        totalTurnDeg: selectedSol.totalTurnDeg,
      };
    }
  }

  const dx = playerShip.x - enemyShip.x;
  const dy = playerShip.y - enemyShip.y;
  const baseAngleRad = Math.atan2(dy, dx);
  const baseAngleDeg = ((baseAngleRad * 180) / Math.PI + 360) % 360;

  const candidateAngles = [];
  // Sample candidate angles around base angle (-50° to +50° in 5° steps)
  for (let offset = -50; offset <= 50; offset += 5) {
    candidateAngles.push((baseAngleDeg + offset + 360) % 360);
  }

  const candidatePowers = [40, 60, 85, 115, 145, 175];
  const validCandidates = [];

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

      // Filter out immediate obstacle collisions
      if (sim.outcome === 'planet' || sim.outcome === 'black_hole') continue;

      validCandidates.push({
        angleDeg,
        power,
        outcome: sim.outcome,
        minDistance: sim.minDistance,
      });
    }
  }

  if (validCandidates.length === 0) {
    // Fallback direct line aim
    const rad = (baseAngleDeg * Math.PI) / 180;
    return {
      archetype: 'direct',
      archetypeName: '🚀 Direct Intercept',
      angleDeg: Math.round(baseAngleDeg),
      power: 80,
      initialVel: { x: (80 / 4.8) * Math.cos(rad), y: (80 / 4.8) * Math.sin(rad) },
      simOutcome: 'out_of_bounds',
      minDistance: Math.round(Math.hypot(dx, dy)),
    };
  }

  // Categorize candidates for varied gameplay
  const directHits = validCandidates.filter((c) => c.outcome === 'hit_player');
  const closeCalls = validCandidates.filter((c) => c.minDistance >= 30 && c.minDistance <= 110);
  const generalShots = [...validCandidates].sort((a, b) => a.minDistance - b.minDistance);

  // Deterministic seed choice based on level seed & positions to prevent jitter
  const seedHash = Math.abs(Math.sin((enemyShip.x * 13 + enemyShip.y * 37 + playerShip.x * 7) * 0.01));
  
  let selected = null;
  let archetypeName = '🪐 Gravity Arc Attempt';

  if (seedHash < 0.40 && closeCalls.length > 0) {
    // 40% chance: Pick a dramatic Close Call near-miss (sweeps past ship)
    const idx = Math.floor((seedHash / 0.40) * closeCalls.length);
    selected = closeCalls[idx];
    archetypeName = '⚡ Close Call Sweeping Pass';
  } else if (seedHash < 0.70 && directHits.length > 0) {
    // 30% chance: Direct hit attempt with slight natural variance (+/- 2.5 deg)
    const rawHit = directHits[Math.floor(((seedHash - 0.40) / 0.30) * directHits.length)];
    const angleOffset = (seedHash > 0.55 ? 2.5 : -2.5);
    selected = {
      ...rawHit,
      angleDeg: (rawHit.angleDeg + angleOffset + 360) % 360,
    };
    archetypeName = '🎯 Targeted Intercept';
  } else {
    // 30% chance: Pick top 3 closest trajectory arc
    const topIdx = Math.min(2, Math.floor(((seedHash - 0.70) / 0.30) * generalShots.length));
    selected = generalShots[topIdx] || generalShots[0];
    archetypeName = '🪐 Gravity Arc Attempt';
  }

  const rad = (selected.angleDeg * Math.PI) / 180;
  return {
    archetype: 'smart_enemy',
    archetypeName,
    angleDeg: Math.round(selected.angleDeg),
    power: selected.power,
    initialVel: {
      x: (selected.power / 4.8) * Math.cos(rad),
      y: (selected.power / 4.8) * Math.sin(rad),
    },
    simOutcome: selected.outcome,
    minDistance: Math.round(selected.minDistance),
  };
}
