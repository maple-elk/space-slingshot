import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  generateRandomLevel,
  updateProjectilePhysics,
  calculateGravitationalAccel,
  calculateIndividualGravitationalAccels,
  checkCollisions,
  calculateEnemyAim,
  DEFAULT_G,
} from '../utils/physics';
import { playPopSound, playSnapSound, playVictorySound } from '../utils/audio';
import { gameEvents } from '../utils/EventBus';
import { gameReducer, initialGameState } from '../game/gameReducer';
import styles from './SpaceSlingshot.module.css';
import { Play, RotateCcw, Compass, Zap, Eye, EyeOff, Sliders, Activity, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';

export default function SpaceGravityGame({ soundEnabled, isFullscreen }) {
  const svgRef = useRef(null);

  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const {
    planetCount,
    gravityG,
    massMult,
    simSpeedScale,
    boardScale,
    enableBlackHoles,
    enableAsteroids,
    enableWormholes,
    enablePulsars,
    enableBoosters,
    enableShields,
    enableEnemyShip,
    showGravityGradients,
    showGravityVectors,
    showNetVector,
    showSettingsOverlay,
    level,
    angle,
    power,
    isDraggingAim,
    pastTrails,
    showAllPastTrails,
    gameStatus,
    turnOwner,
    score,
    projectilePos,
    projectileVel,
    projectileAccel,
    trail,
    enemyAimInfo,
    enemyProjectilePos,
    enemyProjectileVel,
    enemyTrail,
    roundCompleted,
    showEndSummary,
  } = state;

  const isSimulating = gameStatus === 'flying' || gameStatus === 'enemy_flying';

  // Wire EventBus listeners for sound and confetti side-effects
  useEffect(() => {
    const unsubs = [
      gameEvents.on('VICTORY', () => {
        playVictorySound(soundEnabled);
        try {
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
        } catch (e) {}
      }),
      gameEvents.on('SNAP', () => playSnapSound(soundEnabled)),
      gameEvents.on('POP', () => playPopSound(soundEnabled)),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [soundEnabled]);

  // Dynamic Deep Space Camera Zoom State [minX, minY, width, height]
  const getDefaultViewBox = useCallback((scale = boardScale) => {
    return [-100 * scale, -60 * scale, 1160 * scale, 725 * scale];
  }, [boardScale]);

  const [viewBox, setViewBox] = useState([-100, -60, 1160, 725]);
  const currentViewBoxRef = useRef([-100, -60, 1160, 725]);
  const targetViewBoxRef = useRef([-100, -60, 1160, 725]);

  // Set target viewBox bounds to enclose board and active projectile (clamped to max space arena)
  const updateCameraTarget = useCallback((activePos) => {
    if (!activePos) {
      targetViewBoxRef.current = getDefaultViewBox(boardScale);
    } else {
      const margin = 180 * boardScale;
      let minX = Math.min(-100 * boardScale, activePos.x - margin);
      let maxX = Math.max(1060 * boardScale, activePos.x + margin);
      let minY = Math.min(-60 * boardScale, activePos.y - margin);
      let maxY = Math.max(660 * boardScale, activePos.y + margin);

      let w = maxX - minX;
      let h = maxY - minY;

      const aspect = 1.6;
      if (w / h < aspect) {
        w = h * aspect;
        const cx = (minX + maxX) / 2;
        minX = cx - w / 2;
      } else {
        h = w / aspect;
        const cy = (minY + maxY) / 2;
        minY = cy - h / 2;
      }

      // Clamp camera max zoom to outer space arena bounds
      const MAX_W = 6800;
      const MAX_H = 4250;
      if (w > MAX_W) {
        const cx = minX + w / 2;
        w = MAX_W;
        minX = cx - w / 2;
      }
      if (h > MAX_H) {
        const cy = minY + h / 2;
        h = MAX_H;
        minY = cy - h / 2;
      }

      targetViewBoxRef.current = [minX, minY, w, h];
    }
  }, [boardScale, getDefaultViewBox]);

  // Dedicated Continuous Camera LERP Engine (Runs independently of physics state)
  useEffect(() => {
    let animId;
    const lerpCamera = () => {
      const cur = currentViewBoxRef.current;
      const tgt = targetViewBoxRef.current;

      const dx = tgt[0] - cur[0];
      const dy = tgt[1] - cur[1];
      const dw = tgt[2] - cur[2];
      const dh = tgt[3] - cur[3];

      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(dw) > 0.05 || Math.abs(dh) > 0.05) {
        const lerp = 0.1;
        const nextVB = [
          cur[0] + dx * lerp,
          cur[1] + dy * lerp,
          cur[2] + dw * lerp,
          cur[3] + dh * lerp,
        ];
        currentViewBoxRef.current = nextVB;
        setViewBox(nextVB);
      }
      animId = requestAnimationFrame(lerpCamera);
    };

    animId = requestAnimationFrame(lerpCamera);
    return () => cancelAnimationFrame(animId);
  }, []);

  const animRef = useRef(null);
  const enemyAnimRef = useRef(null);
  const velRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const warpCooldownRef = useRef(0);

  const enemyVelRef = useRef({ x: 0, y: 0 });
  const enemyPosRef = useRef({ x: 0, y: 0 });
  const enemyWarpCooldownRef = useRef(0);

  const {
    ship,
    target,
    planets = [],
    blackHoles = [],
    asteroids = [],
    wormholes = [],
    pulsars = [],
    boosters = [],
    shields = [],
    enemyShip,
  } = level;

  // Generate new level with current customization settings
  const handleNewLevel = useCallback(
    (customConfig) => {
      const bScale = customConfig?.boardScale !== undefined ? customConfig.boardScale : boardScale;
      const cfg = customConfig || {
        planetCount,
        massMult,
        boardScale: bScale,
        enableBlackHoles,
        enableAsteroids,
        enableWormholes,
        enablePulsars,
        enableBoosters,
        enableShields,
        enableEnemyShip,
      };

      const newLvl = generateRandomLevel(960, 600, cfg);
      dispatch({ type: 'RESET_LEVEL', newLevel: newLvl });

      const defVB = getDefaultViewBox(bScale);
      targetViewBoxRef.current = defVB;
      currentViewBoxRef.current = defVB;
      setViewBox(defVB);
      gameEvents.emit('SNAP');
    },
    [
      boardScale,
      planetCount,
      massMult,
      enableBlackHoles,
      enableAsteroids,
      enableWormholes,
      enablePulsars,
      enableBoosters,
      enableShields,
      enableEnemyShip,
      getDefaultViewBox,
    ]
  );

  // Convert screen pointer event to SVG space coordinates
  const getSVGCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  // Update angle and power from pointer position
  const updateAimFromPointer = (e) => {
    if (isSimulating || turnOwner !== 'player' || roundCompleted) return;
    const coords = getSVGCoordinates(e);
    const dx = coords.x - ship.x;
    const dy = coords.y - ship.y;

    const rad = Math.atan2(dy, dx);
    const deg = Math.round(((rad * 180) / Math.PI + 360) % 360);

    const dist = Math.hypot(dx, dy);
    const newPower = Math.max(10, Math.min(100, Math.round(dist / 1.7)));

    dispatch({ type: 'SET_AIM', angle: deg, power: newPower });
  };

  const handlePointerDown = (e) => {
    if (isSimulating || turnOwner !== 'player' || roundCompleted) return;
    dispatch({ type: 'SET_IS_DRAGGING_AIM', value: true });
    e.target.setPointerCapture(e.pointerId);
    updateAimFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isDraggingAim && !isSimulating) {
      updateAimFromPointer(e);
    }
  };

  const handlePointerUp = (e) => {
    if (isDraggingAim) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {}
      dispatch({ type: 'SET_IS_DRAGGING_AIM', value: false });
    }
  };

  // Trigger Enemy Counter-Attack Turn (Imperfect AI aiming with 3 archetypes)
  const triggerEnemyTurn = useCallback(() => {
    if (!enemyShip || enemyShip.status !== 'active') return;

    const aimResult = calculateEnemyAim(enemyShip, ship, level, gravityG);
    if (!aimResult) return;

    dispatch({ type: 'START_ENEMY_TURN', aimInfo: aimResult });

    setTimeout(() => {
      gameEvents.emit('POP');
      dispatch({ type: 'START_ENEMY_FLIGHT' });

      enemyPosRef.current = { x: enemyShip.x, y: enemyShip.y };
      enemyVelRef.current = aimResult.initialVel;
      enemyWarpCooldownRef.current = 0;
      const enemyBoostedIds = new Set();

      const enemyLoop = () => {
        const result = updateProjectilePhysics(
          enemyPosRef.current,
          enemyVelRef.current,
          level,
          0.016,
          gravityG,
          simSpeedScale,
          enemyWarpCooldownRef.current,
          enemyBoostedIds
        );

        enemyPosRef.current = result.pos;
        enemyVelRef.current = result.vel;
        enemyWarpCooldownRef.current = result.warpCooldown;

        dispatch({
          type: 'UPDATE_ENEMY_PROJECTILE',
          pos: result.pos,
          vel: result.vel,
        });

        updateCameraTarget(result.pos);

        const collision = checkCollisions(result.pos, result.vel, level, 'enemy', 960, 600);

        if (collision.type === 'hit_player') {
          gameEvents.emit('SNAP');
          dispatch({ type: 'END_ENEMY_SHOT', status: 'hit_player' });
          updateCameraTarget(null);
          return;
        }

        if (collision.type === 'planet' || collision.type === 'black_hole' || collision.type === 'out_of_bounds') {
          dispatch({ type: 'END_ENEMY_SHOT', status: 'idle' });
          updateCameraTarget(null);
          return;
        }

        enemyAnimRef.current = requestAnimationFrame(enemyLoop);
      };

      enemyAnimRef.current = requestAnimationFrame(enemyLoop);
    }, 850);
  }, [enemyShip, ship, level, gravityG, simSpeedScale, updateCameraTarget]);

  // Save full completed shot trail to history
  const finalizeShot = useCallback(
    (status, finalTrail) => {
      updateCameraTarget(null);
      dispatch({ type: 'END_SHOT', status, finalTrail });

      if (status !== 'hit_target' && status !== 'hit_enemy' && enableEnemyShip && level.enemyShip && level.enemyShip.status === 'active') {
        triggerEnemyTurn();
      }
    },
    [enableEnemyShip, level, triggerEnemyTurn, updateCameraTarget]
  );

  // Manually stop active flight / end turn with second spacebar press or button click
  const handleStopFlight = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (enemyAnimRef.current) cancelAnimationFrame(enemyAnimRef.current);

    updateCameraTarget(null);

    if (isSimulating) {
      finalizeShot('stopped', trail);
    } else if (gameStatus === 'enemy_flying') {
      dispatch({ type: 'END_ENEMY_SHOT', status: 'idle' });
    }
  }, [isSimulating, gameStatus, trail, finalizeShot, updateCameraTarget]);

  // Launch player projectile
  const handleLaunch = useCallback(() => {
    if (isSimulating || turnOwner !== 'player') return;

    if (roundCompleted) {
      handleNewLevel();
      return;
    }

    gameEvents.emit('POP');

    const rad = (angle * Math.PI) / 180;
    const initialVel = {
      x: (power / 4.8) * Math.cos(rad),
      y: (power / 4.8) * Math.sin(rad),
    };

    posRef.current = { x: ship.x, y: ship.y };
    velRef.current = initialVel;
    warpCooldownRef.current = 0;

    dispatch({ type: 'LAUNCH_PLAYER', pos: { x: ship.x, y: ship.y }, vel: initialVel });
  }, [isSimulating, turnOwner, roundCompleted, angle, power, ship, handleNewLevel]);

  // Keyboard controls: Arrow Keys for angle & power, Spacebar to Launch OR Stop Flight OR Advance Level!
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (roundCompleted) {
          handleNewLevel();
        } else if (isSimulating || gameStatus === 'enemy_flying') {
          handleStopFlight();
        } else if (turnOwner === 'player') {
          handleLaunch();
        }
        return;
      }

      if (isSimulating || turnOwner !== 'player' || roundCompleted) return;

      const step = e.shiftKey ? 5 : 1;

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', angle: (angle - step + 360) % 360 });
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', angle: (angle + step) % 360 });
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', power: Math.min(100, power + step) });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', power: Math.max(10, power - step) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunch, isSimulating, gameStatus, turnOwner, roundCompleted, handleNewLevel, handleStopFlight, angle, power]);

  // Physics Animation Loop for Player Shot
  useEffect(() => {
    if (gameStatus !== 'flying') return;

    let localTrail = [{ x: posRef.current.x, y: posRef.current.y }];
    const boostedBoosterIds = new Set();

    const loop = () => {
      const result = updateProjectilePhysics(
        posRef.current,
        velRef.current,
        level,
        0.016,
        gravityG,
        simSpeedScale,
        warpCooldownRef.current,
        boostedBoosterIds
      );

      posRef.current = result.pos;
      velRef.current = result.vel;
      warpCooldownRef.current = result.warpCooldown;

      dispatch({
        type: 'UPDATE_PROJECTILE',
        pos: result.pos,
        vel: result.vel,
        accel: result.accel,
      });

      localTrail.push({ x: result.pos.x, y: result.pos.y });
      updateCameraTarget(result.pos);

      const collision = checkCollisions(result.pos, result.vel, level, 'player', 960, 600);

      if (collision.type === 'target') {
        gameEvents.emit('VICTORY');
        finalizeShot('hit_target', localTrail);
        return;
      }

      if (collision.type === 'hit_enemy') {
        gameEvents.emit('VICTORY');
        finalizeShot('hit_enemy', localTrail);
        return;
      }

      if (collision.type === 'black_hole') {
        gameEvents.emit('SNAP');
        finalizeShot('black_hole', localTrail);
        return;
      }

      if (collision.type === 'shield_bounce') {
        velRef.current = collision.reflectedVel;
        gameEvents.emit('POP');
      }

      if (collision.type === 'planet') {
        gameEvents.emit('SNAP');
        finalizeShot('hit_planet', localTrail);
        return;
      }

      if (collision.type === 'out_of_bounds') {
        finalizeShot('out_of_bounds', localTrail);
        return;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameStatus, level, gravityG, simSpeedScale, finalizeShot, updateCameraTarget]);

  // Aiming vector end point in SVG
  const rad = (angle * Math.PI) / 180;
  const aimLength = power * 1.7;
  const aimVectorEnd = {
    x: ship.x + aimLength * Math.cos(rad),
    y: ship.y + aimLength * Math.sin(rad),
  };

  // Live Telemetry Calculations
  const currentPos = projectilePos || ship;
  const targetDist = Math.round(
    Math.hypot(currentPos.x - target.x, currentPos.y - target.y)
  );

  const currentSpeed = projectileVel
    ? Math.round(Math.hypot(projectileVel.x, projectileVel.y) * 10) / 10
    : 0;

  const currentHeading = projectileVel
    ? Math.round(
        ((Math.atan2(projectileVel.y, projectileVel.x) * 180) / Math.PI + 360) % 360
      )
    : angle;

  // Individual planet gravity pull vectors
  const individualVectors = calculateIndividualGravitationalAccels(
    currentPos.x,
    currentPos.y,
    level,
    gravityG
  );

  // Net total gravity pull vector
  const netAccel = isSimulating
    ? projectileAccel
    : calculateGravitationalAccel(currentPos.x, currentPos.y, level, gravityG);

  const netAccelMag = Math.hypot(netAccel.ax, netAccel.ay);
  const netAccelAngle = Math.atan2(netAccel.ay, netAccel.ax);
  const netVectorLength = Math.max(30, Math.min(130, netAccelMag * 85));
  const netVectorEnd = {
    x: currentPos.x + netVectorLength * Math.cos(netAccelAngle),
    y: currentPos.y + netVectorLength * Math.sin(netAccelAngle),
  };

  const netHeadAngle1 = netAccelAngle + Math.PI - 0.4;
  const netHeadAngle2 = netAccelAngle + Math.PI + 0.4;
  const netP1 = {
    x: netVectorEnd.x + 10 * Math.cos(netHeadAngle1),
    y: netVectorEnd.y + 10 * Math.sin(netHeadAngle1),
  };
  const netP2 = {
    x: netVectorEnd.x + 10 * Math.cos(netHeadAngle2),
    y: netVectorEnd.y + 10 * Math.sin(netHeadAngle2),
  };

  // Compute trails to display
  const displayedPastTrails = showAllPastTrails
    ? pastTrails.map((t) => ({ ...t, opacity: 0.45 }))
    : pastTrails.slice(-3).map((t, idx, arr) => {
        const distFromNewest = arr.length - 1 - idx;
        const opacities = [0.7, 0.4, 0.18];
        return {
          ...t,
          opacity: opacities[distFromNewest] || 0.18,
        };
      });

  // Calculate Threat Cone sector polygon for enemy aiming phase
  let enemyThreatArcPath = '';
  if (enemyShip && enemyAimInfo && gameStatus === 'enemy_aiming') {
    const eRad = (enemyAimInfo.angleDeg * Math.PI) / 180;
    const spread = 0.35; // ~20 degree cone width
    const r = 160;
    const x1 = enemyShip.x + r * Math.cos(eRad - spread);
    const y1 = enemyShip.y + r * Math.sin(eRad - spread);
    const x2 = enemyShip.x + r * Math.cos(eRad + spread);
    const y2 = enemyShip.y + r * Math.sin(eRad + spread);
    enemyThreatArcPath = `M ${enemyShip.x} ${enemyShip.y} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {/* Canvas Card */}
      <div className="canvas-card">
        <div className="canvas-header">
          <div className="canvas-title-group">
            <span style={{ fontSize: '1.4rem' }}>🚀</span>
            <span className="canvas-title">Gravity Slingshot Launcher</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {gameStatus === 'hit_enemy' && (
              <div className="status-badge" style={{ background: 'rgba(236, 72, 153, 0.3)', color: '#ec4899', border: '1px solid #ec4899' }}>
                💥 Enemy Ship Disabled (+150 pts)!
              </div>
            )}
            {gameStatus === 'hit_player' && (
              <div className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', border: '1px solid #ef4444' }}>
                💥 Direct Hit! Enemy orbital fire struck your ship!
              </div>
            )}
            {gameStatus === 'enemy_aiming' && enemyAimInfo && (
              <div className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b', border: '1px solid #f59e0b' }}>
                👾 Enemy Interceptor: {enemyAimInfo.archetypeName}
              </div>
            )}

            {pastTrails.length > 0 && (
              <button
                className={`btn-icon ${showAllPastTrails ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_PAST_TRAILS' })}
                title="Toggle showing all past shot trails"
              >
                {showAllPastTrails ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>
                  {showAllPastTrails
                    ? `Showing All (${pastTrails.length})`
                    : 'Show All Past Shots'}
                </span>
              </button>
            )}

            <div className="help-tip">
              <span>⌨️ ◀▶ Angle • ▲▼ Power • [Space] Shoot</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Fixed-Size HTML Telemetry HUD Badge (Always crisp & readable regardless of camera zoom) */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 25,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              fontFamily: 'Outfit',
              fontSize: '0.85rem',
              fontWeight: '700',
            }}
          >
            <span style={{ color: '#38bdf8' }}>🎯 Target: {targetDist} px</span>
            <span style={{ color: '#4ade80' }}>⚡ Speed: {currentSpeed} px/s</span>
          </div>

          <svg
            ref={svgRef}
            className="svg-viewport space-viewport"
            viewBox={viewBox.join(' ')}
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
          >
            <defs>
              <radialGradient id="spaceBg" cx="50%" cy="50%" r="75%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              {/* Planet Radial Gradients */}
              {planets.map((planet) => (
                <radialGradient key={planet.id} id={`gravGrad_${planet.id}`}>
                  <stop offset="0%" stopColor={planet.fill} stopOpacity="0.45" />
                  <stop offset="50%" stopColor={planet.fill} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={planet.fill} stopOpacity="0.0" />
                </radialGradient>
              ))}

              <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="targetGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Infinite Dynamic Deep Space Backdrop */}
            <rect
              x={viewBox[0] - 20000}
              y={viewBox[1] - 20000}
              width={viewBox[2] + 40000}
              height={viewBox[3] + 40000}
              fill="url(#spaceBg)"
            />

            {/* Optional Planet Gravity Field Gradients */}
            {showGravityGradients &&
              planets.map((planet) => (
                <circle
                  key={`grad_${planet.id}`}
                  cx={planet.x}
                  cy={planet.y}
                  r={planet.radius * 2.9}
                  fill={`url(#gravGrad_${planet.id})`}
                  style={{ pointerEvents: 'none' }}
                />
              ))}

            {/* Faded Historical Past Shot Trails */}
            {displayedPastTrails.map((past) => (
              <polyline
                key={past.id}
                points={past.points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={
                  past.status === 'hit_target'
                    ? '#4ade80'
                    : past.status === 'hit_enemy'
                    ? '#ec4899'
                    : past.status === 'black_hole'
                    ? '#f97316'
                    : past.status === 'hit_planet'
                    ? '#f87171'
                    : '#cbd5e1'
                }
                strokeWidth="2"
                strokeDasharray="4 3"
                strokeLinecap="round"
                opacity={past.opacity}
              />
            ))}

            {/* 1. Planets with Gravity Fields */}
            {planets.map((planet) => (
              <g key={planet.id}>
                <circle
                  cx={planet.x}
                  cy={planet.y}
                  r={planet.radius * 2.6}
                  fill="none"
                  stroke={planet.fill}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.35"
                />
                <circle
                  cx={planet.x}
                  cy={planet.y}
                  r={planet.radius}
                  fill={planet.fill}
                  filter="url(#planetGlow)"
                />
                <circle
                  cx={planet.x - planet.radius * 0.3}
                  cy={planet.y - planet.radius * 0.3}
                  r={planet.radius * 0.4}
                  fill="rgba(255, 255, 255, 0.25)"
                />
                <text
                  x={planet.x}
                  y={planet.y + planet.radius + 16}
                  textAnchor="middle"
                  fill="rgba(241, 245, 249, 0.75)"
                  fontSize="11"
                  fontWeight="600"
                >
                  M = {planet.mass}
                </text>
              </g>
            ))}

            {/* 2. Optional Black Holes */}
            {blackHoles.map((bh) => (
              <g key={bh.id} transform={`translate(${bh.x}, ${bh.y})`}>
                <circle
                  r={bh.eventRadius}
                  fill="rgba(249, 115, 22, 0.15)"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r={bh.radius} fill="#000000" stroke="#f97316" strokeWidth="2.5" />
                <text y={bh.eventRadius + 15} textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="700">
                  🕳️ Event Horizon
                </text>
              </g>
            ))}

            {/* 3. Optional Asteroid Clouds */}
            {asteroids.map((ast) => (
              <g key={ast.id}>
                <circle
                  cx={ast.x}
                  cy={ast.y}
                  r={ast.radius}
                  fill="rgba(245, 158, 11, 0.16)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                />
                <text x={ast.x} y={ast.y + 4} textAnchor="middle" fontSize="24" opacity="0.7">
                  🪨
                </text>
                <text x={ast.x} y={ast.y + ast.radius + 14} textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="700">
                  Asteroid Drag Cloud
                </text>
              </g>
            ))}

            {/* 4. Optional Wormhole Portals */}
            {wormholes.map((wh) => (
              <g key={wh.id} transform={`translate(${wh.x}, ${wh.y})`}>
                <circle r={wh.radius + 8} fill="none" stroke={wh.color} strokeWidth="2" strokeDasharray="4 4">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r={wh.radius} fill={`${wh.color}44`} stroke={wh.color} strokeWidth="3" />
                <text textAnchor="middle" dy="4" fontSize="14">
                  🌀
                </text>
              </g>
            ))}

            {/* 5. Optional Repulsive Pulsar */}
            {pulsars.map((pul) => (
              <g key={pul.id} transform={`translate(${pul.x}, ${pul.y})`}>
                <circle r={pul.radius + 12} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="360"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r={pul.radius} fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                <text textAnchor="middle" dy="4" fontSize="14">
                  ⚡
                </text>
                <text y={pul.radius + 16} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">
                  Pulsar (Anti-Gravity)
                </text>
              </g>
            ))}

            {/* 6. Optional Speed Booster Gate */}
            {boosters.map((b) => (
              <g key={b.id} transform={`translate(${b.x}, ${b.y})`}>
                <polygon points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="2.5" />
                <text textAnchor="middle" dy="4" fill="#4ade80" fontSize="11" fontWeight="800">
                  🚀 BOOST
                </text>
              </g>
            ))}

            {/* 7. Optional Shield Bouncer Moon */}
            {shields.map((sh) => (
              <g key={sh.id}>
                <circle cx={sh.x} cy={sh.y} r={sh.shieldRadius} fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
                <circle cx={sh.x} cy={sh.y} r={sh.radius} fill="#64748b" stroke="#ffffff" strokeWidth="2" />
                <text x={sh.x} y={sh.y + sh.shieldRadius + 14} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">
                  🛡️ Shield Deflector
                </text>
              </g>
            ))}

            {/* Red Threat Targeting Sector Arc Cone (Enemy Aiming Visual) */}
            {enemyThreatArcPath && (
              <path d={enemyThreatArcPath} fill="rgba(239, 68, 68, 0.16)" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
            )}

            {/* 8. Optional Hostile Enemy Spaceship */}
            {enemyShip && (
              <g transform={`translate(${enemyShip.x}, ${enemyShip.y})`}>
                {enemyShip.status === 'active' ? (
                  <>
                    <circle r={enemyShip.radius + 8} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
                    </circle>
                    <circle r={enemyShip.radius} fill="rgba(239, 68, 68, 0.35)" stroke="#ef4444" strokeWidth="2.5" />
                    <text textAnchor="middle" dy="5" fontSize="15">
                      👾
                    </text>
                    <text y={enemyShip.radius + 16} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">
                      Enemy Interceptor
                    </text>
                  </>
                ) : (
                  <>
                    <circle r={enemyShip.radius} fill="rgba(100, 116, 139, 0.4)" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text textAnchor="middle" dy="5" fontSize="14" opacity="0.5">
                      💥
                    </text>
                    <text y={enemyShip.radius + 14} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">
                      Disabled
                    </text>
                  </>
                )}
              </g>
            )}

            {/* Enemy Active Flying Projectile */}
            {enemyTrail.length > 1 && (
              <polyline
                points={enemyTrail.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.5"
                strokeDasharray="6 3"
                strokeLinecap="round"
                opacity="0.95"
              />
            )}

            {enemyProjectilePos && (
              <circle
                cx={enemyProjectilePos.x}
                cy={enemyProjectilePos.y}
                r="7"
                fill="#fef2f2"
                stroke="#ef4444"
                strokeWidth="3"
                filter="url(#planetGlow)"
              />
            )}

            {/* Target Station / Portal */}
            <g transform={`translate(${target.x}, ${target.y})`}>
              <circle
                r={target.radius + 10}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="6 6"
                opacity="0.7"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="10s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                r={target.radius}
                fill="rgba(56, 189, 248, 0.35)"
                stroke="#38bdf8"
                strokeWidth="3"
                filter="url(#targetGlow)"
              />
              <text textAnchor="middle" dy="5" fontSize="16">
                🎯
              </text>
            </g>

            {/* Aiming Vector Line & Drag Handle */}
            {!isSimulating && turnOwner === 'player' && !roundCompleted && (
              <g>
                <line
                  x1={ship.x}
                  y1={ship.y}
                  x2={aimVectorEnd.x}
                  y2={aimVectorEnd.y}
                  stroke="#fbbf24"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                />

                <g
                  onPointerDown={handlePointerDown}
                  style={{ cursor: isDraggingAim ? 'grabbing' : 'grab' }}
                >
                  <circle
                    cx={aimVectorEnd.x}
                    cy={aimVectorEnd.y}
                    r="20"
                    fill="rgba(251, 191, 36, 0.25)"
                    className="handle-pulse"
                  />
                  <circle
                    cx={aimVectorEnd.x}
                    cy={aimVectorEnd.y}
                    r="10"
                    fill="#fbbf24"
                    stroke="#ffffff"
                    strokeWidth="3"
                  />
                </g>
              </g>
            )}

            {/* INDIVIDUAL PLANET GRAVITY PULL VECTORS */}
            {showGravityVectors &&
              individualVectors.map((vec) => {
                const vecLen = Math.max(26, Math.min(130, vec.accelMag * 85));
                const vecEnd = {
                  x: currentPos.x + vecLen * Math.cos(vec.angle),
                  y: currentPos.y + vecLen * Math.sin(vec.angle),
                };

                const hAngle1 = vec.angle + Math.PI - 0.4;
                const hAngle2 = vec.angle + Math.PI + 0.4;
                const hp1 = {
                  x: vecEnd.x + 9 * Math.cos(hAngle1),
                  y: vecEnd.y + 9 * Math.sin(hAngle1),
                };
                const hp2 = {
                  x: vecEnd.x + 9 * Math.cos(hAngle2),
                  y: vecEnd.y + 9 * Math.sin(hAngle2),
                };

                return (
                  <g key={`vec_${vec.planet.id}`} style={{ pointerEvents: 'none' }}>
                    <line
                      x1={currentPos.x}
                      y1={currentPos.y}
                      x2={vecEnd.x}
                      y2={vecEnd.y}
                      stroke={vec.planet.fill}
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      opacity="0.9"
                    />
                    <polygon
                      points={`${vecEnd.x},${vecEnd.y} ${hp1.x},${hp1.y} ${hp2.x},${hp2.y}`}
                      fill={vec.planet.fill}
                      opacity="0.9"
                    />
                    <rect
                      x={vecEnd.x + 4}
                      y={vecEnd.y - 10}
                      width="48"
                      height="18"
                      rx="4"
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke={vec.planet.fill}
                      strokeWidth="1"
                    />
                    <text
                      x={vecEnd.x + 28}
                      y={vecEnd.y + 2}
                      textAnchor="middle"
                      fill={vec.planet.fill}
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="Outfit"
                    >
                      F{vec.planet.id}: {vec.accelMag.toFixed(1)}
                    </text>
                  </g>
                );
              })}

            {/* COMBINED NET GRAVITY VECTOR */}
            {showNetVector && netAccelMag > 0.05 && (
              <g style={{ pointerEvents: 'none' }}>
                <line
                  x1={currentPos.x}
                  y1={currentPos.y}
                  x2={netVectorEnd.x}
                  y2={netVectorEnd.y}
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  opacity="0.9"
                />
                <polygon
                  points={`${netVectorEnd.x},${netVectorEnd.y} ${netP1.x},${netP1.y} ${netP2.x},${netP2.y}`}
                  fill="#ffffff"
                />
                <rect
                  x={netVectorEnd.x + 6}
                  y={netVectorEnd.y - 12}
                  width="68"
                  height="20"
                  rx="5"
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={netVectorEnd.x + 40}
                  y={netVectorEnd.y + 2}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="800"
                  fontFamily="Outfit"
                >
                  F_net: {netAccelMag.toFixed(1)}
                </text>
              </g>
            )}

            {/* Spaceship Handle */}
            <g
              transform={`translate(${ship.x}, ${ship.y})`}
              onPointerDown={handlePointerDown}
              style={{ cursor: isDraggingAim ? 'grabbing' : 'grab' }}
            >
              <circle r="22" fill="rgba(99, 102, 241, 0.3)" />
              <circle r="15" fill="#6366f1" stroke="#ffffff" strokeWidth="2.5" />
              <text textAnchor="middle" dy="5" fontSize="14" style={{ pointerEvents: 'none' }}>
                🚀
              </text>
            </g>

            {/* Active Projectile Complete Trail Line */}
            {trail.length > 1 && (
              <polyline
                points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.95"
              />
            )}

            {/* Flying Projectile Orb */}
            {projectilePos && (
              <circle
                cx={projectilePos.x}
                cy={projectilePos.y}
                r="7"
                fill="#ffe4e6"
                stroke="#f43f5e"
                strokeWidth="3"
                filter="url(#planetGlow)"
              />
            )}

          </svg>

          {/* COMPACT NON-BLOCKING POST-MATCH SUMMARY BANNER */}
          {showEndSummary && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 30,
                width: '92%',
                maxWidth: '680px',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(56, 189, 248, 0.5)',
                borderRadius: '16px',
                padding: '12px 20px',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>
                  {gameStatus === 'hit_target'
                    ? '🎯'
                    : gameStatus === 'hit_enemy'
                    ? '💥'
                    : gameStatus === 'hit_player'
                    ? '💥'
                    : '🌌'}
                </span>
                <div>
                  <div style={{ fontFamily: 'Fredoka', fontSize: '1.1rem', color: '#ffffff', lineHeight: 1.2 }}>
                    {gameStatus === 'hit_target'
                      ? 'Target Station Destroyed!'
                      : gameStatus === 'hit_enemy'
                      ? 'Enemy Interceptor Obliterated!'
                      : gameStatus === 'hit_player'
                      ? 'Direct Hit! Enemy Destroyed Your Ship!'
                      : gameStatus === 'black_hole'
                      ? 'Swallowed by Black Hole!'
                      : 'Orbit Complete'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px', display: 'flex', gap: '12px' }}>
                    <span>📏 Flight: <strong style={{ color: '#38bdf8' }}>{trail.length * 4}px</strong></span>
                    <span>🎯 Shots: <strong style={{ color: '#fbbf24' }}>{pastTrails.length}</strong></span>
                    <span>🏆 Score: <strong style={{ color: '#ec4899' }}>{score} pts</strong></span>
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                onClick={() => handleNewLevel()}
              >
                <span>Next Solar System [Space]</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* FULLSCREEN FLOATING OVERLAY HUDS */}
        {isFullscreen && (
          <>
            {/* Floating Launch HUD (Bottom-Left) */}
            <div className="overlay-hud overlay-hud-bottom-left">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'Fredoka', color: '#ffffff', fontSize: '1.05rem' }}>🕹️ Slingshot Controls</span>
                <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>Score: {score} pts</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Angle (θ): {angle}°</span>
                    <span>Power: {power}</span>
                  </div>
                </div>
                <button className="btn-primary" onClick={handleLaunch} disabled={isSimulating || turnOwner !== 'player'} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  <Play size={16} />
                  <span>Launch [Space]</span>
                </button>
                <button className="btn-icon" onClick={() => handleNewLevel()} style={{ padding: '8px' }}>
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Floating Universe Settings Toggle (Bottom-Right) */}
            <div className="overlay-hud overlay-hud-bottom-right" style={{ maxWidth: '420px', maxHeight: '420px', overflowY: 'auto' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', paddingBottom: showSettingsOverlay ? '8px' : '0', borderBottom: showSettingsOverlay ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
                onClick={() => dispatch({ type: 'TOGGLE_OVERLAY', key: 'showSettingsOverlay' })}
              >
                <span style={{ fontFamily: 'Fredoka', color: '#ffffff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={16} color="var(--color-accent-purple)" /> Universe Config & Objects
                </span>
                {showSettingsOverlay ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </div>

              {showSettingsOverlay && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {/* Sim Speed */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                      <span>Simulation Speed</span>
                      <span style={{ color: '#4ade80', fontWeight: '700' }}>{simSpeedScale.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.2" max="2.0" step="0.1" value={simSpeedScale} onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'simSpeedScale', value: Number(e.target.value) })} style={{ width: '100%', accentColor: '#4ade80' }} />
                  </div>

                  {/* Board Size / Populated Area Scale */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                      <span>Solar System Board Size</span>
                      <span style={{ color: '#38bdf8', fontWeight: '700' }}>
                        {boardScale.toFixed(1)}x {boardScale < 0.9 ? '(Compact)' : boardScale > 1.2 ? '(Expansive)' : '(Standard)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.8"
                      step="0.1"
                      value={boardScale}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        dispatch({ type: 'SET_SETTING', key: 'boardScale', value: val });
                        handleNewLevel({ ...level, boardScale: val });
                      }}
                      style={{ width: '100%', accentColor: '#38bdf8' }}
                    />
                  </div>

                  {/* 7 Space Objects */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '6px' }}>🌌 Optional Space Objects</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', color: '#e2e8f0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={enableEnemyShip} onChange={(e) => { dispatch({ type: 'SET_SETTING', key: 'enableEnemyShip', value: e.target.checked }); handleNewLevel({ ...level, enableEnemyShip: e.target.checked, enableBlackHoles, enableAsteroids, enableWormholes, enablePulsars, enableBoosters, enableShields }); }} /> 👾 Enemy Ship
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={enableBlackHoles} onChange={(e) => { dispatch({ type: 'SET_SETTING', key: 'enableBlackHoles', value: e.target.checked }); handleNewLevel({ ...level, enableBlackHoles: e.target.checked, enableEnemyShip, enableAsteroids, enableWormholes, enablePulsars, enableBoosters, enableShields }); }} /> 🕳️ Black Hole
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={enableAsteroids} onChange={(e) => { dispatch({ type: 'SET_SETTING', key: 'enableAsteroids', value: e.target.checked }); handleNewLevel({ ...level, enableAsteroids: e.target.checked, enableEnemyShip, enableBlackHoles, enableWormholes, enablePulsars, enableBoosters, enableShields }); }} /> 🪨 Asteroids
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={enableWormholes} onChange={(e) => { dispatch({ type: 'SET_SETTING', key: 'enableWormholes', value: e.target.checked }); handleNewLevel({ ...level, enableWormholes: e.target.checked, enableEnemyShip, enableBlackHoles, enableAsteroids, enablePulsars, enableBoosters, enableShields }); }} /> 🌀 Wormholes
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={enablePulsars} onChange={(e) => { dispatch({ type: 'SET_SETTING', key: 'enablePulsars', value: e.target.checked }); handleNewLevel({ ...level, enablePulsars: e.target.checked, enableEnemyShip, enableBlackHoles, enableAsteroids, enableWormholes, enableBoosters, enableShields }); }} /> ⚡ Pulsar
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={enableBoosters} onChange={(e) => { dispatch({ type: 'SET_SETTING', key: 'enableBoosters', value: e.target.checked }); handleNewLevel({ ...level, enableBoosters: e.target.checked, enableEnemyShip, enableBlackHoles, enableAsteroids, enableWormholes, enablePulsars, enableShields }); }} /> 🚀 Speed Gate
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={enableShields} onChange={(e) => { dispatch({ type: 'SET_SETTING', key: 'enableShields', value: e.target.checked }); handleNewLevel({ ...level, enableShields: e.target.checked, enableEnemyShip, enableBlackHoles, enableAsteroids, enableWormholes, enablePulsars, enableBoosters }); }} /> 🛡️ Shield Deflector
                      </label>
                    </div>
                  </div>

                  {/* Overlays */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: '#e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showGravityVectors} onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showGravityVectors', value: e.target.checked })} /> 🪐 Planet Gravity Vectors (F1, F2...)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showNetVector} onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showNetVector', value: e.target.checked })} /> ⚡ Net Gravity Vector (F_net)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showGravityGradients} onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showGravityGradients', value: e.target.checked })} /> 🌈 Gravity Field Gradients
                    </label>
                  </div>

                  {/* Planet Count */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>
                      <span>Planets: {planetCount === 'auto' ? 'Auto (2-3)' : planetCount}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['auto', 1, 2, 3, 4, 5].map((cnt) => (
                        <button key={cnt} className={`preset-btn ${planetCount === cnt ? 'active' : ''}`} style={{ flex: 1, padding: '4px 2px', fontSize: '0.7rem' }} onClick={() => { dispatch({ type: 'SET_SETTING', key: 'planetCount', value: cnt }); handleNewLevel({ planetCount: cnt, massMult }); }}>
                          {cnt === 'auto' ? 'Auto' : `${cnt}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gravity G */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '2px' }}>
                      <span>Gravity Constant (G): {gravityG}</span>
                    </div>
                    <input type="range" min="100" max="1000" step="50" value={gravityG} onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'gravityG', value: Number(e.target.value) })} style={{ width: '100%', accentColor: '#38bdf8' }} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* STANDARD STACKED SIDEBAR CARDS (Only when NOT in Fullscreen) */}
      {!isFullscreen && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Launch Math Controls */}
          <div className="side-card">
            <div className="card-title">
              <Compass size={20} color="var(--color-accent-gold)" />
              <span>Launch Controls</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontWeight: '600',
                  }}
                >
                  <span>Launch Angle (θ) [◀ ▶]</span>
                  <span style={{ color: 'var(--color-corner-a)' }}>{angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angle}
                  disabled={isSimulating || turnOwner !== 'player' || roundCompleted}
                  onChange={(e) => dispatch({ type: 'SET_AIM', angle: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--color-corner-a)' }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontWeight: '600',
                  }}
                >
                  <span>Launch Power (|v|) [▲ ▼]</span>
                  <span style={{ color: 'var(--color-corner-c)' }}>
                    {power} Speed
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={power}
                  disabled={isSimulating || turnOwner !== 'player' || roundCompleted}
                  onChange={(e) => dispatch({ type: 'SET_AIM', power: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--color-corner-c)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  className={isSimulating || gameStatus === 'enemy_flying' ? 'btn-primary btn-danger' : 'btn-primary'}
                  style={{ flex: 1, backgroundColor: (isSimulating || gameStatus === 'enemy_flying') ? '#ef4444' : undefined }}
                  onClick={() => {
                    if (roundCompleted) handleNewLevel();
                    else if (isSimulating || gameStatus === 'enemy_flying') handleStopFlight();
                    else handleLaunch();
                  }}
                >
                  <Play size={18} />
                  <span>
                    {roundCompleted
                      ? 'Next Solar System [Space]'
                      : isSimulating || gameStatus === 'enemy_flying'
                      ? 'Stop Flight [Space] 🛑'
                      : 'Launch! [Space]'}
                  </span>
                </button>

                <button
                  className="btn-icon"
                  onClick={() => handleNewLevel()}
                  title="Generate Random Planet System"
                >
                  <RotateCcw size={18} />
                  <span>New Orbit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional Space Objects Toggle Panel */}
          <div className="side-card">
            <div className="card-title">
              <span>🌌</span>
              <span>Optional Space Objects (Defaults: OFF)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableEnemyShip}
                  onChange={(e) => {
                    dispatch({ type: 'SET_SETTING', key: 'enableEnemyShip', value: e.target.checked });
                    handleNewLevel({ ...level, enableEnemyShip: e.target.checked, enableBlackHoles, enableAsteroids, enableWormholes, enablePulsars, enableBoosters, enableShields });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                />
                <span>👾 Enemy Interceptor Duel</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableBlackHoles}
                  onChange={(e) => {
                    dispatch({ type: 'SET_SETTING', key: 'enableBlackHoles', value: e.target.checked });
                    handleNewLevel({ ...level, enableBlackHoles: e.target.checked, enableEnemyShip, enableAsteroids, enableWormholes, enablePulsars, enableBoosters, enableShields });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#f97316' }}
                />
                <span>🕳️ Black Hole</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableAsteroids}
                  onChange={(e) => {
                    dispatch({ type: 'SET_SETTING', key: 'enableAsteroids', value: e.target.checked });
                    handleNewLevel({ ...level, enableAsteroids: e.target.checked, enableEnemyShip, enableBlackHoles, enableWormholes, enablePulsars, enableBoosters, enableShields });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                />
                <span>🪨 Asteroid Drag Cloud</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableWormholes}
                  onChange={(e) => {
                    dispatch({ type: 'SET_SETTING', key: 'enableWormholes', value: e.target.checked });
                    handleNewLevel({ ...level, enableWormholes: e.target.checked, enableEnemyShip, enableBlackHoles, enableAsteroids, enablePulsars, enableBoosters, enableShields });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#a855f7' }}
                />
                <span>🌀 Wormhole Portals</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enablePulsars}
                  onChange={(e) => {
                    dispatch({ type: 'SET_SETTING', key: 'enablePulsars', value: e.target.checked });
                    handleNewLevel({ ...level, enablePulsars: e.target.checked, enableEnemyShip, enableBlackHoles, enableAsteroids, enableWormholes, enableBoosters, enableShields });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
                />
                <span>⚡ Repulsive Pulsar</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableBoosters}
                  onChange={(e) => {
                    dispatch({ type: 'SET_SETTING', key: 'enableBoosters', value: e.target.checked });
                    handleNewLevel({ ...level, enableBoosters: e.target.checked, enableEnemyShip, enableBlackHoles, enableAsteroids, enableWormholes, enablePulsars, enableShields });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                />
                <span>🚀 Speed Booster Gate</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableShields}
                  onChange={(e) => {
                    dispatch({ type: 'SET_SETTING', key: 'enableShields', value: e.target.checked });
                    handleNewLevel({ ...level, enableShields: e.target.checked, enableEnemyShip, enableBlackHoles, enableAsteroids, enableWormholes, enablePulsars, enableBoosters });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#64748b' }}
                />
                <span>🛡️ Shield Deflector Moon</span>
              </label>
            </div>
          </div>

          {/* Physics & Overlay Controls */}
          <div className="side-card">
            <div className="card-title">
              <Sliders size={20} color="var(--color-accent-purple)" />
              <span>Universe & Speed Controls</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                  }}
                >
                  <span>Simulation Flight Speed</span>
                  <span style={{ color: '#4ade80' }}>{simSpeedScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={simSpeedScale}
                  onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'simSpeedScale', value: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#4ade80' }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                  }}
                >
                  <span>Solar System Board Size</span>
                  <span style={{ color: '#38bdf8' }}>
                    {boardScale.toFixed(1)}x {boardScale < 0.9 ? '(Compact)' : boardScale > 1.2 ? '(Expansive)' : '(Standard)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={boardScale}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    dispatch({ type: 'SET_SETTING', key: 'boardScale', value: val });
                    handleNewLevel({ ...level, boardScale: val });
                  }}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showGravityVectors}
                    onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showGravityVectors', value: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#ec4899' }}
                  />
                  <span>Show Individual Planet Gravity Vectors (F1, F2...) 🪐</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showNetVector}
                    onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showNetVector', value: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#ffffff' }}
                  />
                  <span>Show Combined Net Gravity Vector (F_net) ⚡</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showGravityGradients}
                    onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showGravityGradients', value: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                  />
                  <span>Show Planet Gravity Field Gradients 🌈</span>
                </label>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                  }}
                >
                  <span>Planet Count</span>
                  <span style={{ color: '#c7d2fe' }}>
                    {planetCount === 'auto' ? 'Random (2-3)' : `${planetCount} Planets`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['auto', 1, 2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      className={`preset-btn ${planetCount === cnt ? 'active' : ''}`}
                      style={{ flex: 1, padding: '6px 4px', fontSize: '0.78rem' }}
                      onClick={() => {
                        dispatch({ type: 'SET_SETTING', key: 'planetCount', value: cnt });
                        handleNewLevel({ planetCount: cnt, massMult });
                      }}
                    >
                      {cnt === 'auto' ? 'Auto' : `${cnt}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                  }}
                >
                  <span>Gravity Constant (G)</span>
                  <span style={{ color: '#38bdf8' }}>{gravityG}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={gravityG}
                  onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'gravityG', value: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
