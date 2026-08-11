/**
 * Deep Link & URL Parameter Synchronization Utility for Space Slingshot
 */

const DEFAULT_SETTINGS = {
  difficultyTier: 'auto',
  planetCount: 'auto',
  gravityG: 400,
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
};

const VALID_TIERS = new Set(['auto', 'easy', 'medium', 'hard', 'extreme', 'nightmare', 'singularity', 'level1', 'level2', 'level3', 'level4', 'level5']);

function parseBool(val) {
  if (val === null || val === undefined) return undefined;
  const s = String(val).toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'open') return true;
  if (s === '0' || s === 'false' || s === 'no') return false;
  return undefined;
}

/**
 * Parse URL query string into game settings, level generator config, and UI state
 * @param {string} searchString - e.g. window.location.search
 * @returns {object} Parsed settings and metadata
 */
export function parseDeepLinkQuery(searchString) {
  let query = typeof searchString === 'string'
    ? searchString
    : (typeof window !== 'undefined' ? window.location.search : '');

  if (query.includes('#')) {
    query = query.slice(0, query.indexOf('#'));
  }

  if (query.includes('?')) {
    query = query.slice(query.indexOf('?'));
  }

  const params = new URLSearchParams(query);
  const parsed = {};

  // Generation Mode ('random' | 'preset' | 'runtime_scored')
  const modeParam = params.get('mode');
  if (modeParam && ['random', 'preset', 'runtime_scored'].includes(modeParam.toLowerCase())) {
    parsed.mapGenerationMode = modeParam.toLowerCase();
  }

  // Tier
  const tierParam = params.get('tier');
  if (tierParam && VALID_TIERS.has(tierParam.toLowerCase())) {
    parsed.difficultyTier = tierParam.toLowerCase();
  }

  // Seed
  const seedParam = params.get('seed');
  if (seedParam !== null && !isNaN(Number(seedParam))) {
    parsed.seed = Math.floor(Math.abs(Number(seedParam))) & 0x7fffffff;
  }

  // Gravity G
  const gParam = params.get('g');
  if (gParam !== null && !isNaN(Number(gParam))) {
    parsed.gravityG = Math.max(100, Math.min(2000, Number(gParam)));
  }

  // Planet Count
  const planetsParam = params.get('planets');
  if (planetsParam) {
    if (planetsParam.toLowerCase() === 'auto') {
      parsed.planetCount = 'auto';
    } else if (!isNaN(Number(planetsParam))) {
      parsed.planetCount = Math.max(1, Math.min(5, Number(planetsParam)));
    }
  }

  // Board Scale
  const scaleParam = params.get('scale');
  if (scaleParam !== null && !isNaN(Number(scaleParam))) {
    parsed.boardScale = Math.max(0.6, Math.min(2.5, Number(scaleParam)));
  }

  // Speed Scale
  const speedParam = params.get('speed');
  if (speedParam !== null && !isNaN(Number(speedParam))) {
    parsed.simSpeedScale = Math.max(0.1, Math.min(3.0, Number(speedParam)));
  }

  // Mass Multiplier
  const massParam = params.get('mass');
  if (massParam !== null && !isNaN(Number(massParam))) {
    parsed.massMult = Math.max(0.2, Math.min(5.0, Number(massParam)));
  }

  // Object Feature Toggles
  const enemyB = parseBool(params.get('enemy'));
  if (enemyB !== undefined) parsed.enableEnemyShip = enemyB;

  const bhB = parseBool(params.get('bh'));
  if (bhB !== undefined) parsed.enableBlackHoles = bhB;

  const astB = parseBool(params.get('ast'));
  if (astB !== undefined) parsed.enableAsteroids = astB;

  const wormB = parseBool(params.get('worm'));
  if (wormB !== undefined) parsed.enableWormholes = wormB;

  const pulsarB = parseBool(params.get('pulsar'));
  if (pulsarB !== undefined) parsed.enablePulsars = pulsarB;

  const boosterB = parseBool(params.get('booster'));
  if (boosterB !== undefined) parsed.enableBoosters = boosterB;

  const shieldB = parseBool(params.get('shield'));
  if (shieldB !== undefined) parsed.enableShields = shieldB;

  // Visual Overlays
  const vectorsB = parseBool(params.get('vectors'));
  if (vectorsB !== undefined) parsed.showGravityVectors = vectorsB;

  const gradientsB = parseBool(params.get('gradients'));
  if (gradientsB !== undefined) parsed.showGravityGradients = gradientsB;

  const netB = parseBool(params.get('net'));
  if (netB !== undefined) parsed.showNetVector = netB;

  // Drawer Modal State
  const menuParam = params.get('menu');
  const isConfigOpen = parseBool(menuParam) ?? false;

  return {
    parsedSettings: parsed,
    seed: parsed.seed,
    isConfigOpen,
    hasDeepLink: Object.keys(parsed).length > 0 || isConfigOpen,
  };
}

/**
 * Build URL query string from state and level seed
 * @param {object} state - Game reducer state or setting overrides
 * @param {number} levelSeed - Current level seed
 * @param {boolean} isConfigOpen - Whether config drawer is open
 * @param {string} baseUrl - Optional base URL
 * @returns {string} Full deep link URL
 */
export function buildDeepLinkUrl(state = {}, levelSeed = null, isConfigOpen = false, baseUrl = null) {
  const params = new URLSearchParams();

  const mode = state.mapGenerationMode || state.level?.generationMode;
  if (mode && mode !== 'random') params.set('mode', mode);

  const tier = state.difficultyTier || 'auto';
  if (tier !== 'auto') params.set('tier', tier);

  const seed = levelSeed ?? state.level?.seed ?? state.seed;
  if (seed !== undefined && seed !== null) params.set('seed', String(seed));

  if (state.gravityG !== undefined && state.gravityG !== DEFAULT_SETTINGS.gravityG) {
    params.set('g', String(state.gravityG));
  }

  if (state.planetCount !== undefined && state.planetCount !== DEFAULT_SETTINGS.planetCount) {
    params.set('planets', String(state.planetCount));
  }

  if (state.boardScale !== undefined && state.boardScale !== DEFAULT_SETTINGS.boardScale) {
    params.set('scale', String(state.boardScale));
  }

  if (state.simSpeedScale !== undefined && state.simSpeedScale !== DEFAULT_SETTINGS.simSpeedScale) {
    params.set('speed', String(state.simSpeedScale));
  }

  if (state.massMult !== undefined && state.massMult !== DEFAULT_SETTINGS.massMult) {
    params.set('mass', String(state.massMult));
  }

  const isExtremeOrNightmare = tier === 'extreme' || tier === 'nightmare';

  if (state.enableEnemyShip === true) params.set('enemy', '1');
  else if (state.enableEnemyShip === false && isExtremeOrNightmare) params.set('enemy', '0');

  if (state.enableBlackHoles === true) params.set('bh', '1');
  else if (state.enableBlackHoles === false && isExtremeOrNightmare) params.set('bh', '0');

  if (state.enableAsteroids === true) params.set('ast', '1');
  else if (state.enableAsteroids === false && isExtremeOrNightmare) params.set('ast', '0');

  if (state.enableWormholes === true) params.set('worm', '1');
  else if (state.enableWormholes === false) params.set('worm', '0');

  if (state.enablePulsars === true) params.set('pulsar', '1');
  else if (state.enablePulsars === false) params.set('pulsar', '0');

  if (state.enableBoosters === true) params.set('booster', '1');
  else if (state.enableBoosters === false) params.set('booster', '0');

  if (state.enableShields === true) params.set('shield', '1');
  else if (state.enableShields === false) params.set('shield', '0');

  if (state.showGravityVectors === true) params.set('vectors', '1');
  if (state.showGravityGradients === false) params.set('gradients', '0');
  if (state.showNetVector === true) params.set('net', '1');

  if (isConfigOpen) params.set('menu', 'open');

  const queryString = params.toString();

  if (baseUrl) {
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  if (typeof window !== 'undefined') {
    const originPath = `${window.location.origin}${window.location.pathname}`;
    return queryString ? `${originPath}?${queryString}` : originPath;
  }

  return queryString ? `?${queryString}` : '';
}

/**
 * Synchronize current game state with browser URL using history.replaceState
 */
export function syncUrlWithState(state, levelSeed = null, isConfigOpen = false) {
  if (typeof window === 'undefined' || !window.history || !window.history.replaceState) return;

  const newUrl = buildDeepLinkUrl(state, levelSeed, isConfigOpen);
  window.history.replaceState(null, '', newUrl);
}

/**
 * Copy deep link URL for current state to clipboard
 */
export async function copyDeepLinkToClipboard(state, levelSeed = null, isConfigOpen = false) {
  const url = buildDeepLinkUrl(state, levelSeed, isConfigOpen);
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // Fallback below
    }
  }

  // Fallback for non-HTTPS or unsupported browsers
  if (typeof document !== 'undefined') {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }

  return false;
}
