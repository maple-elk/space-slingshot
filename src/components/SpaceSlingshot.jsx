import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { generateRandomLevel, calculateIndividualGravitationalAccels, calculateGravitationalAccel, getEvaluatedLevelAtTime } from '../utils/physics';
import { generateRandomLevel as generateRandomLevel3D } from '../utils/physics3d';
import { playPopSound, playSnapSound, playVictorySound } from '../utils/audio';
import { gameEvents } from '../utils/EventBus';
import { gameReducer, initialGameState } from '../game/gameReducer';
import { useCamera } from '../game/camera/useCamera';
import { useGameInput } from '../game/input/useGameInput';
import { useGameLoop } from '../game/loop/useGameLoop';
import { SpaceCanvas } from './renderers/SpaceCanvas';
import SpaceCanvas3D from './renderers/SpaceCanvas3D';
import { SlingshotTelemetryBar } from './hud/SlingshotTelemetryBar';
import { SlingshotLaunchControls } from './hud/SlingshotLaunchControls';
import { SlingshotConfigDrawer } from './hud/SlingshotConfigDrawer';
import { EndSummaryModal } from './hud/EndSummaryModal';

export default function SpaceSlingshot({
  soundEnabled = true,
  isFullscreen = false,
  onToggleFullscreen,
  dimensionMode = '2d', // '2d' | '3d' | 'solar'
  onSelectDimensionMode,
  enableSolarOrbitExt,
  onToggleSolarOrbit,
}) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [cameraTarget3D, setCameraTarget3D] = useState(null);
  const svgRef = useRef(null);

  const {
    angle,
    pitch = 12,
    yaw = 350,
    power,
    isDraggingAim,
    gameStatus,
    turnOwner,
    roundCompleted,
    level,
    projectilePos,
    projectileVel,
    projectileAccel,
    trail,
    pastTrails,
    showAllPastTrails,
    shotsTaken,
    currentScore,
    score,
    enemyAimInfo,
    enemyProjectilePos,
    enemyTrail,
    simSpeedScale,
    boardScale,
    gravityG,
    planetCount,
    massMult,
    enableBlackHoles,
    enableAsteroids,
    enableWormholes,
    enablePulsars,
    enableBoosters,
    enableShields,
    enableEnemyShip,
    enableSolarOrbit,
    launcherVelocityMode,
    showOrbitRings,
    sunMass,
    elapsedTime,
    showGravityGradients,
    showGravityVectors,
    showNetVector,
    isOrbitPaused,
    shotOutcome,
  } = state;

  const is3D = dimensionMode === '3d';
  const isSimulating = gameStatus === 'flying' || gameStatus === 'enemy_flying';

  // Sync external mode changes
  useEffect(() => {
    if (dimensionMode) {
      dispatch({ type: 'SET_SETTING', key: 'dimensionMode', value: dimensionMode });
      if (dimensionMode === 'solar' && !enableSolarOrbit) {
        dispatch({ type: 'SET_SETTING', key: 'enableSolarOrbit', value: true });
      } else if (dimensionMode !== 'solar' && enableSolarOrbit) {
        dispatch({ type: 'SET_SETTING', key: 'enableSolarOrbit', value: false });
      }
    }
  }, [dimensionMode]);

  // Orbit animation ticker for Solar Orbit mode
  useEffect(() => {
    if (dimensionMode !== 'solar' && !enableSolarOrbit) return;
    if (isOrbitPaused && !isSimulating) return;

    let lastTime = performance.now();
    let animId;

    const tick = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      dispatch({ type: 'UPDATE_ELAPSED_TIME', dt });
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [dimensionMode, enableSolarOrbit, isOrbitPaused, isSimulating]);

  // Sound Event Bus Subscriptions
  useEffect(() => {
    const unsubs = [
      gameEvents.on('VICTORY', () => {
        playVictorySound(soundEnabled);
        playSnapSound(soundEnabled);
      }),
      gameEvents.on('SNAP', () => playSnapSound(soundEnabled)),
      gameEvents.on('POP', () => playPopSound(soundEnabled)),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [soundEnabled]);

  // Camera System for 2D
  const { viewBox, updateCameraTarget, updateCameraForSummary, resetCamera } = useCamera(boardScale);

  // Evaluated level with active orbital positions at current elapsedTime
  const currentLevel = (enableSolarOrbit || dimensionMode === 'solar') && !is3D
    ? getEvaluatedLevelAtTime(level, elapsedTime, gravityG)
    : level;

  const { ship = { x: 0, y: 0, z: 0 }, target = { x: 500, y: 0, z: 0, radius: 24 } } = currentLevel;

  // Level Generator Trigger
  const handleNewLevel = useCallback(
    (customConfig) => {
      const bScale = customConfig?.boardScale !== undefined ? customConfig.boardScale : boardScale;
      const cfg = {
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
        enableSolarOrbit: dimensionMode === 'solar' || enableSolarOrbit,
        sunMass,
        ...customConfig,
      };

      const newLvl = is3D
        ? generateRandomLevel3D(1200, 800, cfg)
        : generateRandomLevel(960, 600, cfg);

      dispatch({ type: 'RESET_LEVEL', newLevel: newLvl });
      setCameraTarget3D(null);

      if (!is3D) resetCamera(bScale);
      gameEvents.emit('SNAP');
    },
    [
      is3D,
      dimensionMode,
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
      enableSolarOrbit,
      sunMass,
      resetCamera,
    ]
  );

  // Re-generate level if switching between 2D and 3D
  useEffect(() => {
    handleNewLevel();
  }, [dimensionMode]);

  // Physics Loop System
  const { handleLaunch, handleStopFlight } = useGameLoop({
    gameStatus,
    turnOwner,
    roundCompleted,
    angle,
    pitch,
    yaw,
    power,
    level: currentLevel,
    gravityG,
    simSpeedScale,
    enableEnemyShip,
    launcherVelocityMode,
    dispatch,
    updateCameraTarget: is3D ? setCameraTarget3D : updateCameraTarget,
    handleNewLevel,
  });

  // Pointer & Keyboard Input System for 2D
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useGameInput({
    svgRef,
    ship,
    isSimulating,
    turnOwner,
    roundCompleted,
    gameStatus,
    angle,
    power,
    isDraggingAim,
    dispatch,
    handleLaunch,
    handleStopFlight,
    handleNewLevel,
  });

  // 3D Keyboard Aiming Controls
  useEffect(() => {
    if (!is3D) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const code = e.code;

      if (code === 'Space') {
        e.preventDefault();
        if (roundCompleted) handleNewLevel();
        else if (isSimulating) handleStopFlight();
        else handleLaunch();
      } else if (code === 'KeyW' || code === 'ArrowUp') {
        e.preventDefault();
        if (e.shiftKey) dispatch({ type: 'SET_AIM', power: Math.min(180, power + 5) });
        else dispatch({ type: 'SET_AIM', pitch: Math.min(85, pitch + 2) });
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) dispatch({ type: 'SET_AIM', power: Math.max(10, power - 5) });
        else dispatch({ type: 'SET_AIM', pitch: Math.max(-85, pitch - 2) });
      } else if (code === 'KeyA' || code === 'ArrowLeft') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', yaw: (yaw - 3 + 360) % 360 });
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', yaw: (yaw + 3) % 360 });
      } else if (code === 'KeyE' || code === 'PageUp') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', power: Math.min(180, power + 5) });
      } else if (code === 'KeyQ' || code === 'PageDown') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', power: Math.max(10, power - 5) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [is3D, roundCompleted, isSimulating, pitch, yaw, power, handleLaunch, handleStopFlight, handleNewLevel]);

  // Derived Live Telemetry Metrics
  const currentPos = projectilePos || ship;
  const targetDist = Math.round(
    Math.hypot(
      currentPos.x - target.x,
      currentPos.y - target.y,
      (currentPos.z || 0) - (target.z || 0)
    )
  );
  const currentSpeed = Math.round(
    Math.hypot(
      projectileVel?.x || 0,
      projectileVel?.y || 0,
      projectileVel?.z || 0
    ) * 60
  );

  // 2D Gravity Vector Calculations
  const individualVectors = is3D ? [] : calculateIndividualGravitationalAccels(currentPos.x, currentPos.y, currentLevel, gravityG);
  const netAccel = is3D ? { ax: 0, ay: 0 } : calculateGravitationalAccel(currentPos.x, currentPos.y, currentLevel, gravityG);

  const netMag = Math.hypot(netAccel.x, netAccel.y);
  const netAngle = Math.atan2(netAccel.y, netAccel.x);
  const netVectorLength = netMag < 0.05 ? 0 : Math.max(16, Math.min(80, netMag * 45));
  const netVectorEnd = {
    x: currentPos.x + netVectorLength * Math.cos(netAngle),
    y: currentPos.y + netVectorLength * Math.sin(netAngle),
  };

  const arrowHeadLen = 10;
  const netP1 = {
    x: netVectorEnd.x - arrowHeadLen * Math.cos(netAngle - Math.PI / 6),
    y: netVectorEnd.y - arrowHeadLen * Math.sin(netAngle - Math.PI / 6),
  };
  const netP2 = {
    x: netVectorEnd.x - arrowHeadLen * Math.cos(netAngle + Math.PI / 6),
    y: netVectorEnd.y - arrowHeadLen * Math.sin(netAngle + Math.PI / 6),
  };
  const netLabelPos = {
    x: currentPos.x + (netVectorLength + 16) * Math.cos(netAngle),
    y: currentPos.y + (netVectorLength + 16) * Math.sin(netAngle),
  };

  const showAll = showAllPastTrails || roundCompleted;
  const maxPastTrails = showAll ? pastTrails.length : 3;
  const startIndex = pastTrails.length - maxPastTrails;
  const displayedPastTrails = pastTrails.slice(-maxPastTrails).map((trailObj, idx) => ({
    ...trailObj,
    shotNumber: startIndex + idx + 1,
    opacity: roundCompleted ? 0.8 : 0.25 + (idx / maxPastTrails) * 0.45,
  }));

  return (
    <div className={`space-slingshot-viewport ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* Top Telemetry HUD Bar */}
      <SlingshotTelemetryBar
        targetDist={targetDist}
        currentSpeed={currentSpeed}
        netAccelMag={netMag}
        score={score || currentScore}
        gameStatus={gameStatus}
        enemyAimInfo={enemyAimInfo}
        pastTrails={pastTrails}
        showAllPastTrails={showAllPastTrails}
        enableSolarOrbit={dimensionMode === 'solar' || enableSolarOrbit}
        isOrbitPaused={isOrbitPaused}
        onTogglePauseOrbits={() => dispatch({ type: 'TOGGLE_PAUSE_ORBITS' })}
        onTogglePastTrails={() => dispatch({ type: 'TOGGLE_PAST_TRAILS' })}
        onNewLevel={() => handleNewLevel()}
        onToggleConfig={() => setIsConfigOpen((v) => !v)}
        isConfigOpen={isConfigOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* Main Game Stage Area */}
      <div className="space-stage-container" style={{ position: 'relative', flex: 1 }}>
        {is3D ? (
          <>
            <SpaceCanvas3D
              level={currentLevel}
              pitch={pitch}
              yaw={yaw}
              power={power}
              gameStatus={gameStatus}
              projectilePos={projectilePos}
              projectileVel={projectileVel}
              trail={trail}
              pastTrails={pastTrails}
              showAllPastTrails={showAllPastTrails}
              cameraTarget={cameraTarget3D}
              gravityG={gravityG}
            />

            {/* 3D Aim Vector Overlay Badge */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 25,
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '12px',
                padding: '10px 16px',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                fontFamily: 'Outfit',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎯 3D Aim Vector</span>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', gap: '14px', marginTop: '4px' }}>
                <span style={{ color: '#38bdf8' }}>Pitch (θ): <strong>{pitch}°</strong></span>
                <span style={{ color: '#a855f7' }}>Yaw (φ): <strong>{yaw}°</strong></span>
                <span style={{ color: '#f59e0b' }}>Power: <strong>{power}</strong></span>
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '4px' }}>
                ⌨️ W/S/▲▼ Pitch • A/D/◀▶ Yaw • Q/E Power
              </div>
            </div>
          </>
        ) : (
          <SpaceCanvas
            svgRef={svgRef}
            viewBox={viewBox}
            level={currentLevel}
            angle={angle}
            power={power}
            isSimulating={isSimulating}
            turnOwner={turnOwner}
            roundCompleted={roundCompleted}
            gameStatus={gameStatus}
            showGravityGradients={showGravityGradients}
            showGravityVectors={showGravityVectors}
            showNetVector={showNetVector}
            displayedPastTrails={displayedPastTrails}
            enemyAimInfo={enemyAimInfo}
            enemyTrail={enemyTrail}
            enemyProjectilePos={enemyProjectilePos}
            projectilePos={projectilePos}
            projectileVel={projectileVel}
            projectileAccel={projectileAccel}
            trail={trail}
            individualVectors={individualVectors}
            netMag={netMag}
            netVectorEnd={netVectorEnd}
            netP1={netP1}
            netP2={netP2}
            netLabelPos={netLabelPos}
            handlePointerMove={handlePointerMove}
            handlePointerUp={handlePointerUp}
            handlePointerDown={handlePointerDown}
          />
        )}

        {/* Slingshot Launch Controls Bar */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 30 }}>
          <SlingshotLaunchControls
            angle={angle}
            pitch={pitch}
            yaw={yaw}
            power={power}
            dimensionMode={dimensionMode}
            isSimulating={isSimulating}
            turnOwner={turnOwner}
            roundCompleted={roundCompleted}
            gameStatus={gameStatus}
            dispatch={dispatch}
            handleLaunch={handleLaunch}
            handleStopFlight={handleStopFlight}
            handleNewLevel={handleNewLevel}
          />
        </div>
      </div>

      {/* Slingshot Configuration Drawer Modal */}
      <SlingshotConfigDrawer
        isOpen={isConfigOpen}
        state={state}
        dispatch={dispatch}
        onClose={() => setIsConfigOpen(false)}
        handleNewLevel={(cfg) => handleNewLevel(cfg)}
      />

      {/* End of Round Summary Modal */}
      {state.showEndSummary && (
        <EndSummaryModal
          gameStatus={gameStatus}
          pastTrails={pastTrails}
          score={score}
          onNextLevel={() => handleNewLevel()}
          onDismiss={() => dispatch({ type: 'DISMISS_SUMMARY' })}
        />
      )}
    </div>
  );
}
