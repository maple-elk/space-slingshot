import { PlanetRenderer } from '../../components/renderers/PlanetRenderer';
import { BlackHoleRenderer } from '../../components/renderers/BlackHoleRenderer';
import { AsteroidRenderer } from '../../components/renderers/AsteroidRenderer';
import { WormholeRenderer } from '../../components/renderers/WormholeRenderer';
import { PulsarRenderer } from '../../components/renderers/PulsarRenderer';
import { BoosterRenderer } from '../../components/renderers/BoosterRenderer';
import { ShieldRenderer } from '../../components/renderers/ShieldRenderer';

/**
 * Data-Driven Space Object Registry Definition
 * Defines physics properties, rendering components, and level generation rules for space phenomena.
 */
export const spaceObjectRegistry = {
  planet: {
    type: 'planet',
    name: 'Gravitational Planet',
    icon: '🪐',
    category: 'gravitational',
    renderer: PlanetRenderer,
    physicsConfig: {
      behavior: 'attract',
      defaultRadius: 35,
      collisionRadiusOffset: 5,
      hasGravityField: true,
      fieldMultiplier: 2.6,
    },
    generatorConfig: {
      enabledKey: 'enablePlanets',
      clearanceRadius: 85,
    },
  },
  black_hole: {
    type: 'black_hole',
    name: 'Black Hole Event Horizon',
    icon: '🕳️',
    category: 'gravitational',
    renderer: BlackHoleRenderer,
    physicsConfig: {
      behavior: 'destroy',
      eventRadius: 40,
      radius: 20,
      massMultiplier: 3.5,
      hasGravityField: true,
    },
    generatorConfig: {
      enabledKey: 'enableBlackHoles',
      clearanceRadius: 100,
    },
  },
  asteroid: {
    type: 'asteroid',
    name: 'Asteroid Drag Cloud',
    icon: '🪨',
    category: 'obstacle',
    renderer: AsteroidRenderer,
    physicsConfig: {
      behavior: 'drag',
      dragFactor: 0.94,
      defaultRadius: 36,
    },
    generatorConfig: {
      enabledKey: 'enableAsteroids',
      clearanceRadius: 75,
    },
  },
  wormhole: {
    type: 'wormhole',
    name: 'Wormhole Portal',
    icon: '🌀',
    category: 'portal',
    renderer: WormholeRenderer,
    physicsConfig: {
      behavior: 'teleport',
      defaultRadius: 22,
    },
    generatorConfig: {
      enabledKey: 'enableWormholes',
      clearanceRadius: 70,
    },
  },
  pulsar: {
    type: 'pulsar',
    name: 'Pulsar Anti-Gravity Emitter',
    icon: '⚡',
    category: 'gravitational',
    renderer: PulsarRenderer,
    physicsConfig: {
      behavior: 'repel',
      defaultRadius: 24,
      defaultMass: -140,
      hasGravityField: true,
    },
    generatorConfig: {
      enabledKey: 'enablePulsars',
      clearanceRadius: 95,
    },
  },
  booster: {
    type: 'booster',
    name: 'Speed Booster Gate',
    icon: '🚀',
    category: 'modifier',
    renderer: BoosterRenderer,
    physicsConfig: {
      behavior: 'boost',
      boostMultiplier: 1.55,
      defaultRadius: 22,
    },
    generatorConfig: {
      enabledKey: 'enableBoosters',
      clearanceRadius: 80,
    },
  },
  shield: {
    type: 'shield',
    name: 'Shield Deflector Moon',
    icon: '🛡️',
    category: 'deflector',
    renderer: ShieldRenderer,
    physicsConfig: {
      behavior: 'bounce',
      shieldRadius: 42,
      coreRadius: 16,
      reboundMultiplier: 1.05,
    },
    generatorConfig: {
      enabledKey: 'enableShields',
      clearanceRadius: 85,
    },
  },
};

/**
 * Registers a new custom space object type dynamically into the system
 * @param {string} key 
 * @param {Object} config 
 */
export function registerSpaceObject(key, config) {
  if (spaceObjectRegistry[key]) {
    console.warn(`Space object type '${key}' is already registered. Overwriting.`);
  }
  spaceObjectRegistry[key] = config;
}

/**
 * Retrieves all registered space object type definitions
 * @returns {Array<Object>}
 */
export function getAllRegisteredSpaceObjects() {
  return Object.values(spaceObjectRegistry);
}
