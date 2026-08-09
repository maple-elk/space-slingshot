import { DEFAULT_G, generateRandomLevel } from '../utils/physics';

export const initialGameState = {
  // Settings & Customization
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

  // Visual Toggles
  showGravityGradients: true,
  showGravityVectors: true,
  showNetVector: false,
  showSettingsOverlay: false,

  // Level & Physics Layout
  level: generateRandomLevel(960, 600, {
    planetCount: 'auto',
    massMult: 1.0,
    enableBlackHoles: false,
    enableAsteroids: false,
    enableWormholes: false,
    enablePulsars: false,
    enableBoosters: false,
    enableShields: false,
    enableEnemyShip: false,
  }),

  // Aiming Controls
  angle: 335,
  power: 55,
  isDraggingAim: false,

  // Simulation & Game Status
  gameStatus: 'idle', // 'idle' | 'flying' | 'enemy_aiming' | 'enemy_flying' | 'hit_target' | 'hit_enemy' | 'hit_player' | 'hit_planet' | 'black_hole' | 'out_of_bounds'
  turnOwner: 'player', // 'player' | 'enemy'
  score: 0,
  projectilePos: null,
  projectileVel: null,
  projectileAccel: { ax: 0, ay: 0 },
  trail: [],
  pastTrails: [],
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

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_SETTING':
      return { ...state, [action.key]: action.value };

    case 'SET_AIM':
      return {
        ...state,
        angle: action.angle !== undefined ? action.angle : state.angle,
        power: action.power !== undefined ? action.power : state.power,
      };

    case 'SET_IS_DRAGGING_AIM':
      return { ...state, isDraggingAim: action.value };

    case 'LAUNCH_PLAYER':
      return {
        ...state,
        gameStatus: 'flying',
        turnOwner: 'player',
        projectilePos: action.pos,
        projectileVel: action.vel,
        projectileAccel: { ax: 0, ay: 0 },
        trail: [action.pos],
      };

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

      const newPastTrail = {
        id: `${Date.now()}_${state.pastTrails.length}`,
        status: action.status,
        points: trailPoints,
        angle: state.angle,
        power: state.power,
      };

      let newScore = state.score;
      if (action.status === 'hit_target') newScore += 100;
      if (action.status === 'hit_enemy') newScore += 150;

      let updatedEnemyShip = state.level.enemyShip;
      if (action.status === 'hit_enemy' && updatedEnemyShip) {
        updatedEnemyShip = { ...updatedEnemyShip, status: 'disabled' };
      }

      return {
        ...state,
        gameStatus: action.status,
        projectilePos: null,
        projectileVel: null,
        trail: [],
        pastTrails: trailPoints && trailPoints.length > 0 ? [...state.pastTrails, newPastTrail] : state.pastTrails,
        score: newScore,
        roundCompleted: action.status === 'hit_target' || action.status === 'hit_enemy',
        showEndSummary: action.status === 'hit_target' || action.status === 'hit_enemy',
        level: updatedEnemyShip
          ? { ...state.level, enemyShip: updatedEnemyShip }
          : state.level,
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
        enemyTrail: [],
        roundCompleted: action.status === 'hit_player',
        showEndSummary: action.status === 'hit_player',
      };

    case 'RESET_LEVEL':
      return {
        ...state,
        gameStatus: 'idle',
        turnOwner: 'player',
        projectilePos: null,
        projectileVel: null,
        trail: [],
        pastTrails: [],
        enemyAimInfo: null,
        enemyProjectilePos: null,
        enemyProjectileVel: null,
        enemyTrail: [],
        roundCompleted: false,
        showEndSummary: false,
        level: action.newLevel,
      };

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
