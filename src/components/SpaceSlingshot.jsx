import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { generateRandomLevel, calculateIndividualGravitationalAccels, calculateGravitationalAccel, DEFAULT_G } from '../utils/physics';
import { playPopSound, playSnapSound, playVictorySound } from '../utils/audio';
import { gameEvents } from '../utils/EventBus';
import { gameReducer, initialGameState } from '../game/gameReducer';
import { useCamera } from '../game/camera/useCamera';
import { useGameInput } from '../game/input/useGameInput';
import { useGameLoop } from '../game/loop/useGameLoop';
import { SpaceCanvas } from './renderers/SpaceCanvas';
import { TelemetryHUD } from './hud/TelemetryHUD';
import { LaunchControlsCard } from './hud/LaunchControlsCard';
import { SpaceObjectsToggleCard } from './hud/SpaceObjectsToggleCard';
import { UniverseControlsCard } from './hud/UniverseControlsCard';
import { EndSummaryModal } from './hud/EndSummaryModal';
import styles from './SpaceSlingshot.module.css';

export default function SpaceSlingshot({ soundEnabled = true }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
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
    shotsTaken,
    currentScore,
    enemyAimInfo,
    enemyProjectilePos,
    enemyTrail,
    enemyShotStatus,
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
  const { viewBox, updateCameraTarget, resetCamera } = useCamera(boardScale);

  const { ship, target, planets = [] } = level;

  // Level Generator Trigger
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
  const currentSpeed = Math.round(Math.hypot(projectileVel.x, projectileVel.y) * 60);

  // Gravity Vector Calculations
  const individualVectors = calculateIndividualGravitationalAccels(currentPos.x, currentPos.y, level, gravityG);
  const netAccel = calculateGravitationalAccel(currentPos.x, currentPos.y, level, gravityG);

  const netMag = Math.hypot(netAccel.x, netAccel.y);
  const netAngle = Math.atan2(netAccel.y, netAccel.x);
  const netVectorLength = Math.max(16, Math.min(80, netMag * 45));
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

  const maxPastTrails = 3;
  const displayedPastTrails = pastTrails.slice(-maxPastTrails).map((trailObj, idx) => ({
    ...trailObj,
    opacity: 0.25 + (idx / maxPastTrails) * 0.45,
  }));

  return (
    <div className="game-container space-theme">
      {/* Telemetry HUD Badge */}
      <TelemetryHUD targetDist={targetDist} currentSpeed={currentSpeed} />

      {/* Main SVG Viewport */}
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
        netVectorEnd={netVectorEnd}
        netP1={netP1}
        netP2={netP2}
        handlePointerMove={handlePointerMove}
        handlePointerUp={handlePointerUp}
        handlePointerDown={handlePointerDown}
      />

      {/* Sidebar Controls Layout */}
      <div className="controls-layout">

        {/* Turn & Status Header Badges */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className={styles.statusBadge}>
            <div
              className={`${styles.statusDot} ${
                gameStatus === 'flying'
                  ? styles.statusDotFlying
                  : gameStatus === 'enemy_flying'
                  ? styles.statusDotEnemy
                  : styles.statusDotReady
              }`}
            />
            <span>
              {turnOwner === 'player' && !isSimulating
                ? 'Your Turn: Aim & Slingshot'
                : gameStatus === 'flying'
                ? 'Probe In Flight...'
                : gameStatus === 'enemy_aiming'
                ? '👾 Enemy Calculating Trajectory...'
                : gameStatus === 'enemy_flying'
                ? '⚠️ Hostile Missile In Flight!'
                : 'Round Finished'}
            </span>
          </div>

          {enemyShip && (
            <div className={`${styles.statusBadge} ${enemyShip.status === 'active' ? styles.enemyActive : styles.enemyDisabled}`}>
              <span>{enemyShip.status === 'active' ? '👾 Enemy Interceptor: ACTIVE' : '💥 Enemy Interceptor: DISABLED'}</span>
            </div>
          )}
        </div>

        <LaunchControlsCard
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

        <SpaceObjectsToggleCard
          enableBlackHoles={enableBlackHoles}
          enableAsteroids={enableAsteroids}
          enableWormholes={enableWormholes}
          enablePulsars={enablePulsars}
          enableBoosters={enableBoosters}
          enableShields={enableShields}
          enableEnemyShip={enableEnemyShip}
          dispatch={dispatch}
          handleNewLevel={handleNewLevel}
        />

        <UniverseControlsCard
          simSpeedScale={simSpeedScale}
          boardScale={boardScale}
          gravityG={gravityG}
          planetCount={planetCount}
          massMult={massMult}
          showGravityGradients={showGravityGradients}
          showGravityVectors={showGravityVectors}
          showNetVector={showNetVector}
          dispatch={dispatch}
          handleNewLevel={handleNewLevel}
        />
      </div>

      {/* End of Round Victory/Defeat Summary Modal */}
      <EndSummaryModal
        roundCompleted={roundCompleted}
        shotOutcome={shotOutcome}
        shotsTaken={shotsTaken}
        currentScore={currentScore}
        level={level}
        handleNewLevel={handleNewLevel}
      />
    </div>
  );
}
