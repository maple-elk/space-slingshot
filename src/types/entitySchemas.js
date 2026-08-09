/**
 * Entity Schemas & JSDoc Type Definitions for Space Slingshot
 * Centralizes data contracts for game entities, level parameters, and state transitions.
 */

/**
 * @typedef {Object} Point2D
 * @property {number} x - Horizontal coordinate
 * @property {number} y - Vertical coordinate
 */

/**
 * @typedef {Object} Vector2D
 * @property {number} x - X component
 * @property {number} y - Y component
 */

/**
 * @typedef {Object} Ship
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} Target
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} radius - Target hit radius (default 24)
 */

/**
 * @typedef {Object} Planet
 * @property {number} id - Unique identifier
 * @property {number} x - X center position
 * @property {number} y - Y center position
 * @property {number} radius - Planet radius
 * @property {number} mass - Gravitational mass
 * @property {string} fill - CSS color fill
 * @property {string} glow - CSS rgba glow color
 * @property {string} name - Display name
 */

/**
 * @typedef {Object} BlackHole
 * @property {string} id - Unique identifier
 * @property {number} x - Singularity X coordinate
 * @property {number} y - Singularity Y coordinate
 * @property {number} radius - Visual core radius
 * @property {number} eventRadius - Event horizon destruction threshold radius
 * @property {number} mass - Base gravitational mass (amplified 3.5x in physics engine)
 */

/**
 * @typedef {Object} AsteroidCloud
 * @property {string} id - Unique identifier
 * @property {number} x - Center X position
 * @property {number} y - Center Y position
 * @property {number} radius - Boundary radius
 * @property {number} dragFactor - Velocity damping multiplier per frame (e.g. 0.983)
 */

/**
 * @typedef {Object} WormholePortal
 * @property {string} id - Portal identifier
 * @property {number} x - Center X position
 * @property {number} y - Center Y position
 * @property {number} radius - Portal trigger radius
 * @property {string} color - CSS accent color
 * @property {string} pairId - Destination portal ID
 */

/**
 * @typedef {Object} Pulsar
 * @property {string} id - Unique identifier
 * @property {number} x - Center X position
 * @property {number} y - Center Y position
 * @property {number} radius - Pulsar core radius
 * @property {number} mass - Repulsive mass (negative value)
 * @property {string} color - CSS glow color
 */

/**
 * @typedef {Object} BoosterGate
 * @property {string} id - Unique identifier
 * @property {number} x - Center X position
 * @property {number} y - Center Y position
 * @property {number} radius - Gate trigger radius
 * @property {number} boostMult - Velocity multiplier when passing through (e.g. 1.45)
 */

/**
 * @typedef {Object} ShieldMoon
 * @property {string} id - Unique identifier
 * @property {number} x - Center X position
 * @property {number} y - Center Y position
 * @property {number} radius - Inner moon core radius
 * @property {number} shieldRadius - Outer elastic shield boundary radius
 * @property {number} mass - Moon gravitational mass
 */

/**
 * @typedef {Object} EnemyShip
 * @property {string} id - Unique identifier
 * @property {number} x - Center X position
 * @property {number} y - Center Y position
 * @property {number} radius - Hitbox radius
 * @property {'active' | 'disabled'} status - Ship status
 * @property {string} name - Display name
 */

/**
 * @typedef {Object} Level
 * @property {number} [seed] - Seed used for PRNG generation
 * @property {Ship} ship - Player starting position
 * @property {Target} target - Target destination
 * @property {Planet[]} planets - Array of gravitational planets
 * @property {BlackHole[]} blackHoles - Array of black holes
 * @property {AsteroidCloud[]} asteroids - Array of asteroid drag clouds
 * @property {WormholePortal[]} wormholes - Array of paired teleport portals
 * @property {Pulsar[]} pulsars - Array of repulsive pulsars
 * @property {BoosterGate[]} boosters - Array of speed booster gates
 * @property {ShieldMoon[]} shields - Array of elastic shield moons
 * @property {EnemyShip|null} enemyShip - Optional hostile enemy ship
 */

/**
 * @typedef {Object} TrajectoryShot
 * @property {'direct' | 'slingshot' | 'lob'} archetype
 * @property {string} archetypeName
 * @property {number} angleDeg
 * @property {number} power
 * @property {Vector2D} initialVel
 */

/**
 * @typedef {'idle' | 'aiming' | 'flying' | 'enemy_aiming' | 'enemy_flying' | 'hit_target' | 'hit_enemy' | 'hit_player' | 'hit_planet' | 'black_hole' | 'out_of_bounds'} GameStatus
 */

export const SCHEMAS_VERSION = '1.0.0';
