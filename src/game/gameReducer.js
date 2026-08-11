import { DEFAULT_G, generateRandomLevel } from '../utils/physics';
import { parseDeepLinkQuery } from '../utils/deepLink';

export function createInitialGameState(searchString) {
  const { parsedSettings, seed } = parseDeepLinkQuery(searchString);

  const gameMode = parsedSettings.gameMode || 'puzzle';
  const baseSettings = {
    gameMode: gameMode,
    mapGenerationMode: parsedSettings.mapGenerationMode || (gameMode === 'duel' ? 'duel' : 'random'),
    difficultyTier: 'auto',
    planetCount: 'auto',
    gravityG: DEFAULT_G,
    massMult: 1.0,
    simSpeedScale: 1.0,
    boardScale: 1.0,
    enableBlackHoles: false,
    enableAsteroids: false,
    enableWormholes: false,
    enablePulsars: false,
    enableBoosters: false,
    enableShields: false,
    enableEnemyShip: false,
    showGravityGradients: true,
    showGravityVectors: false,
    showNetVector: false,
    showSettingsOverlay: false,
    ...parsedSettings,
  };

  const levelConfig = {
    generationMode: baseSettings.mapGenerationMode,
    difficultyTier: baseSettings.difficultyTier,
    planetCount: baseSettings.planetCount,
    gravityG: baseSettings.gravityG,
    massMult: baseSettings.massMult,
    boardScale: baseSettings.boardScale,
    enableBlackHoles: parsedSettings.enableBlackHoles,
    enableAsteroids: parsedSettings.enableAsteroids,
    enableWormholes: parsedSettings.enableWormholes,
    enablePulsars: parsedSettings.enablePulsars,
    enableBoosters: parsedSettings.enableBoosters,
    enableShields: parsedSettings.enableShields,
    enableEnemyShip: gameMode === 'duel' ? true : baseSettings.enableEnemyShip,
    seed: seed,
  };

  const initialLevel = generateRandomLevel(960, 600, levelConfig);

  return {
    ...baseSettings,
    level: initialLevel,
    enableBlackHoles: parsedSettings.enableBlackHoles !== undefined ? parsedSettings.enableBlackHoles : Boolean(initialLevel?.blackHoles && initialLevel.blackHoles.length > 0),
    enableAsteroids: parsedSettings.enableAsteroids !== undefined ? parsedSettings.enableAsteroids : Boolean(initialLevel?.asteroids && initialLevel.asteroids.length > 0),
    enableWormholes: parsedSettings.enableWormholes !== undefined ? parsedSettings.enableWormholes : Boolean(initialLevel?.wormholes && initialLevel.wormholes.length > 0),
    enablePulsars: parsedSettings.enablePulsars !== undefined ? parsedSettings.enablePulsars : Boolean(initialLevel?.pulsars && initialLevel.pulsars.length > 0),
    enableBoosters: parsedSettings.enableBoosters !== undefined ? parsedSettings.enableBoosters : Boolean(initialLevel?.boosters && initialLevel.boosters.length > 0),
    enableShields: parsedSettings.enableShields !== undefined ? parsedSettings.enableShields : Boolean(initialLevel?.shields && initialLevel.shields.length > 0),
    enableEnemyShip: gameMode === 'duel' ? true : (parsedSettings.enableEnemyShip !== undefined ? parsedSettings.enableEnemyShip : Boolean(initialLevel?.enemyShip && initialLevel.enemyShip.status === 'active')),
    angle: gameMode === 'duel' ? 335 : 335,
    power: 55,
    p1Aim: { angle: 335, power: 55 },
    p2Aim: { angle: 155, power: 55 },
    isDraggingAim: false,
    gameStatus: 'idle', // 'idle' | 'flying' | 'enemy_aiming' | 'enemy_flying' | 'hit_target' | 'hit_enemy' | 'hit_player' | 'hit_planet' | 'black_hole' | 'out_of_bounds' | 'p1_win' | 'p2_win'
    turnOwner: gameMode === 'duel' ? 'player1' : 'player', // 'player' | 'enemy' | 'player1' | 'player2'
    score: 0,
    p1Score: 0,
    p2Score: 0,
    projectilePos: null,
    projectileVel: null,
    projectileAccel: { ax: 0, ay: 0 },
    trail: [],
    pastTrails: [],
    p1PastTrails: [],
    p2PastTrails: [],
    showAllPastTrails: false,

    // Enemy State
    enemyAimInfo: null,
    enemyProjectilePos: null,
    enemyProjectileVel: null,
    enemyTrail: [],

    // Post-Round State
    roundCompleted: false,
    showEndSummary: false,
  };
}

export const initialGameState = createInitialGameState();

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_SETTING':
      return { ...state, [action.key]: action.value };

    case 'SET_GAME_MODE': {
      const newMode = action.mode || (state.gameMode === 'puzzle' ? 'duel' : 'puzzle');
      const lvlConfig = {
        generationMode: newMode === 'duel' ? 'duel' : 'random',
        difficultyTier: state.difficultyTier,
        planetCount: state.planetCount,
        gravityG: state.gravityG,
        massMult: state.massMult,
        boardScale: state.boardScale,
        enableBlackHoles: state.enableBlackHoles,
        enableAsteroids: state.enableAsteroids,
        enableWormholes: state.enableWormholes,
        enablePulsars: state.enablePulsars,
        enableBoosters: state.enableBoosters,
        enableShields: state.enableShields,
        enableEnemyShip: newMode === 'duel' ? true : state.enableEnemyShip,
      };
      const newLvl = generateRandomLevel(960, 600, lvlConfig);
      return {
        ...state,
        gameMode: newMode,
        mapGenerationMode: lvlConfig.generationMode,
        turnOwner: newMode === 'duel' ? 'player1' : 'player',
        gameStatus: 'idle',
        projectilePos: null,
        projectileVel: null,
        trail: [],
        pastTrails: [],
        p1PastTrails: [],
        p2PastTrails: [],
        p1Hp: 3,
        p2Hp: 3,
        p1Aim: { angle: 335, power: 55 },
        p2Aim: { angle: 155, power: 55 },
        angle: 335,
        power: 55,
        roundCompleted: false,
        showEndSummary: false,
        level: newLvl,
        enableEnemyShip: newMode === 'duel' ? true : state.enableEnemyShip,
      };
    }

    case 'SET_AIM': {
      const newAngle = action.angle !== undefined ? action.angle : state.angle;
      const newPower = action.power !== undefined ? action.power : state.power;

      let updatedP1 = state.p1Aim;
      let updatedP2 = state.p2Aim;

      if (state.turnOwner === 'player1') {
        updatedP1 = { angle: newAngle, power: newPower };
      } else if (state.turnOwner === 'player2') {
        updatedP2 = { angle: newAngle, power: newPower };
      }

      return {
        ...state,
        gameStatus: state.gameStatus !== 'flying' && state.gameStatus !== 'enemy_flying' && state.gameStatus !== 'enemy_aiming' ? 'idle' : state.gameStatus,
        angle: newAngle,
        power: newPower,
        p1Aim: updatedP1,
        p2Aim: updatedP2,
      };
    }

    case 'SET_IS_DRAGGING_AIM':
      return { ...state, isDraggingAim: action.value };

    case 'LAUNCH_PLAYER': {
      const activeOwner = action.turnOwner || state.turnOwner;
      return {
        ...state,
        gameStatus: 'flying',
        turnOwner: activeOwner,
        projectilePos: action.pos,
        projectileVel: action.vel,
        projectileAccel: { ax: 0, ay: 0 },
        trail: [action.pos],
      };
    }

    case 'UPDATE_PROJECTILE':
      return {
        ...state,
        projectilePos: action.pos,
        projectileVel: action.vel,
        projectileAccel: action.accel,
        trail: [...state.trail, action.pos],
      };

    case 'END_SHOT': {
      const trailPoints =
        action.finalTrail && action.finalTrail.length > 0
          ? action.finalTrail
          : state.trail;

      const shooter = action.shooter || (state.turnOwner === 'player2' ? 'player2' : 'player1');
      const newPastTrail = {
        id: `${Date.now()}_${state.pastTrails.length}`,
        shooter: state.gameMode === 'duel' ? shooter : 'player',
        status: action.status,
        points: trailPoints,
        angle: state.angle,
        power: state.power,
      };

      if (state.gameMode === 'duel') {
        const isP1HitP2 = action.status === 'hit_p2' || (shooter === 'player1' && action.status === 'hit_enemy');
        const isP2HitP1 = action.status === 'hit_p1' || (shooter === 'player2' && action.status === 'hit_player');

        let p1Score = state.p1Score || 0;
        let p2Score = state.p2Score || 0;

        if (isP1HitP2) p1Score += 1;
        if (isP2HitP1) p2Score += 1;

        const isRoundWon = isP1HitP2 || isP2HitP1;
        const roundWinnerStatus = isP1HitP2 ? 'p1_win' : (isP2HitP1 ? 'p2_win' : 'idle');
        const nextTurnOwner = isRoundWon ? (isP1HitP2 ? 'player2' : 'player1') : (shooter === 'player1' ? 'player2' : 'player1');
        const nextAim = nextTurnOwner === 'player1' ? state.p1Aim : state.p2Aim;

        return {
          ...state,
          gameStatus: isRoundWon ? roundWinnerStatus : 'idle',
          turnOwner: nextTurnOwner,
          angle: nextAim ? nextAim.angle : state.angle,
          power: nextAim ? nextAim.power : state.power,
          p1Score,
          p2Score,
          projectilePos: null,
          projectileVel: null,
          trail: [],
          pastTrails: trailPoints && trailPoints.length > 0 ? [...state.pastTrails, newPastTrail] : state.pastTrails,
          p1PastTrails: shooter === 'player1' && trailPoints ? [...state.p1PastTrails, newPastTrail] : state.p1PastTrails,
          p2PastTrails: shooter === 'player2' && trailPoints ? [...state.p2PastTrails, newPastTrail] : state.p2PastTrails,
          roundCompleted: isRoundWon,
          showEndSummary: isRoundWon,
        };
      }

      let newScore = state.score;
      if (action.status === 'hit_target') newScore += 100;
      if (action.status === 'hit_enemy') newScore += 150;

      let updatedEnemyShip = state.level.enemyShip;
      if (action.status === 'hit_enemy' && updatedEnemyShip) {
        updatedEnemyShip = { ...updatedEnemyShip, status: 'disabled' };
      }

      const isRoundWon = action.status === 'hit_target';

      return {
        ...state,
        gameStatus: isRoundWon ? 'hit_target' : 'idle',
        projectilePos: null,
        projectileVel: null,
        trail: [],
        pastTrails: trailPoints && trailPoints.length > 0 ? [...state.pastTrails, newPastTrail] : state.pastTrails,
        score: newScore,
        roundCompleted: isRoundWon,
        showEndSummary: isRoundWon,
        level: updatedEnemyShip
          ? { ...state.level, enemyShip: updatedEnemyShip }
          : state.level,
        enemyTrail: (updatedEnemyShip && updatedEnemyShip.status === 'disabled') ? [] : state.enemyTrail,
      };
    }

    case 'REMATCH_DUEL': {
      const lvlConfig = {
        generationMode: 'duel',
        difficultyTier: state.difficultyTier,
        planetCount: state.planetCount,
        gravityG: state.gravityG,
        massMult: state.massMult,
        boardScale: state.boardScale,
        enableBlackHoles: state.enableBlackHoles,
        enableAsteroids: state.enableAsteroids,
        enableWormholes: state.enableWormholes,
        enablePulsars: state.enablePulsars,
        enableBoosters: state.enableBoosters,
        enableShields: state.enableShields,
        enableEnemyShip: true,
      };
      const newLvl = generateRandomLevel(960, 600, lvlConfig);
      return {
        ...state,
        gameStatus: 'idle',
        turnOwner: 'player1',
        projectilePos: null,
        projectileVel: null,
        trail: [],
        pastTrails: [],
        p1PastTrails: [],
        p2PastTrails: [],
        p1Aim: { angle: 335, power: 55 },
        p2Aim: { angle: 155, power: 55 },
        angle: 335,
        power: 55,
        roundCompleted: false,
        showEndSummary: false,
        level: newLvl,
      };
    }

    case 'START_ENEMY_TURN':
      return {
        ...state,
        gameStatus: 'enemy_aiming',
        turnOwner: 'enemy',
        enemyAimInfo: action.aimInfo,
        enemyProjectilePos: { x: state.level.enemyShip.x, y: state.level.enemyShip.y },
        enemyProjectileVel: action.aimInfo.initialVel,
        enemyTrail: [{ x: state.level.enemyShip.x, y: state.level.enemyShip.y }],
      };

    case 'START_ENEMY_FLIGHT':
      return {
        ...state,
        gameStatus: 'enemy_flying',
      };

    case 'UPDATE_ENEMY_PROJECTILE':
      return {
        ...state,
        enemyProjectilePos: action.pos,
        enemyProjectileVel: action.vel,
        enemyTrail: [...state.enemyTrail, action.pos],
      };

    case 'END_ENEMY_SHOT':
      return {
        ...state,
        gameStatus: action.status,
        turnOwner: 'player',
        enemyAimInfo: null,
        enemyProjectilePos: null,
        enemyProjectileVel: null,
        enemyTrail: (state.level.enemyShip && state.level.enemyShip.status === 'active') ? state.enemyTrail : [],
        roundCompleted: action.status === 'hit_player',
        showEndSummary: action.status === 'hit_player',
      };

    case 'RESET_LEVEL': {
      const lvl = action.newLevel;
      const isDuel = state.gameMode === 'duel';
      return {
        ...state,
        gameStatus: 'idle',
        turnOwner: isDuel ? 'player1' : 'player',
        projectilePos: null,
        projectileVel: null,
        trail: [],
        pastTrails: [],
        p1PastTrails: [],
        p2PastTrails: [],
        enemyAimInfo: null,
        enemyProjectilePos: null,
        enemyProjectileVel: null,
        enemyTrail: [],
        roundCompleted: false,
        showEndSummary: false,
        level: lvl,
        enableBlackHoles: Boolean(lvl?.blackHoles && lvl.blackHoles.length > 0),
        enableAsteroids: Boolean(lvl?.asteroids && lvl.asteroids.length > 0),
        enableWormholes: Boolean(lvl?.wormholes && lvl.wormholes.length > 0),
        enablePulsars: Boolean(lvl?.pulsars && lvl.pulsars.length > 0),
        enableBoosters: Boolean(lvl?.boosters && lvl.boosters.length > 0),
        enableShields: Boolean(lvl?.shields && lvl.shields.length > 0),
        enableEnemyShip: isDuel ? true : Boolean(lvl?.enemyShip && lvl.enemyShip.status === 'active'),
        elapsedTime: 0,
      };
    }

    case 'TOGGLE_PAST_TRAILS':
      return { ...state, showAllPastTrails: !state.showAllPastTrails };

    case 'TOGGLE_OVERLAY':
      return { ...state, [action.key]: !state[action.key] };

    case 'DISMISS_SUMMARY':
      return { ...state, showEndSummary: false };

    default:
      return state;
  }
}
