import { useEffect, useRef, useCallback } from 'react';
import { updateProjectilePhysics, checkCollisions, calculateEnemyAim } from '../../utils/physics';
import { gameEvents } from '../../utils/EventBus';

/**
 * Dedicated Game Loop & Animation Hook for Space Slingshot
 * Manages player flight loop, enemy AI targeting turn, and requestAnimationFrame handles.
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

  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const warpCooldownRef = useRef(0);

  const enemyPosRef = useRef({ x: 0, y: 0 });
  const enemyVelRef = useRef({ x: 0, y: 0 });
  const enemyWarpCooldownRef = useRef(0);

  const { ship, enemyShip } = level;

  // Trigger Enemy Counter-Attack Turn
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
  }, [enemyShip, ship, level, gravityG, simSpeedScale, updateCameraTarget, dispatch]);

  // Finalize player shot and trigger enemy turn if applicable
  const finalizeShot = useCallback(
    (status, finalTrail) => {
      updateCameraTarget(null);
      dispatch({ type: 'END_SHOT', status, finalTrail });

      if (
        status !== 'hit_target' &&
        status !== 'hit_enemy' &&
        enableEnemyShip &&
        level.enemyShip &&
        level.enemyShip.status === 'active'
      ) {
        triggerEnemyTurn();
      }
    },
    [enableEnemyShip, level, triggerEnemyTurn, updateCameraTarget, dispatch]
  );

  // Manually stop active flight
  const handleStopFlight = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (enemyAnimRef.current) cancelAnimationFrame(enemyAnimRef.current);

    updateCameraTarget(null);

    if (gameStatus === 'flying') {
      finalizeShot('stopped', []);
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
    const initialVel = {
      x: (power / 4.8) * Math.cos(rad),
      y: (power / 4.8) * Math.sin(rad),
    };

    posRef.current = { x: ship.x, y: ship.y };
    velRef.current = initialVel;
    warpCooldownRef.current = 0;

    dispatch({ type: 'LAUNCH_PLAYER', pos: { x: ship.x, y: ship.y }, vel: initialVel });
  }, [gameStatus, turnOwner, roundCompleted, angle, power, ship, handleNewLevel, dispatch]);

  // Player Physics Animation Loop
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
  }, [gameStatus, level, gravityG, simSpeedScale, finalizeShot, updateCameraTarget, dispatch]);

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
