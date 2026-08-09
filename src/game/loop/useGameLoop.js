import { useEffect, useRef, useCallback } from 'react';
import { updateProjectilePhysics, checkCollisions, calculateEnemyAim } from '../../utils/physics';
import { updateProjectilePhysics as updateProjectilePhysics3D, checkCollisions as checkCollisions3D, calculateEnemyAim as calculateEnemyAim3D, calculateInitialVelocity } from '../../utils/physics3d';
import { gameEvents } from '../../utils/EventBus';

/**
 * Dedicated Game Loop & Animation Hook for Space Slingshot (2D, 3D, and Solar Orbit)
 */
export function useGameLoop({
  gameStatus,
  turnOwner,
  roundCompleted,
  angle,
  pitch = 12,
  yaw = 350,
  power,
  level,
  gravityG,
  simSpeedScale,
  enableEnemyShip,
  launcherVelocityMode = 'stationary',
  dispatch,
  updateCameraTarget,
  handleNewLevel,
}) {
  const animRef = useRef(null);
  const enemyAnimRef = useRef(null);

  const levelRef = useRef(level);
  levelRef.current = level;

  const posRef = useRef({ x: 0, y: 0, z: 0 });
  const velRef = useRef({ x: 0, y: 0, z: 0 });
  const localTrailRef = useRef([]);
  const warpCooldownRef = useRef(0);

  const enemyPosRef = useRef({ x: 0, y: 0, z: 0 });
  const enemyVelRef = useRef({ x: 0, y: 0, z: 0 });
  const enemyWarpCooldownRef = useRef(0);

  const { ship = { x: 0, y: 0 }, enemyShip } = level;
  const is3D = ship.z !== undefined;

  // Trigger Enemy Counter-Attack Turn
  const triggerEnemyTurn = useCallback(() => {
    if (!enemyShip || enemyShip.status !== 'active') return;

    const currentLvl = levelRef.current;
    const aimResult = is3D
      ? calculateEnemyAim3D(enemyShip, ship, currentLvl, gravityG)
      : calculateEnemyAim(enemyShip, ship, currentLvl, gravityG);

    if (!aimResult) return;

    dispatch({ type: 'START_ENEMY_TURN', aimInfo: aimResult });

    setTimeout(() => {
      gameEvents.emit('POP');
      dispatch({ type: 'START_ENEMY_FLIGHT' });

      enemyPosRef.current = { x: enemyShip.x, y: enemyShip.y, z: enemyShip.z || 0 };
      enemyVelRef.current = aimResult.initialVel;
      enemyWarpCooldownRef.current = 0;
      const enemyBoostedIds = new Set();

      const enemyLoop = () => {
        const activeLvl = levelRef.current;
        const result = is3D
          ? updateProjectilePhysics3D(
              enemyPosRef.current,
              enemyVelRef.current,
              activeLvl,
              0.016,
              gravityG,
              simSpeedScale,
              enemyWarpCooldownRef.current,
              enemyBoostedIds
            )
          : updateProjectilePhysics(
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

        const collision = is3D
          ? checkCollisions3D(result.pos, result.vel, activeLvl, 'enemy')
          : checkCollisions(result.pos, result.vel, activeLvl, 'enemy', 960, 600);

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
  }, [is3D, enemyShip, ship, gravityG, simSpeedScale, updateCameraTarget, dispatch]);

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

    let initialVel;
    if (is3D) {
      initialVel = calculateInitialVelocity(pitch, yaw, power);
    } else {
      const rad = (angle * Math.PI) / 180;
      let vx = (power / 4.8) * Math.cos(rad);
      let vy = (power / 4.8) * Math.sin(rad);

      if (launcherVelocityMode === 'orbital' && ship.vx !== undefined && ship.vy !== undefined) {
        vx += ship.vx;
        vy += ship.vy;
      }
      initialVel = { x: vx, y: vy };
    }

    const startPos = is3D ? { x: ship.x, y: ship.y, z: ship.z } : { x: ship.x, y: ship.y };

    posRef.current = startPos;
    velRef.current = initialVel;
    localTrailRef.current = [startPos];
    warpCooldownRef.current = 0;

    dispatch({ type: 'LAUNCH_PLAYER', pos: startPos, vel: initialVel });
  }, [is3D, pitch, yaw, gameStatus, turnOwner, roundCompleted, angle, power, ship, launcherVelocityMode, handleNewLevel, dispatch]);

  // Player Physics Animation Loop
  useEffect(() => {
    if (gameStatus !== 'flying') return;

    const boostedBoosterIds = new Set();

    const loop = () => {
      const activeLvl = levelRef.current;
      const result = is3D
        ? updateProjectilePhysics3D(
            posRef.current,
            velRef.current,
            activeLvl,
            0.016,
            gravityG,
            simSpeedScale,
            warpCooldownRef.current,
            boostedBoosterIds
          )
        : updateProjectilePhysics(
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

      const pt = is3D ? { x: result.pos.x, y: result.pos.y, z: result.pos.z } : { x: result.pos.x, y: result.pos.y };
      localTrailRef.current.push(pt);
      updateCameraTarget(result.pos);

      const collision = is3D
        ? checkCollisions3D(result.pos, result.vel, activeLvl, 'player')
        : checkCollisions(result.pos, result.vel, activeLvl, 'player', 960, 600);

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
  }, [is3D, gameStatus, gravityG, simSpeedScale, finalizeShot, updateCameraTarget, dispatch]);

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
