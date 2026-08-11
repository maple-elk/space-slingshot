import { useEffect, useCallback } from 'react';

/**
 * Converts screen pointer event to SVG viewBox coordinates
 * @param {SVGSVGElement|null} svg 
 * @param {PointerEvent|MouseEvent} e 
 * @returns {{x: number, y: number}}
 */
export function getSVGCoordinates(svg, e) {
  if (!svg) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

/**
 * Calculates launch angle (degrees) and power (10 to 100) from pointer position relative to ship
 * @param {{x: number, y: number}} coords 
 * @param {{x: number, y: number}} ship 
 * @returns {{angle: number, power: number}}
 */
export function calculateAimFromPointer(coords, ship) {
  const dx = coords.x - ship.x;
  const dy = coords.y - ship.y;

  const rad = Math.atan2(dy, dx);
  const angle = Math.round(((rad * 180) / Math.PI + 360) % 360);

  const dist = Math.hypot(dx, dy);
  const power = Math.max(10, Math.min(60, Math.round(dist / 1.7)));

  return { angle, power };
}

/**
 * Input handling hook for Space Slingshot (Pointer dragging & Keyboard hotkeys)
 */
export function useGameInput({
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
}) {
  const updateAimFromPointer = useCallback(
    (e) => {
      if (isSimulating || turnOwner !== 'player' || roundCompleted) return;
      const coords = getSVGCoordinates(svgRef.current, e);
      const aim = calculateAimFromPointer(coords, ship);
      dispatch({ type: 'SET_AIM', angle: aim.angle, power: aim.power });
    },
    [svgRef, ship, isSimulating, turnOwner, roundCompleted, dispatch]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (isSimulating || turnOwner !== 'player' || roundCompleted) return;
      dispatch({ type: 'SET_IS_DRAGGING_AIM', value: true });
      if (e.target && typeof e.target.setPointerCapture === 'function') {
        e.target.setPointerCapture(e.pointerId);
      }
      updateAimFromPointer(e);
    },
    [isSimulating, turnOwner, roundCompleted, dispatch, updateAimFromPointer]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (isDraggingAim && !isSimulating) {
        updateAimFromPointer(e);
      }
    },
    [isDraggingAim, isSimulating, updateAimFromPointer]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (isDraggingAim) {
        if (e.target && typeof e.target.releasePointerCapture === 'function') {
          try {
            e.target.releasePointerCapture(e.pointerId);
          } catch (err) {}
        }
        dispatch({ type: 'SET_IS_DRAGGING_AIM', value: false });
      }
    },
    [isDraggingAim, dispatch]
  );

  // Keyboard Navigation & Hotkeys
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
        dispatch({ type: 'SET_AIM', power: Math.min(60, power + step) });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        dispatch({ type: 'SET_AIM', power: Math.max(10, power - step) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleLaunch,
    isSimulating,
    gameStatus,
    turnOwner,
    roundCompleted,
    handleNewLevel,
    handleStopFlight,
    angle,
    power,
    dispatch,
  ]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
