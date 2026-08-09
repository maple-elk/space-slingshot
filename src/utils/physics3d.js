/**
 * 3D Gravitational Physics Engine & Level Generator for Space Slingshot 3D
 */

export const DEFAULT_G = 400; // Default Gravitational Constant

/**
 * 32-bit Seedable Pseudo-Random Number Generator (Mulberry32)
 * @param {number} seed 
 * @returns {() => number} Random float between 0 and 1
 */
export function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Calculate initial 3D velocity vector from Pitch (deg), Yaw (deg), and Power (0-100)
 */
export function calculateInitialVelocity(pitchDeg, yawDeg, power) {
  const pitchRad = (pitchDeg * Math.PI) / 180;
  const yawRad = (yawDeg * Math.PI) / 180;
  const speed = power / 4.8;

  const vx = speed * Math.cos(pitchRad) * Math.cos(yawRad);
  const vy = speed * Math.sin(pitchRad);
  const vz = speed * Math.cos(pitchRad) * Math.sin(yawRad);

  return { x: vx, y: vy, z: vz };
}

/**
 * Generate random 3D level layout with planets, targets, black holes, wormholes, etc.
 */
export function generateRandomLevel(width = 1200, height = 800, config = {}) {
  const seed = config.seed !== undefined ? Number(config.seed) : Math.floor(Math.random() * 2147483647);
  const rng = mulberry32(seed);

  const massMult = config.massMult ? Number(config.massMult) : 1.0;

  // Target in 3D space
  const target = {
    x: 500,
    y: Math.round(-100 + rng() * 300),
    z: Math.round(-250 + rng() * 500),
    radius: 30,
  };

  // Player Ship starting position in 3D
  const ship = {
    x: -500,
    y: 0,
    z: 0,
  };

  const countSetting = config.planetCount || 'auto';
  const numPlanets =
    countSetting === 'auto'
      ? 3 + Math.floor(rng() * 2)
      : Math.max(1, Math.min(6, Number(countSetting)));

  const planets = [];
  const blackHoles = [];
  const asteroids = [];
  const wormholes = [];
  const pulsars = [];
  const boosters = [];
  const shields = [];
  let enemyShip = null;

  const planetColors = [
    { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.45)', name: 'Magenta Prime' },
    { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.45)', name: 'Aetheria 3D' },
    { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.45)', name: 'Neptuna Orbit' },
    { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)', name: 'Helios Sphere' },
    { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.45)', name: 'Verdant Deep' },
    { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.45)', name: 'Cyan Nova' },
  ];

  const occupiedList = [];

  const isPositionOccupied = (x, y, z, minClearance = 120) => {
    if (Math.hypot(x - target.x, y - target.y, z - target.z) < minClearance) return true;
    if (Math.hypot(x - ship.x, y - ship.y, z - ship.z) < minClearance) return true;

    for (const item of occupiedList) {
      if (Math.hypot(x - item.x, y - item.y, z - item.z) < minClearance + (item.radius || 30)) return true;
    }
    return false;
  };

  // 1. Generate 3D Planets
  for (let i = 0; i < numPlanets; i++) {
    let px, py, pz, radius, mass;
    let attempts = 0;

    do {
      px = -300 + rng() * 600;
      py = -220 + rng() * 440;
      pz = -350 + rng() * 700;
      radius = 35 + Math.floor(rng() * 40);
      mass = Math.round(radius * (1.5 + rng() * 1.8) * massMult);
      attempts++;
    } while (isPositionOccupied(px, py, pz, radius + 70) && attempts < 150);

    const theme = planetColors[i % planetColors.length];
    const planetObj = {
      id: i + 1,
      x: px,
      y: py,
      z: pz,
      radius,
      mass,
      fill: theme.fill,
      glow: theme.glow,
      name: theme.name,
    };

    planets.push(planetObj);
    occupiedList.push(planetObj);
  }

  // 2. Optional 3D Black Hole
  if (config.enableBlackHoles) {
    let bx, by, bz;
    let attempts = 0;
    do {
      bx = -250 + rng() * 500;
      by = -180 + rng() * 360;
      bz = -300 + rng() * 600;
      attempts++;
    } while (isPositionOccupied(bx, by, bz, 140) && attempts < 150);

    const bh = {
      id: 'bh_1',
      x: bx,
      y: by,
      z: bz,
      radius: 25,
      eventRadius: 65,
      mass: 320 * massMult,
    };
    blackHoles.push(bh);
    occupiedList.push(bh);
  }

  // 3. Optional 3D Asteroid Cloud
  if (config.enableAsteroids) {
    let ax, ay, az;
    let attempts = 0;
    do {
      ax = -250 + rng() * 500;
      ay = -180 + rng() * 360;
      az = -280 + rng() * 560;
      attempts++;
    } while (isPositionOccupied(ax, ay, az, 110) && attempts < 150);

    const ast = {
      id: 'ast_1',
      x: ax,
      y: ay,
      z: az,
      radius: 95,
      dragFactor: 0.983,
    };
    asteroids.push(ast);
    occupiedList.push(ast);
  }

  // 4. Optional 3D Wormhole Portals
  if (config.enableWormholes) {
    let w1x, w1y, w1z, w2x, w2y, w2z;
    let attempts = 0;
    do {
      w1x = -350 + rng() * 250;
      w1y = -150 + rng() * 300;
      w1z = -250 + rng() * 500;
      w2x = 100 + rng() * 300;
      w2y = -150 + rng() * 300;
      w2z = -250 + rng() * 500;
      attempts++;
    } while (
      (isPositionOccupied(w1x, w1y, w1z, 90) || isPositionOccupied(w2x, w2y, w2z, 90)) &&
      attempts < 180
    );

    const portalA = { id: 'portal_a', x: w1x, y: w1y, z: w1z, radius: 30, color: '#06b6d4', pairId: 'portal_b' };
    const portalB = { id: 'portal_b', x: w2x, y: w2y, z: w2z, radius: 30, color: '#a855f7', pairId: 'portal_a' };

    wormholes.push(portalA, portalB);
    occupiedList.push(portalA, portalB);
  }

  // 5. Optional 3D Repulsive Pulsar
  if (config.enablePulsars) {
    let rx, ry, rz;
    let attempts = 0;
    do {
      rx = -250 + rng() * 500;
      ry = -180 + rng() * 360;
      rz = -280 + rng() * 560;
      attempts++;
    } while (isPositionOccupied(rx, ry, rz, 120) && attempts < 150);

    const pulsar = {
      id: 'pul_1',
      x: rx,
      y: ry,
      z: rz,
      radius: 30,
      mass: -180 * massMult,
      color: '#38bdf8',
    };
    pulsars.push(pulsar);
    occupiedList.push(pulsar);
  }

  // 6. Optional 3D Speed Booster Gate
  if (config.enableBoosters) {
    let gx, gy, gz;
    let attempts = 0;
    do {
      gx = -280 + rng() * 560;
      gy = -180 + rng() * 360;
      gz = -280 + rng() * 560;
      attempts++;
    } while (isPositionOccupied(gx, gy, gz, 100) && attempts < 150);

    const booster = {
      id: 'boost_1',
      x: gx,
      y: gy,
      z: gz,
      radius: 34,
      boostMult: 1.5,
    };
    boosters.push(booster);
    occupiedList.push(booster);
  }

  // 7. Optional 3D Elastic Shield Moon
  if (config.enableShields) {
    let mx, my, mz;
    let attempts = 0;
    do {
      mx = -250 + rng() * 500;
      my = -180 + rng() * 360;
      mz = -280 + rng() * 560;
      attempts++;
    } while (isPositionOccupied(mx, my, mz, 110) && attempts < 150);

    const shieldObj = {
      id: 'shield_1',
      x: mx,
      y: my,
      z: mz,
      radius: 25,
      shieldRadius: 55,
      mass: 50 * massMult,
    };
    shields.push(shieldObj);
    occupiedList.push(shieldObj);
  }

  // 8. Optional 3D Hostile Enemy Spaceship
  if (config.enableEnemyShip) {
    let ex, ey, ez;
    let attempts = 0;
    do {
      ex = 350 + rng() * 200;
      ey = -150 + rng() * 300;
      ez = -250 + rng() * 500;
      attempts++;
    } while (isPositionOccupied(ex, ey, ez, 110) && attempts < 150);

    enemyShip = {
      id: 'enemy_1',
      x: ex,
      y: ey,
      z: ez,
      radius: 26,
      status: 'active',
      name: 'Enemy Interceptor 3D',
    };
    occupiedList.push(enemyShip);
  }

  return {
    seed,
    ship,
    target,
    planets,
    blackHoles,
    asteroids,
    wormholes,
    pulsars,
    boosters,
    shields,
    enemyShip,
  };
}

/**
 * Calculate individual 3D gravitational acceleration vectors from celestial bodies
 */
export function calculateIndividualGravitationalAccels(x, y, z = 0, level, gravityG = DEFAULT_G) {
  const { planets = [], blackHoles = [], pulsars = [] } = level;
  const sources = [
    ...planets,
    ...blackHoles.map((b) => ({ ...b, fill: '#f97316', name: 'Black Hole Singularity', mass: b.mass * 3.5 })),
    ...pulsars.map((p) => ({ ...p, fill: '#38bdf8', name: 'Repulsive Pulsar' })),
  ];

  return sources.map((p) => {
    const dx = p.x - x;
    const dy = p.y - y;
    const dz = (p.z || 0) - z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(distSq);

    if (dist < (p.radius || 20) * 0.5) {
      return { planet: p, ax: 0, ay: 0, az: 0, accelMag: 0, dist };
    }

    const rawAccel = (gravityG * p.mass) / Math.max(distSq, 600);
    const accelMag = Math.abs(rawAccel);
    const ax = rawAccel * (dx / dist);
    const ay = rawAccel * (dy / dist);
    const az = rawAccel * (dz / dist);

    return {
      planet: p,
      ax,
      ay,
      az,
      accelMag,
      dist,
    };
  });
}

/**
 * Calculate total net 3D gravitational acceleration vector at position (x, y, z)
 */
export function calculateGravitationalAccel(x, y, z = 0, level, gravityG = DEFAULT_G) {
  let ax = 0;
  let ay = 0;
  let az = 0;

  const { planets = [], blackHoles = [], pulsars = [] } = level;
  const sources = [
    ...planets,
    ...blackHoles.map((b) => ({ ...b, mass: b.mass * 3.5 })),
    ...pulsars,
  ];

  for (const p of sources) {
    const dx = p.x - x;
    const dy = p.y - y;
    const dz = (p.z || 0) - z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(distSq);

    if (dist < (p.radius || 20) * 0.5) continue;

    const accel = (gravityG * p.mass) / Math.max(distSq, 600);

    ax += accel * (dx / dist);
    ay += accel * (dy / dist);
    az += accel * (dz / dist);
  }

  return { ax, ay, az };
}

/**
 * Update 3D projectile physics state by dt seconds
 */
export function updateProjectilePhysics(
  pos,
  vel,
  level,
  dt = 0.016,
  gravityG = DEFAULT_G,
  simSpeedScale = 1.0,
  warpCooldown = 0,
  boostedSet = new Set()
) {
  const { ax, ay, az } = calculateGravitationalAccel(pos.x, pos.y, pos.z, level, gravityG);
  const SPEED_FACTOR = 0.65 * simSpeedScale;

  let vx = vel.x + ax * dt * 40 * SPEED_FACTOR;
  let vy = vel.y + ay * dt * 40 * SPEED_FACTOR;
  let vz = vel.z + az * dt * 40 * SPEED_FACTOR;

  // 1. Asteroid Cloud Drag / Friction
  const { asteroids = [], wormholes = [], boosters = [] } = level;
  for (const ast of asteroids) {
    if (Math.hypot(pos.x - ast.x, pos.y - ast.y, pos.z - ast.z) <= ast.radius) {
      vx *= ast.dragFactor;
      vy *= ast.dragFactor;
      vz *= ast.dragFactor;
    }
  }

  // 2. Booster Speed Gate Pass-Through
  for (const b of boosters) {
    if (Math.hypot(pos.x - b.x, pos.y - b.y, pos.z - b.z) <= b.radius && !boostedSet.has(b.id)) {
      vx *= b.boostMult;
      vy *= b.boostMult;
      vz *= b.boostMult;
      boostedSet.add(b.id);
    }
  }

  let nPos = {
    x: pos.x + vx * dt * 40 * SPEED_FACTOR,
    y: pos.y + vy * dt * 40 * SPEED_FACTOR,
    z: pos.z + vz * dt * 40 * SPEED_FACTOR,
  };

  let newWarpCooldown = Math.max(0, warpCooldown - 1);

  // 3. Wormhole Portal Teleportation
  if (wormholes.length >= 2 && newWarpCooldown === 0) {
    for (const w of wormholes) {
      if (Math.hypot(nPos.x - w.x, nPos.y - w.y, nPos.z - w.z) <= w.radius) {
        const destPortal = wormholes.find((item) => item.id === w.pairId);
        if (destPortal) {
          nPos = { x: destPortal.x, y: destPortal.y, z: destPortal.z };
          newWarpCooldown = 30; // 30 frames cooldown
          break;
        }
      }
    }
  }

  return {
    pos: nPos,
    vel: { x: vx, y: vy, z: vz },
    accel: { ax, ay, az },
    warpCooldown: newWarpCooldown,
  };
}

/**
 * Check 3D collisions: 'target', 'hit_enemy', 'hit_player', 'planet', 'black_hole', 'shield_bounce', 'out_of_bounds', or 'none'
 */
export function checkCollisions(pos, vel, level, shooter = 'player') {
  const { target, ship, enemyShip, planets = [], blackHoles = [], shields = [] } = level;

  // Player hit target
  if (shooter === 'player' && Math.hypot(pos.x - target.x, pos.y - target.y, pos.z - target.z) <= target.radius + 8) {
    return { type: 'target' };
  }

  // Player hit enemy ship
  if (
    shooter === 'player' &&
    enemyShip &&
    enemyShip.status === 'active' &&
    Math.hypot(pos.x - enemyShip.x, pos.y - enemyShip.y, pos.z - enemyShip.z) <= enemyShip.radius + 8
  ) {
    return { type: 'hit_enemy', name: 'Enemy Interceptor 3D' };
  }

  // Enemy hit player ship
  if (
    shooter === 'enemy' &&
    Math.hypot(pos.x - ship.x, pos.y - ship.y, pos.z - ship.z) <= 24
  ) {
    return { type: 'hit_player', name: 'Your 3D Spaceship' };
  }

  // Black Hole Event Horizon
  for (const bh of blackHoles) {
    if (Math.hypot(pos.x - bh.x, pos.y - bh.y, pos.z - bh.z) <= bh.eventRadius) {
      return { type: 'black_hole', name: 'Black Hole Event Horizon' };
    }
  }

  // Elastic Shield Moon Bounce in 3D
  for (const sh of shields) {
    const d = Math.hypot(pos.x - sh.x, pos.y - sh.y, pos.z - sh.z);
    if (d <= sh.shieldRadius && d >= sh.radius) {
      const nx = (pos.x - sh.x) / d;
      const ny = (pos.y - sh.y) / d;
      const nz = (pos.z - sh.z) / d;
      const dot = vel.x * nx + vel.y * ny + vel.z * nz;

      if (dot < 0) {
        const rVx = vel.x - 2 * dot * nx;
        const rVy = vel.y - 2 * dot * ny;
        const rVz = vel.z - 2 * dot * nz;
        return {
          type: 'shield_bounce',
          reflectedVel: { x: rVx * 1.05, y: rVy * 1.05, z: rVz * 1.05 },
        };
      }
    }
  }

  // Planet hit
  for (const p of planets) {
    if (Math.hypot(pos.x - p.x, pos.y - p.y, pos.z - p.z) <= p.radius + 6) {
      return { type: 'planet', name: p.name };
    }
  }

  // Deep space 3D arena boundary
  if (
    pos.x < -3000 || pos.x > 3000 ||
    pos.y < -2000 || pos.y > 2000 ||
    pos.z < -3000 || pos.z > 3000
  ) {
    return { type: 'out_of_bounds' };
  }

  return { type: 'none' };
}

/**
 * Predict 3D Trajectory points for pre-flight arc preview
 */
export function predict3DTrajectory(startPos, initialVel, level, gravityG = DEFAULT_G, steps = 180, dt = 0.016) {
  let currPos = { ...startPos };
  let currVel = { ...initialVel };
  let warpCooldown = 0;
  const boostedSet = new Set();
  const points = [currPos];

  for (let i = 0; i < steps; i++) {
    const res = updateProjectilePhysics(currPos, currVel, level, dt, gravityG, 1.0, warpCooldown, boostedSet);
    currPos = res.pos;
    currVel = res.vel;
    warpCooldown = res.warpCooldown;
    points.push(currPos);

    const collision = checkCollisions(currPos, currVel, level, 'player');
    if (collision.type !== 'none' && collision.type !== 'shield_bounce') {
      break;
    }
    if (collision.type === 'shield_bounce' && collision.reflectedVel) {
      currVel = collision.reflectedVel;
    }
  }

  return points;
}

/**
 * Calculate Enemy AI aim in 3D
 */
export function calculateEnemyAim(enemyShip, playerShip, level, gravityG = DEFAULT_G) {
  if (!enemyShip || enemyShip.status !== 'active') return null;

  const dx = playerShip.x - enemyShip.x;
  const dy = playerShip.y - enemyShip.y;
  const dz = playerShip.z - enemyShip.z;
  const dist2D = Math.hypot(dx, dz);

  const directPitch = Math.atan2(dy, dist2D);
  const directYaw = Math.atan2(dz, dx);

  const errorPitch = ((Math.random() * 20 - 10) * Math.PI) / 180;
  const errorYaw = ((Math.random() * 20 - 10) * Math.PI) / 180;

  const finalPitch = directPitch + errorPitch;
  const finalYaw = directYaw + errorYaw;
  const finalPower = 45 + Math.random() * 25;

  const speed = finalPower / 4.8;
  const vx = speed * Math.cos(finalPitch) * Math.cos(finalYaw);
  const vy = speed * Math.sin(finalPitch);
  const vz = speed * Math.cos(finalPitch) * Math.sin(finalYaw);

  const pitchDeg = Math.round((finalPitch * 180) / Math.PI);
  const yawDeg = Math.round(((finalYaw * 180) / Math.PI + 360) % 360);

  return {
    archetype: 'direct_3d',
    archetypeName: '🎯 3D Direct Target Lock',
    pitchDeg,
    yawDeg,
    power: Math.round(finalPower),
    initialVel: { x: vx, y: vy, z: vz },
  };
}
