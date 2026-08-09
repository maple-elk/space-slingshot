import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { generateRandomLevel, calculateIndividualGravitationalAccels, calculateGravitationalAccel } from '../utils/physics';
import { playPopSound, playSnapSound, playVictorySound } from '../utils/audio';
import { gameEvents } from '../utils/EventBus';
import { gameReducer, initialGameState } from '../game/gameReducer';
import { useCamera } from '../game/camera/useCamera';
import { useGameInput } from '../game/input/useGameInput';
import { useGameLoop } from '../game/loop/useGameLoop';
import { SpaceCanvas } from './renderers/SpaceCanvas';
import { SlingshotTelemetryBar } from './hud/SlingshotTelemetryBar';
import { SlingshotLaunchControls } from './hud/SlingshotLaunchControls';
import { SlingshotConfigDrawer } from './hud/SlingshotConfigDrawer';
import { EndSummaryModal } from './hud/EndSummaryModal';

export default function SpaceSlingshot({ soundEnabled = true, isFullscreen = false, onToggleFullscreen }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const svgRef = useRef(null);

  const {
    angle,
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
    showGravityGradients,
    showGravityVectors,
    showNetVector,
    shotOutcome,
  } = state;

  const isSimulating = gameStatus === 'flying' || gameStatus === 'enemy_flying';

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

  // Camera System
  const { viewBox, updateCameraTarget, updateCameraForSummary, resetCamera } = useCamera(boardScale);

  const { ship, target, planets = [] } = level;

  // Trigger camera zoom out to fit shot history on round completion
  useEffect(() => {
    if (roundCompleted) {
      updateCameraForSummary(pastTrails, level);
    }
  }, [roundCompleted, pastTrails, level, updateCameraForSummary]);

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
        ...customConfig,
      };

      const newLvl = generateRandomLevel(960, 600, cfg);
      dispatch({ type: 'RESET_LEVEL', newLevel: newLvl });

      resetCamera(bScale);
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
      resetCamera,
    ]
  );

  // Physics Loop System
  const { handleLaunch, handleStopFlight } = useGameLoop({
    gameStatus,
    turnOwner,
    roundCompleted,
    angle,
    power,
    level,
    gravityG,
    simSpeedScale,
    enableEnemyShip,
    dispatch,
    updateCameraTarget,
    handleNewLevel,
  });

  // Pointer & Keyboard Input System
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

  // Derived Live Telemetry Metrics
  const currentPos = projectilePos || ship;
  const targetDist = Math.round(Math.hypot(currentPos.x - target.x, currentPos.y - target.y));
  const currentSpeed = Math.round(Math.hypot(projectileVel?.x || 0, projectileVel?.y || 0) * 60);

  // Gravity Vector Calculations
  const individualVectors = calculateIndividualGravitationalAccels(currentPos.x, currentPos.y, level, gravityG);
  const netAccel = calculateGravitationalAccel(currentPos.x, currentPos.y, level, gravityG);

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
        onTogglePastTrails={() => dispatch({ type: 'TOGGLE_PAST_TRAILS' })}
        onNewLevel={() => handleNewLevel()}
        onToggleConfig={() => setIsConfigOpen((v) => !v)}
        isConfigOpen={isConfigOpen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* Main Game Stage Area */}
      <div className="space-stage-container">
        <SpaceCanvas
          svgRef={svgRef}
          viewBox={viewBox}
          level={level}
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

        {/* End of Round Summary Floating Glass Card */}
        <EndSummaryModal
          roundCompleted={roundCompleted}
          shotOutcome={shotOutcome}
          shotsTaken={pastTrails.length || shotsTaken || 1}
          currentScore={score || currentScore || 0}
          level={level}
          pastTrails={pastTrails}
          handleNewLevel={handleNewLevel}
        />

        {/* Floating Bottom Launch Bar */}
        <SlingshotLaunchControls
          angle={angle}
          power={power}
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

      {/* Sliding Universe Config Drawer */}
      <SlingshotConfigDrawer
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        level={level}
        planetCount={planetCount}
        gravityG={gravityG}
        simSpeedScale={simSpeedScale}
        boardScale={boardScale}
        enableBlackHoles={enableBlackHoles}
        enableAsteroids={enableAsteroids}
        enableWormholes={enableWormholes}
        enablePulsars={enablePulsars}
        enableBoosters={enableBoosters}
        enableShields={enableShields}
        enableEnemyShip={enableEnemyShip}
        showGravityGradients={showGravityGradients}
        showGravityVectors={showGravityVectors}
        showNetVector={showNetVector}
        dispatch={dispatch}
        handleNewLevel={handleNewLevel}
      />
    </div>
  );
}
