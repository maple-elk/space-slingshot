/**
 * 2D Gravitational Physics Engine & Level Generator for Space Slingshot
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

// Generate random level layout with planets, target, spaceship, enemy ship, and optional space phenomena
export function generateRandomLevel(width = 960, height = 600, config = {}) {
  const seed = config.seed !== undefined ? Number(config.seed) : Math.floor(Math.random() * 2147483647);
  const rng = mulberry32(seed);

  const boardScale = config.boardScale ? Number(config.boardScale) : 1.0;
  const sW = width * boardScale;
  const sH = height * boardScale;

  const countSetting = config.planetCount || 'auto';
  const numPlanets =
    countSetting === 'auto'
      ? 2 + Math.floor(rng() * 2)
      : Math.max(1, Math.min(5, Number(countSetting)));

  const massMult = config.massMult ? Number(config.massMult) : 1.0;

  // Target Station
  const target = {
    x: Math.round(sW - 110 * boardScale),
    y: Math.round(100 * boardScale + rng() * 260 * boardScale),
    radius: 24,
  };

  // Space Objects lists
  const planets = [];
  const blackHoles = [];
  const asteroids = [];
  const wormholes = [];
  const pulsars = [];
  const boosters = [];
  const shields = [];

  const planetColors = [
    { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.35)', name: 'Magenta Prime' },
    { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.35)', name: 'Aetheria' },
    { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)', name: 'Neptuna' },
    { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)', name: 'Helios Jr' },
    { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', name: 'Verdant' },
  ];

  const occupiedList = [];

  const isPositionOccupied = (x, y, minClearance = 80 * Math.sqrt(boardScale)) => {
    if (Math.hypot(x - target.x, y - target.y) < minClearance) return true;
    for (const item of occupiedList) {
      if (Math.hypot(x - item.x, y - item.y) < minClearance + item.radius) return true;
    }
    return false;
  };

  // 1. Generate Planets
  for (let i = 0; i < numPlanets; i++) {
    let px, py, radius, mass;
    let attempts = 0;

    do {
      px = (250 + rng() * (width - 460)) * boardScale;
      py = (90 + rng() * 260) * boardScale;
      radius = 28 + Math.floor(rng() * 34);
      mass = Math.round(radius * (1.2 + rng() * 1.5) * massMult);
      attempts++;
    } while (isPositionOccupied(px, py, radius + 40 * Math.sqrt(boardScale)) && attempts < 120);

    const theme = planetColors[i % planetColors.length];
    const planetObj = {
      id: i + 1,
      x: Math.round(px),
      y: Math.round(py),
      radius,
      mass,
      fill: theme.fill,
      glow: theme.glow,
      name: theme.name,
    };

    planets.push(planetObj);
    occupiedList.push(planetObj);
  }

  // 2. Optional Black Hole
  if (config.enableBlackHoles) {
    let bx, by;
    let attempts = 0;
    do {
      bx = (280 + rng() * (width - 500)) * boardScale;
      by = (100 + rng() * 240) * boardScale;
      attempts++;
    } while (isPositionOccupied(bx, by, 110 * Math.sqrt(boardScale)) && attempts < 120);

    const bh = {
      id: 'bh_1',
      x: Math.round(bx),
      y: Math.round(by),
      radius: 18,
      eventRadius: 46,
      mass: 220 * massMult,
    };
    blackHoles.push(bh);
    occupiedList.push(bh);
  }

  // 3. Optional Asteroid Cloud / Asteroid Belt
  if (config.enableAsteroids) {
    let ax, ay;
    let attempts = 0;
    do {
      ax = (250 + rng() * (width - 450)) * boardScale;
      ay = (90 + rng() * 260) * boardScale;
      attempts++;
    } while (isPositionOccupied(ax, ay, 90 * Math.sqrt(boardScale)) && attempts < 120);

    const ast = {
      id: 'ast_1',
      x: Math.round(ax),
      y: Math.round(ay),
      radius: 68,
      dragFactor: 0.983,
    };
    asteroids.push(ast);
    occupiedList.push(ast);
  }

  // 4. Optional Wormhole Portals
  if (config.enableWormholes) {
    let w1x, w1y, w2x, w2y;
    let attempts = 0;
    do {
      w1x = (220 + rng() * 200) * boardScale;
      w1y = (90 + rng() * 260) * boardScale;
      w2x = (width - 360 + rng() * 200) * boardScale;
      w2y = (90 + rng() * 260) * boardScale;
      attempts++;
    } while (
      (isPositionOccupied(w1x, w1y, 70 * Math.sqrt(boardScale)) || isPositionOccupied(w2x, w2y, 70 * Math.sqrt(boardScale))) &&
      attempts < 150
    );

    const portalA = { id: 'portal_a', x: Math.round(w1x), y: Math.round(w1y), radius: 22, color: '#06b6d4', pairId: 'portal_b' };
    const portalB = { id: 'portal_b', x: Math.round(w2x), y: Math.round(w2y), radius: 22, color: '#a855f7', pairId: 'portal_a' };

    wormholes.push(portalA, portalB);
    occupiedList.push(portalA, portalB);
  }

  // 5. Optional Repulsive Pulsar
  if (config.enablePulsars) {
    let rx, ry;
    let attempts = 0;
    do {
      rx = (260 + rng() * (width - 480)) * boardScale;
      ry = (90 + rng() * 260) * boardScale;
      attempts++;
    } while (isPositionOccupied(rx, ry, 95 * Math.sqrt(boardScale)) && attempts < 120);

    const pulsar = {
      id: 'pul_1',
      x: Math.round(rx),
      y: Math.round(ry),
      radius: 24,
      mass: -140 * massMult,
      color: '#38bdf8',
    };
    pulsars.push(pulsar);
    occupiedList.push(pulsar);
  }

  // 6. Optional Speed Booster Gate
  if (config.enableBoosters) {
    let gx, gy;
    let attempts = 0;
    do {
      gx = (240 + rng() * (width - 450)) * boardScale;
      gy = (90 + rng() * 260) * boardScale;
      attempts++;
    } while (isPositionOccupied(gx, gy, 80 * Math.sqrt(boardScale)) && attempts < 120);

    const booster = {
      id: 'boost_1',
      x: Math.round(gx),
      y: Math.round(gy),
      radius: 26,
      boostMult: 1.45,
    };
    boosters.push(booster);
    occupiedList.push(booster);
  }

  // 7. Optional Elastic Shield Moon
  if (config.enableShields) {
    let mx, my;
    let attempts = 0;
    do {
      mx = (260 + rng() * (width - 460)) * boardScale;
      my = (90 + rng() * 260) * boardScale;
      attempts++;
    } while (isPositionOccupied(mx, my, 85 * Math.sqrt(boardScale)) && attempts < 120);

    const shieldObj = {
      id: 'shield_1',
      x: Math.round(mx),
      y: Math.round(my),
      radius: 20,
      shieldRadius: 40,
      mass: 40 * massMult,
    };
    shields.push(shieldObj);
    occupiedList.push(shieldObj);
  }

  // 8. Optional Hostile Enemy Spaceship
  let enemyShip = null;
  if (config.enableEnemyShip) {
    let ex, ey;
    let attempts = 0;
    do {
      ex = (width - 260 + rng() * 140) * boardScale;
      ey = (90 + rng() * 260) * boardScale;
      attempts++;
    } while (isPositionOccupied(ex, ey, 90 * Math.sqrt(boardScale)) && attempts < 120);

    const enemyObj = {
      id: 'enemy_1',
      x: Math.round(ex),
      y: Math.round(ey),
      radius: 20,
      status: 'active',
      name: 'Enemy Interceptor',
    };
    enemyShip = enemyObj;
    occupiedList.push(enemyObj);
  }

  // Generate random player spaceship position (well clear of bottom HUD)
  let sx, sy, shipOverlap;
  let shipAttempts = 0;
  do {
    shipOverlap = false;
    sx = (140 + rng() * 120) * boardScale;
    sy = (100 + rng() * 250) * boardScale;

    if (isPositionOccupied(sx, sy, 80 * Math.sqrt(boardScale))) shipOverlap = true;
    shipAttempts++;
  } while (shipOverlap && shipAttempts < 150);

  const ship = { x: Math.round(sx), y: Math.round(sy) };

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

// 3-Archetype Enemy AI Aiming Trajectory Generator
export function calculateEnemyAim(enemyShip, playerShip, level, gravityG = DEFAULT_G) {
  if (!enemyShip || enemyShip.status !== 'active') return null;

  const dx = playerShip.x - enemyShip.x;
  const dy = playerShip.y - enemyShip.y;
  const directAngle = Math.atan2(dy, dx);

  const randVal = Math.random();
  let chosenArchetype = 'direct';
  let archetypeName = '🎯 Direct Pressure';

  if (randVal < 0.40) {
    chosenArchetype = 'direct';
    archetypeName = '🎯 Direct Pressure';
  } else if (randVal < 0.75) {
    chosenArchetype = 'slingshot';
    archetypeName = '🪐 Slingshot Trick Shot';
  } else {
    chosenArchetype = 'lob';
    archetypeName = '🚀 Deep Space Lob';
  }

  let finalAngle = directAngle;
  let finalPower = 50;

  if (chosenArchetype === 'direct') {
    // Direct pressure with humanized ±12° scatter
    const errorDeg = (Math.random() * 24 - 12);
    finalAngle = directAngle + (errorDeg * Math.PI) / 180;
    finalPower = 42 + Math.random() * 25;
  } else if (chosenArchetype === 'slingshot') {
    // Slingshot around nearest planet's gravity well
    const { planets = [] } = level;
    if (planets.length > 0) {
      const nearestPlanet = planets.reduce((prev, curr) => {
        const dPrev = Math.hypot(prev.x - enemyShip.x, prev.y - enemyShip.y);
        const dCurr = Math.hypot(curr.x - enemyShip.x, curr.y - enemyShip.y);
        return dCurr < dPrev ? curr : prev;
      }, planets[0]);

      // Target tangent edge of nearest planet
      const pAngle = Math.atan2(nearestPlanet.y - enemyShip.y, nearestPlanet.x - enemyShip.x);
      const tangentOffset = (Math.random() > 0.5 ? 1 : -1) * 0.35;
      finalAngle = pAngle + tangentOffset;
      finalPower = 48 + Math.random() * 28;
    } else {
      finalAngle = directAngle + ((Math.random() * 30 - 15) * Math.PI) / 180;
      finalPower = 55;
    }
  } else if (chosenArchetype === 'lob') {
    // Deep Space Lob (high angle offset, high power 75-90)
    const lobOffsetDeg = Math.random() > 0.5 ? (40 + Math.random() * 30) : -(40 + Math.random() * 30);
    finalAngle = directAngle + (lobOffsetDeg * Math.PI) / 180;
    finalPower = 72 + Math.random() * 20;
  }

  const finalAngleDeg = Math.round(((finalAngle * 180) / Math.PI + 360) % 360);

  return {
    archetype: chosenArchetype,
    archetypeName,
    angleDeg: finalAngleDeg,
    power: Math.round(finalPower),
    initialVel: {
      x: (finalPower / 4.8) * Math.cos(finalAngle),
      y: (finalPower / 4.8) * Math.sin(finalAngle),
    },
  };
}

// Return level as-is in 2D mode
export function getEvaluatedLevelAtTime(level) {
  return level;
}

// Calculate individual gravitational acceleration vectors
export function calculateIndividualGravitationalAccels(x, y, level, gravityG = DEFAULT_G) {
  const { planets = [], blackHoles = [], pulsars = [] } = level;
  const sources = [
    ...planets,
    ...blackHoles.map((b) => ({ ...b, fill: '#f97316', name: 'Black Hole Singularity', mass: b.mass * 3.5 })),
    ...pulsars.map((p) => ({ ...p, fill: '#38bdf8', name: 'Repulsive Pulsar' })),
  ];

  return sources.map((p) => {
    const dx = p.x - x;
    const dy = p.y - y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    if (dist < (p.radius || 20) * 0.5) {
      return { planet: p, ax: 0, ay: 0, accelMag: 0, angle: 0, dist };
    }

    const rawAccel = (gravityG * p.mass) / Math.max(distSq, 400);
    const accelMag = Math.abs(rawAccel);
    const rawAngle = Math.atan2(dy, dx);
    const angle = rawAccel < 0 ? rawAngle + Math.PI : rawAngle;
    const ax = rawAccel * (dx / dist);
    const ay = rawAccel * (dy / dist);

    return {
      planet: p,
      ax,
      ay,
      accelMag,
      angle,
      dist,
    };
  });
}

// Calculate total net gravitational acceleration at position (x, y)
export function calculateGravitationalAccel(x, y, level, gravityG = DEFAULT_G) {
  let ax = 0;
  let ay = 0;

  const { planets = [], blackHoles = [], pulsars = [] } = level;
  const sources = [
    ...planets,
    ...blackHoles.map((b) => ({ ...b, mass: b.mass * 3.5 })),
    ...pulsars,
  ];

  for (const p of sources) {
    const dx = p.x - x;
    const dy = p.y - y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    if (dist < (p.radius || 20) * 0.5) continue;

    const accel = (gravityG * p.mass) / Math.max(distSq, 400);

    ax += accel * (dx / dist);
    ay += accel * (dy / dist);
  }

  return { ax, ay };
}

// Step physics forward by dt seconds with space phenomena interactions
export function updateProjectilePhysics(
  pos,
  vel,
  level,
  dt = 0.016,
  gravityG = DEFAULT_G,
  simSpeedScale = 1.0,
  warpCooldown = 0
) {
  const { ax, ay } = calculateGravitationalAccel(pos.x, pos.y, level, gravityG);
  const SPEED_FACTOR = 0.55 * simSpeedScale;

  let vx = vel.x + ax * dt * 35 * SPEED_FACTOR;
  let vy = vel.y + ay * dt * 35 * SPEED_FACTOR;

  // 1. Asteroid Cloud Drag / Friction
  const { asteroids = [], wormholes = [], boosters = [] } = level;
  for (const ast of asteroids) {
    if (Math.hypot(pos.x - ast.x, pos.y - ast.y) <= ast.radius) {
      vx *= ast.dragFactor;
      vy *= ast.dragFactor;
    }
  }

  // 2. Booster Speed Gate Pass-Through
  for (const b of boosters) {
    if (Math.hypot(pos.x - b.x, pos.y - b.y) <= b.radius && !b.boostedThisShot) {
      vx *= b.boostMult;
      vy *= b.boostMult;
      b.boostedThisShot = true;
    }
  }

  let nPos = {
    x: pos.x + vx * dt * 35 * SPEED_FACTOR,
    y: pos.y + vy * dt * 35 * SPEED_FACTOR,
  };

  let newWarpCooldown = Math.max(0, warpCooldown - 1);

  // 3. Wormhole Portal Teleportation
  if (wormholes.length >= 2 && newWarpCooldown === 0) {
    for (const w of wormholes) {
      if (Math.hypot(nPos.x - w.x, nPos.y - w.y) <= w.radius) {
        const destPortal = wormholes.find((item) => item.id === w.pairId);
        if (destPortal) {
          nPos = { x: destPortal.x, y: destPortal.y };
          newWarpCooldown = 30; // 30 frames warp cooldown
          break;
        }
      }
    }
  }

  return {
    pos: nPos,
    vel: { x: vx, y: vy },
    accel: { ax, ay },
    warpCooldown: newWarpCooldown,
  };
}

// Check collisions: 'target', 'hit_enemy', 'hit_player', 'planet', 'black_hole', 'shield_bounce', 'out_of_bounds', or 'none'
export function checkCollisions(pos, vel, level, shooter = 'player', width = 960, height = 600) {
  const { target, ship, enemyShip, planets = [], blackHoles = [], shields = [] } = level;

  // Check target hit (only player can hit target)
  if (shooter === 'player' && Math.hypot(pos.x - target.x, pos.y - target.y) <= target.radius + 6) {
    return { type: 'target' };
  }

  // Check player hit enemy ship
  if (
    shooter === 'player' &&
    enemyShip &&
    enemyShip.status === 'active' &&
    Math.hypot(pos.x - enemyShip.x, pos.y - enemyShip.y) <= enemyShip.radius + 6
  ) {
    return { type: 'hit_enemy', name: 'Enemy Interceptor' };
  }

  // Check enemy hit player ship
  if (
    shooter === 'enemy' &&
    Math.hypot(pos.x - ship.x, pos.y - ship.y) <= 18
  ) {
    return { type: 'hit_player', name: 'Your Ship' };
  }

  // Check Black Hole Event Horizon hit
  for (const bh of blackHoles) {
    if (Math.hypot(pos.x - bh.x, pos.y - bh.y) <= bh.eventRadius) {
      return { type: 'black_hole', name: 'Black Hole Event Horizon' };
    }
  }

  // Check Elastic Shield Moon Bounce
  for (const sh of shields) {
    const d = Math.hypot(pos.x - sh.x, pos.y - sh.y);
    if (d <= sh.shieldRadius && d >= sh.radius) {
      const nx = (pos.x - sh.x) / d;
      const ny = (pos.y - sh.y) / d;
      const dot = vel.x * nx + vel.y * ny;

      if (dot < 0) {
        const rVx = vel.x - 2 * dot * nx;
        const rVy = vel.y - 2 * dot * ny;
        return {
          type: 'shield_bounce',
          reflectedVel: { x: rVx * 1.05, y: rVy * 1.05 },
        };
      }
    }
  }

  // Check planet hits
  for (const p of planets) {
    if (Math.hypot(pos.x - p.x, pos.y - p.y) <= p.radius + 5) {
      return { type: 'planet', name: p.name };
    }
  }

  // Generous Deep Space Outer Arena Boundary (7.5x standard board)
  if (pos.x < -6000 || pos.x > 6960 || pos.y < -4000 || pos.y > 4600) {
    return { type: 'out_of_bounds' };
  }

  return { type: 'none' };
}

