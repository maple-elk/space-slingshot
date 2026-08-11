import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialGameState } from '../game/gameReducer';
import { parseDeepLinkQuery, buildDeepLinkUrl } from '../utils/deepLink';
import { generateRandomLevel, checkCollisions } from '../utils/physics';

describe('2-Player Local Slingshot Duel Mode', () => {
  it('initializes with default puzzle mode or duel mode from settings', () => {
    const defaultState = createInitialGameState('');
    expect(defaultState.gameMode).toBe('puzzle');
    expect(defaultState.p1Score).toBe(0);
    expect(defaultState.p2Score).toBe(0);

    const duelQueryState = createInitialGameState('?mode=duel');
    expect(duelQueryState.gameMode).toBe('duel');
    expect(duelQueryState.turnOwner).toBe('player1');
    expect(duelQueryState.level.generationMode).toBe('duel');
    expect(duelQueryState.level.ship.x).toBeLessThan(300);
    expect(duelQueryState.level.enemyShip.x).toBeGreaterThan(600);
  });

  it('toggles gameMode between puzzle and duel using SET_GAME_MODE', () => {
    const initialState = createInitialGameState('');
    expect(initialState.gameMode).toBe('puzzle');

    const duelState = gameReducer(initialState, { type: 'SET_GAME_MODE', mode: 'duel' });
    expect(duelState.gameMode).toBe('duel');
    expect(duelState.turnOwner).toBe('player1');
    expect(duelState.level.generationMode).toBe('duel');

    const backToPuzzleState = gameReducer(duelState, { type: 'SET_GAME_MODE', mode: 'puzzle' });
    expect(backToPuzzleState.gameMode).toBe('puzzle');
    expect(backToPuzzleState.turnOwner).toBe('player');
  });

  it('updates aim independently for active player in duel mode', () => {
    const duelState = createInitialGameState('?mode=duel');
    expect(duelState.turnOwner).toBe('player1');

    const updatedP1 = gameReducer(duelState, { type: 'SET_AIM', angle: 45, power: 40 });
    expect(updatedP1.p1Aim).toEqual({ angle: 45, power: 40 });
    expect(updatedP1.p2Aim).toEqual({ angle: 155, power: 55 });

    // Switch turn to player 2
    const p2TurnState = { ...updatedP1, turnOwner: 'player2' };
    const updatedP2 = gameReducer(p2TurnState, { type: 'SET_AIM', angle: 180, power: 50 });
    expect(updatedP2.p2Aim).toEqual({ angle: 180, power: 50 });
    expect(updatedP2.p1Aim).toEqual({ angle: 45, power: 40 });
  });

  it('triggers instant 1-hit round win when P1 hits P2', () => {
    const duelState = createInitialGameState('?mode=duel');
    expect(duelState.p1Score).toBe(0);

    // P1 launches shot and hits P2
    const winP1ShotState = gameReducer(duelState, {
      type: 'END_SHOT',
      status: 'hit_p2',
      shooter: 'player1',
      finalTrail: [{ x: 150, y: 300 }, { x: 750, y: 300 }],
    });

    expect(winP1ShotState.p1Score).toBe(1);
    expect(winP1ShotState.p2Score).toBe(0);
    expect(winP1ShotState.gameStatus).toBe('p1_win');
    expect(winP1ShotState.roundCompleted).toBe(true);
    expect(winP1ShotState.showEndSummary).toBe(true);
    expect(winP1ShotState.p1PastTrails.length).toBe(1);
  });

  it('handles turn handoffs on miss without round completion', () => {
    const duelState = createInitialGameState('?mode=duel');

    const missedShotState = gameReducer(duelState, {
      type: 'END_SHOT',
      status: 'hit_planet',
      shooter: 'player1',
      finalTrail: [{ x: 150, y: 300 }, { x: 400, y: 300 }],
    });

    expect(missedShotState.p1Score).toBe(0);
    expect(missedShotState.p2Score).toBe(0);
    expect(missedShotState.turnOwner).toBe('player2');
    expect(missedShotState.gameStatus).toBe('idle');
    expect(missedShotState.roundCompleted).toBe(false);
  });

  it('generates new map and resets state on REMATCH_DUEL action while preserving scores', () => {
    let state = createInitialGameState('?mode=duel');
    state = { ...state, p1Score: 2, p2Score: 1, gameStatus: 'p1_win', roundCompleted: true, showEndSummary: true };

    const rematchState = gameReducer(state, { type: 'REMATCH_DUEL' });

    expect(rematchState.p1Score).toBe(2);
    expect(rematchState.p2Score).toBe(1);
    expect(rematchState.turnOwner).toBe('player1');
    expect(rematchState.gameStatus).toBe('idle');
    expect(rematchState.roundCompleted).toBe(false);
    expect(rematchState.showEndSummary).toBe(false);
    expect(rematchState.level).toBeDefined();
  });

  it('correctly serializes and parses deep links for mode=duel', () => {
    const state = { gameMode: 'duel', level: { seed: 998877 } };
    const url = buildDeepLinkUrl(state);
    expect(url).toContain('gameMode=duel');

    const parsed = parseDeepLinkQuery(url);
    expect(parsed.parsedSettings.gameMode).toBe('duel');
  });

  it('detects collisions accurately for P1 and P2 in physics engine', () => {
    const duelLevel = generateRandomLevel(960, 600, { generationMode: 'duel' });
    const p1Pos = { x: duelLevel.ship.x, y: duelLevel.ship.y };
    const p2Pos = { x: duelLevel.enemyShip.x, y: duelLevel.enemyShip.y };

    const hitP2Collision = checkCollisions(p2Pos, { x: 0, y: 0 }, duelLevel, 'player1');
    expect(hitP2Collision.type).toBe('hit_p2');

    const hitP1Collision = checkCollisions(p1Pos, { x: 0, y: 0 }, duelLevel, 'player2');
    expect(hitP1Collision.type).toBe('hit_p1');
  });
});
