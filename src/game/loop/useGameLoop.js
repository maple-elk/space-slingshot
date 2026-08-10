import { useEffect, useRef, useCallback } from 'react';
import { updateProjectilePhysics, checkCollisions } from '../../utils/physics';
import { calculateSmartEnemyAim } from '../ai/enemyAISolver';
import { gameEvents } from '../../utils/EventBus';

/**
 * Dedicated Game Loop & Animation Hook for Space Slingshot (2D)
 */
export function useGameLoop({
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
}) {
  const animRef = useRef(null);
  const enemyAnimRef = useRef(null);

  const levelRef = useRef(level);
  levelRef.current = level;

  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const localTrailRef = useRef([]);
  const warpCooldownRef = useRef(0);

  const enemyPosRef = useRef({ x: 0, y: 0 });
  const enemyVelRef = useRef({ x: 0, y: 0 });
  const enemyWarpCooldownRef = useRef(0);

  const { ship = { x: 0, y: 0 }, enemyShip } = level;

  // Trigger Enemy Counter-Attack Turn
  const triggerEnemyTurn = useCallback(() => {
    if (!enemyShip || enemyShip.status !== 'active') return;

    const currentLvl = levelRef.current;
    const aimResult = calculateSmartEnemyAim(enemyShip, ship, currentLvl, gravityG);

    if (!aimResult) return;

    dispatch({ type: 'START_ENEMY_TURN', aimInfo: aimResult });

    setTimeout(() => {
      gameEvents.emit('POP');
      dispatch({ type: 'START_ENEMY_FLIGHT' });

      enemyPosRef.current = { x: enemyShip.x, y: enemyShip.y };
      enemyVelRef.current = aimResult.initialVel;
      enemyWarpCooldownRef.current = 0;
      const enemyBoostedIds = new Set();
      let enemyFrameCount = 0;
      const MAX_ENEMY_FRAMES = 500; // Timeout after ~8.3 seconds of flight

      const enemyLoop = () => {
        enemyFrameCount++;
        if (enemyFrameCount > MAX_ENEMY_FRAMES) {
          dispatch({ type: 'END_ENEMY_SHOT', status: 'idle' });
          updateCameraTarget(null);
          return;
        }

        const activeLvl = levelRef.current;
        const result = updateProjectilePhysics(
          enemyPosRef.current,
          enemyVelRef.current,
          activeLvl,
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

        const collision = checkCollisions(result.pos, result.vel, activeLvl, 'enemy', 960, 600);

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
  }, [enemyShip, ship, gravityG, simSpeedScale, updateCameraTarget, dispatch]);

  // Finalize player shot and trigger enemy turn if applicable
  const finalizeShot = useCallback(
    (status, finalTrail) => {
      updateCameraTarget(null);
      dispatch({ type: 'END_SHOT', status, finalTrail });

      const currentLvl = levelRef.current;
      if (
        status !== 'hit_target' &&
        status !== 'hit_enemy' &&
        enableEnemyShip &&
        currentLvl.enemyShip &&
        currentLvl.enemyShip.status === 'active'
      ) {
        triggerEnemyTurn();
      }
    },
    [enableEnemyShip, triggerEnemyTurn, updateCameraTarget, dispatch]
  );

  // Manually stop active flight
  const handleStopFlight = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (enemyAnimRef.current) cancelAnimationFrame(enemyAnimRef.current);

    updateCameraTarget(null);

    if (gameStatus === 'flying') {
      finalizeShot('stopped', localTrailRef.current);
    } else if (gameStatus === 'enemy_flying') {
      dispatch({ type: 'END_ENEMY_SHOT', status: 'idle' });
    }
  }, [gameStatus, finalizeShot, updateCameraTarget, dispatch]);

  // Launch player projectile
  const handleLaunch = useCallback(() => {
    const isSimulating = gameStatus === 'flying' || gameStatus === 'enemy_flying';
    if (isSimulating || turnOwner !== 'player') return;

    if (roundCompleted) {
      handleNewLevel();
      return;
    }

    gameEvents.emit('POP');

    const rad = (angle * Math.PI) / 180;
    const vx = (power / 4.8) * Math.cos(rad);
    const vy = (power / 4.8) * Math.sin(rad);

    const initialVel = { x: vx, y: vy };
    const startPos = { x: ship.x, y: ship.y };

    posRef.current = startPos;
    velRef.current = initialVel;
    localTrailRef.current = [startPos];
    warpCooldownRef.current = 0;

    dispatch({ type: 'LAUNCH_PLAYER', pos: startPos, vel: initialVel });
  }, [gameStatus, turnOwner, roundCompleted, angle, power, ship, handleNewLevel, dispatch]);

  // Player Physics Animation Loop
  useEffect(() => {
    if (gameStatus !== 'flying') return;

    const boostedBoosterIds = new Set();

    const loop = () => {
      const activeLvl = levelRef.current;
      const result = updateProjectilePhysics(
        posRef.current,
        velRef.current,
        activeLvl,
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

      const pt = { x: result.pos.x, y: result.pos.y };
      localTrailRef.current.push(pt);
      updateCameraTarget(result.pos);

      const collision = checkCollisions(result.pos, result.vel, activeLvl, 'player', 960, 600);

      if (collision.type === 'target') {
        gameEvents.emit('VICTORY');
        finalizeShot('hit_target', localTrailRef.current);
        return;
      }

      if (collision.type === 'hit_enemy') {
        gameEvents.emit('VICTORY');
        finalizeShot('hit_enemy', localTrailRef.current);
        return;
      }

      if (collision.type === 'black_hole') {
        gameEvents.emit('SNAP');
        finalizeShot('black_hole', localTrailRef.current);
        return;
      }

      if (collision.type === 'shield_bounce') {
        velRef.current = collision.reflectedVel;
        gameEvents.emit('POP');
      }

      if (collision.type === 'planet') {
        gameEvents.emit('SNAP');
        finalizeShot('hit_planet', localTrailRef.current);
        return;
      }

      if (collision.type === 'out_of_bounds') {
        finalizeShot('out_of_bounds', localTrailRef.current);
        return;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameStatus, gravityG, simSpeedScale, finalizeShot, updateCameraTarget, dispatch]);

  return {
    handleLaunch,
    handleStopFlight,
    triggerEnemyTurn,
    posRef,
    velRef,
    animRef,
    enemyAnimRef,
  };
}
