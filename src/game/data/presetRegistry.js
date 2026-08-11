import presetsLevel2 from './presets_level2.json';
import presetsLevel3 from './presets_level3.json';
import presetsLevel4 from './presets_level4.json';
import presetsLevel5 from './presets_level5.json';

const CATALOGS = {
  level2: presetsLevel2,
  level3: presetsLevel3,
  level4: presetsLevel4,
  level5: presetsLevel5,

  // Friendly aliases
  easy: presetsLevel2,
  medium: presetsLevel3,
  hard: presetsLevel4,
  extreme: presetsLevel4,
  nightmare: presetsLevel4,
  singularity: presetsLevel5,
};

/**
 * Normalizes tier keys to standardized catalog tier keys
 * @param {string} tier 
 * @returns {'level2'|'level3'|'level4'|'level5'}
 */
export function normalizeTierKey(tier = 'level2') {
  if (!tier || tier === 'auto') return 'level2';
  const key = String(tier).toLowerCase();
  if (key === 'easy' || key === 'level2') return 'level2';
  if (key === 'medium' || key === 'level3') return 'level3';
  if (key === 'hard' || key === 'extreme' || key === 'nightmare' || key === 'level4') return 'level4';
  if (key === 'singularity' || key === 'level5') return 'level5';
  return 'level2';
}

/**
 * Get all available golden seed presets grouped by tier
 */
export function getAllGoldenPresets() {
  return {
    level2: presetsLevel2,
    level3: presetsLevel3,
    level4: presetsLevel4,
    level5: presetsLevel5,
  };
}

/**
 * Get a specific preset or random preset for a tier
 * @param {string} tier - Tier name (easy, medium, hard, nightmare, singularity, level2-5)
 * @param {number|null} seed - Optional seed to look up
 * @returns {object|null} Preserved level preset or null
 */
export function getGoldenPreset(tier = 'level2', seed = null) {
  const normKey = normalizeTierKey(tier);
  const catalog = CATALOGS[normKey] || [];

  if (catalog.length === 0) return null;

  if (seed !== null && seed !== undefined) {
    const matched = catalog.find((p) => p.seed === Number(seed));
    if (matched) return matched;
  }

  // If seed given doesn't match or no seed given, pick deterministically based on seed mod or random
  if (seed !== null && seed !== undefined) {
    const idx = Math.abs(Number(seed)) % catalog.length;
    return catalog[idx];
  }

  const randomIndex = Math.floor(Math.random() * catalog.length);
  return catalog[randomIndex];
}
