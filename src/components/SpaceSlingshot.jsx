import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { generateRandomLevel, calculateIndividualGravitationalAccels, calculateGravitationalAccel } from '../utils/physics';
import { playPopSound, playSnapSound, playVictorySound } from '../utils/audio';
import { gameEvents } from '../utils/EventBus';
import { gameReducer, createInitialGameState } from '../game/gameReducer';
import { parseDeepLinkQuery, syncUrlWithState } from '../utils/deepLink';
import { useCamera } from '../game/camera/useCamera';
import { useGameInput } from '../game/input/useGameInput';
import { useGameLoop } from '../game/loop/useGameLoop';
import { SpaceCanvas } from './renderers/SpaceCanvas';
import { SlingshotTelemetryBar } from './hud/SlingshotTelemetryBar';
import { SlingshotConfigDrawer } from './hud/SlingshotConfigDrawer';
import { EndSummaryModal } from './hud/EndSummaryModal';
import { LevelGenerationModal } from './hud/LevelGenerationModal';

export default function SpaceSlingshot({
  soundEnabled = true,
  onToggleSound,
  isFullscreen = false,
  onToggleFullscreen,
}) {
  const [state, dispatch] = useReducer(gameReducer, null, () => createInitialGameState());
  const [isConfigOpen, setIsConfigOpen] = useState(() => parseDeepLinkQuery().isConfigOpen);
  const [isGeneratingLevel, setIsGeneratingLevel] = useState(false);
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
    score,
    enemyAimInfo,
    enemyProjectilePos,
    enemyTrail,
    simSpeedScale,
    boardScale,
    gravityG,
    difficultyTier,
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
  } = state;

  const isSimulating = gameStatus === 'flying' || gameStatus === 'enemy_flying';

  // Synchronize state and deep link parameters with URL history
  useEffect(() => {
    syncUrlWithState(state, level?.seed, isConfigOpen);
  }, [state, level?.seed, isConfigOpen]);

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
  const { viewBox, updateCameraTarget, resetCamera } = useCamera(boardScale);

  const { ship = { x: 0, y: 0 }, target = { x: 500, y: 0, radius: 24 } } = level;

  // Level Generator Trigger
  const handleNewLevel = useCallback(
    (customConfig) => {
      setIsGeneratingLevel(true);
      setTimeout(() => {
        const bScale = customConfig?.boardScale !== undefined ? customConfig.boardScale : boardScale;
        const cfg = {
          planetCount,
          massMult,
          boardScale: bScale,
          difficultyTier,
          enableBlackHoles: enableBlackHoles || undefined,
          enableAsteroids: enableAsteroids || undefined,
          enableWormholes: enableWormholes || undefined,
          enablePulsars: enablePulsars || undefined,
          enableBoosters: enableBoosters || undefined,
          enableShields: enableShields || undefined,
          enableEnemyShip: enableEnemyShip || undefined,
          ...customConfig,
        };

        const newLvl = generateRandomLevel(960, 600, cfg);

        dispatch({ type: 'RESET_LEVEL', newLevel: newLvl });
        resetCamera(bScale);
        gameEvents.emit('SNAP');
        setIsGeneratingLevel(false);
      }, 50);
    },
    [
      boardScale,
      planetCount,
      massMult,
      difficultyTier,
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

  // Global Spacebar Key Listener to continue to next level when round is completed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && roundCompleted) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleNewLevel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roundCompleted, handleNewLevel]);

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

  // Derived Live Telemetry Metrics
  const currentPos = projectilePos || ship;
  const targetDist = Math.round(
    Math.hypot(
      currentPos.x - target.x,
      currentPos.y - target.y
    )
  );
  const currentSpeed = Math.round(
    Math.hypot(
      projectileVel?.x || 0,
      projectileVel?.y || 0
    ) * 60
  );

  // 2D Gravity Vector Calculations
  const individualVectors = calculateIndividualGravitationalAccels(currentPos.x, currentPos.y, level, gravityG);
  const netAccel = calculateGravitationalAccel(currentPos.x, currentPos.y, level, gravityG);

  const netMag = Math.hypot(netAccel.ax || 0, netAccel.ay || 0);
  const netAngle = Math.atan2(netAccel.ay || 0, netAccel.ax || 0);
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
      {/* Top Combined Telemetry, Launch & Header HUD Bar */}
      <SlingshotTelemetryBar
        targetDist={targetDist}
        currentSpeed={currentSpeed}
        netAccelMag={netMag}
        score={score}
        gameStatus={gameStatus}
        enemyAimInfo={enemyAimInfo}
        pastTrails={pastTrails}
        showAllPastTrails={showAllPastTrails}
        onTogglePastTrails={() => dispatch({ type: 'TOGGLE_PAST_TRAILS' })}
        onNewLevel={() => handleNewLevel()}
        onToggleConfig={() => setIsConfigOpen((v) => !v)}
        isConfigOpen={isConfigOpen}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        angle={angle}
        power={power}
        isSimulating={isSimulating}
        turnOwner={turnOwner}
        roundCompleted={roundCompleted}
        dispatch={dispatch}
        handleLaunch={handleLaunch}
        handleStopFlight={handleStopFlight}
      />

      {/* Main Game Stage Area */}
      <div className="space-stage-container" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
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
      </div>

      {/* Slingshot Configuration & Game Menu Drawer Modal */}
      <SlingshotConfigDrawer
        isOpen={isConfigOpen}
        state={state}
        dispatch={dispatch}
        onClose={() => setIsConfigOpen(false)}
        handleNewLevel={(cfg) => handleNewLevel(cfg)}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        pastTrails={pastTrails}
        showAllPastTrails={showAllPastTrails}
        onTogglePastTrails={() => dispatch({ type: 'TOGGLE_PAST_TRAILS' })}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* End of Round Summary Banner */}
      {state.showEndSummary && (
        <EndSummaryModal
          roundCompleted={roundCompleted}
          shotOutcome={gameStatus}
          shotsTaken={pastTrails.length}
          currentScore={score}
          level={level}
          pastTrails={pastTrails}
          handleNewLevel={() => handleNewLevel()}
          onDismiss={() => dispatch({ type: 'DISMISS_SUMMARY' })}
        />
      )}

      {/* Async Level Generation Spinner Modal */}
      <LevelGenerationModal isOpen={state.isGeneratingLevel || false} difficultyTier={difficultyTier} />
    </div>
  );
}
