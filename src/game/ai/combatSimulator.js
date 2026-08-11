import { simulateTrajectory } from './trajectorySimulator.js';
import { calculateSmartEnemyAim } from './enemyAISolver.js';
import { DEFAULT_G } from '../../utils/physics.js';

/**
 * Simulates an automated turn-based combat duel between Player and Enemy Interceptor.
 *
 * @param {import('../../types/entitySchemas').Level} level 
 * @param {Object} [options]
 * @param {number} [options.playerAngleDeg]
 * @param {number} [options.playerPower]
 * @param {number} [options.maxTurns=10]
 * @param {number} [options.gravityG=DEFAULT_G]
 * @returns {Object} Duel outcome details
 */
export function simulateCombatDuel(level, options = {}) {
  const {
    playerAngleDeg = 0,
    playerPower = 50,
    maxTurns = 10,
    gravityG = DEFAULT_G,
  } = options;

  if (!level.enemyShip) {
    return { winner: 'none', turns: 0, reason: 'no_enemy' };
  }

  let enemyState = { ...level.enemyShip, status: 'active' };
  let levelState = { ...level, enemyShip: enemyState };

  for (let turn = 1; turn <= maxTurns; turn++) {
    // 1. Player Turn
    const playerSim = simulateTrajectory({
      startPos: levelState.ship,
      angleDeg: playerAngleDeg,
      power: playerPower,
      level: levelState,
      gravityG,
      shooter: 'player',
    });

    if (playerSim.outcome === 'target' || playerSim.outcome === 'hit_enemy') {
      return { winner: 'player', turns: turn, finalOutcome: playerSim.outcome };
    }

    // 2. Enemy Turn using AI Solver
    const enemyAim = calculateSmartEnemyAim(levelState.enemyShip, levelState.ship, levelState, gravityG);

    if (enemyAim) {
      const enemySim = simulateTrajectory({
        startPos: levelState.enemyShip,
        angleDeg: enemyAim.angleDeg,
        power: enemyAim.power,
        level: levelState,
        gravityG,
        shooter: 'enemy',
      });

      if (enemySim.outcome === 'hit_player' || enemySim.outcome === 'target') {
        return { winner: 'enemy', turns: turn, finalOutcome: enemySim.outcome };
      }
    }
  }

  return { winner: 'draw', turns: maxTurns, finalOutcome: 'max_turns_reached' };
}

/**
 * Evaluates win rates across a batch of combat duels on a level.
 *
 * @param {import('../../types/entitySchemas').Level} level 
 * @param {Array<Object>} playerSolutions 
 * @param {Object} [options]
 * @param {number} [options.duelsCount=10]
 * @param {number} [options.gravityG=DEFAULT_G]
 * @returns {Object} Aggregate combat balance metrics
 */
export function evaluateCombatBalance(level, playerSolutions = [], options = {}) {
  const { duelsCount = 10, gravityG = DEFAULT_G } = options;

  if (!level.enemyShip || !playerSolutions || playerSolutions.length === 0) {
    return {
      hasEnemy: Boolean(level.enemyShip),
      playerWinRatePct: 0,
      enemyWinRatePct: 0,
      drawRatePct: 0,
      avgTurns: 0,
      balanceRating: 'no_combat',
    };
  }

  let playerWins = 0;
  let enemyWins = 0;
  let draws = 0;
  let totalTurns = 0;

  for (let i = 0; i < duelsCount; i++) {
    const sol = playerSolutions[i % playerSolutions.length];
    const duel = simulateCombatDuel(level, {
      playerAngleDeg: sol.angleDeg,
      playerPower: sol.power,
      gravityG,
    });

    totalTurns += duel.turns;
    if (duel.winner === 'player') playerWins++;
    else if (duel.winner === 'enemy') enemyWins++;
    else draws++;
  }

  const playerWinRatePct = Number(((playerWins / duelsCount) * 100).toFixed(1));
  const enemyWinRatePct = Number(((enemyWins / duelsCount) * 100).toFixed(1));
  const drawRatePct = Number(((draws / duelsCount) * 100).toFixed(1));
  const avgTurns = Number((totalTurns / duelsCount).toFixed(1));

  let balanceRating = 'balanced';
  if (playerWinRatePct >= 70) balanceRating = 'player_favored';
  else if (enemyWinRatePct >= 70) balanceRating = 'enemy_favored';

  return {
    hasEnemy: true,
    playerWinRatePct,
    enemyWinRatePct,
    drawRatePct,
    avgTurns,
    balanceRating,
  };
}
