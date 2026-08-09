import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Calculates default viewBox bounds for a given boardScale
 * @param {number} scale 
 * @returns {[number, number, number, number]} [minX, minY, width, height]
 */
export function getDefaultViewBox(scale = 1.0) {
  return [-100 * scale, -60 * scale, 1160 * scale, 725 * scale];
}

/**
 * Calculates target viewBox bounds to enclose active projectile position
 * @param {Object|null} activePos 
 * @param {number} boardScale 
 * @returns {[number, number, number, number]} [minX, minY, width, height]
 */
export function calculateTargetViewBox(activePos, boardScale = 1.0) {
  if (!activePos) {
    return getDefaultViewBox(boardScale);
  }

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

  return [minX, minY, w, h];
}

/**
 * Dedicated Camera LERP & Dynamic Zoom Hook for Space Slingshot
 * @param {number} boardScale - Solar system board scale (0.6x to 1.8x)
 * @returns {Object} Camera control state and methods
 */
export function useCamera(boardScale = 1.0) {
  const getDefVB = useCallback(() => getDefaultViewBox(boardScale), [boardScale]);

  const [viewBox, setViewBox] = useState(getDefVB);
  const currentViewBoxRef = useRef(getDefVB());
  const targetViewBoxRef = useRef(getDefVB());

  const updateCameraTarget = useCallback(
    (activePos) => {
      targetViewBoxRef.current = calculateTargetViewBox(activePos, boardScale);
    },
    [boardScale]
  );

  const resetCamera = useCallback(
    (scale = boardScale) => {
      const defVB = getDefaultViewBox(scale);
      targetViewBoxRef.current = defVB;
      currentViewBoxRef.current = defVB;
      setViewBox(defVB);
    },
    [boardScale]
  );

  // Continuous Camera LERP Engine
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

  return {
    viewBox,
    updateCameraTarget,
    resetCamera,
    currentViewBoxRef,
    targetViewBoxRef,
    getDefaultViewBox: getDefVB,
  };
}
