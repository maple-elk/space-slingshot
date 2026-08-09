import { describe, it, expect } from 'vitest';
import { gameReducer, initialGameState } from '../game/gameReducer';

describe('Game State Reducer', () => {
  it('updates aim settings via SET_AIM', () => {
    const nextState = gameReducer(initialGameState, { type: 'SET_AIM', angle: 120, power: 75 });

    expect(nextState.angle).toBe(120);
    expect(nextState.power).toBe(75);
  });

  it('launches player projectile via LAUNCH_PLAYER', () => {
    const pos = { x: 100, y: 300 };
    const vel = { x: 10, y: -5 };

    const nextState = gameReducer(initialGameState, { type: 'LAUNCH_PLAYER', pos, vel });

    expect(nextState.gameStatus).toBe('flying');
    expect(nextState.turnOwner).toBe('player');
    expect(nextState.projectilePos).toEqual(pos);
    expect(nextState.projectileVel).toEqual(vel);
    expect(nextState.trail).toEqual([pos]);
  });

  it('ends shot on target hit: updates score, records past trail, sets victory modal flags', () => {
    const flyingState = {
      ...initialGameState,
      gameStatus: 'flying',
      trail: [{ x: 100, y: 300 }, { x: 500, y: 300 }],
      score: 50,
    };

    const nextState = gameReducer(flyingState, {
      type: 'END_SHOT',
      status: 'hit_target',
      finalTrail: flyingState.trail,
    });

    expect(nextState.gameStatus).toBe('hit_target');
    expect(nextState.score).toBe(150);
    expect(nextState.pastTrails).toHaveLength(1);
    expect(nextState.roundCompleted).toBe(true);
    expect(nextState.showEndSummary).toBe(true);
    expect(nextState.projectilePos).toBeNull();
  });

  it('ends shot on enemy hit: immutably disables enemy ship and updates score', () => {
    const activeEnemyLevel = {
      ...initialGameState.level,
      enemyShip: { id: 'enemy_1', status: 'active', x: 700, y: 300, radius: 20 },
    };
    const stateWithEnemy = {
      ...initialGameState,
      level: activeEnemyLevel,
      score: 0,
    };

    const nextState = gameReducer(stateWithEnemy, {
      type: 'END_SHOT',
      status: 'hit_enemy',
      finalTrail: [{ x: 100, y: 300 }, { x: 700, y: 300 }],
    });

    expect(nextState.level.enemyShip.status).toBe('disabled');
    expect(nextState.score).toBe(150);
  });

  it('resets level state cleanly on RESET_LEVEL', () => {
    const dirtyState = {
      ...initialGameState,
      score: 300,
      pastTrails: [{ id: 1 }],
      gameStatus: 'hit_target',
    };
    const newLevel = { ...initialGameState.level, seed: 999 };

    const resetState = gameReducer(dirtyState, { type: 'RESET_LEVEL', newLevel });

    expect(resetState.gameStatus).toBe('idle');
    expect(resetState.pastTrails).toHaveLength(0);
    expect(resetState.level.seed).toBe(999);
  });

  it('persists trail in pastTrails when shot is terminated early (status: stopped)', () => {
    const activeFlightState = {
      ...initialGameState,
      gameStatus: 'flying',
      trail: [{ x: 100, y: 300 }, { x: 200, y: 250 }, { x: 300, y: 220 }],
    };

    const nextState = gameReducer(activeFlightState, {
      type: 'END_SHOT',
      status: 'stopped',
    });

    expect(nextState.gameStatus).toBe('stopped');
    expect(nextState.pastTrails).toHaveLength(1);
    expect(nextState.pastTrails[0].status).toBe('stopped');
    expect(nextState.pastTrails[0].points).toEqual(activeFlightState.trail);
    expect(nextState.trail).toEqual([]);
  });
});
