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
 * Calculates a reasonable viewBox to include core level objects and the majority of shot history paths,
 * filtering out extreme outliers.
 * @param {Array} pastTrails - List of past shot trail objects
 * @param {Object} level - Level object containing ship, target, planets, enemyShip
 * @param {number} boardScale - Solar system board scale
 * @returns {[number, number, number, number]} [minX, minY, width, height]
 */
export function calculateSummaryViewBox(pastTrails = [], level = {}, boardScale = 1.0) {
  const { ship, target, planets = [], enemyShip } = level;

  // Baseline core points (ship, target, planets, enemyShip)
  const corePoints = [];
  if (ship) corePoints.push({ x: ship.x, y: ship.y });
  if (target) corePoints.push({ x: target.x, y: target.y });
  if (enemyShip) corePoints.push({ x: enemyShip.x, y: enemyShip.y });
  planets.forEach((p) => {
    corePoints.push({ x: p.x - p.radius, y: p.y - p.radius });
    corePoints.push({ x: p.x + p.radius, y: p.y + p.radius });
  });

  if (corePoints.length === 0) {
    return getDefaultViewBox(boardScale);
  }

  let minX = Math.min(...corePoints.map((p) => p.x));
  let maxX = Math.max(...corePoints.map((p) => p.x));
  let minY = Math.min(...corePoints.map((p) => p.y));
  let maxY = Math.max(...corePoints.map((p) => p.y));

  // Collect trail points across all past trails
  const allTrailXs = [];
  const allTrailYs = [];

  pastTrails.forEach((trailObj) => {
    if (trailObj?.points && Array.isArray(trailObj.points)) {
      trailObj.points.forEach((pt) => {
        if (typeof pt.x === 'number' && typeof pt.y === 'number') {
          allTrailXs.push(pt.x);
          allTrailYs.push(pt.y);
        }
      });
    }
  });

  if (allTrailXs.length > 0 && allTrailYs.length > 0) {
    allTrailXs.sort((a, b) => a - b);
    allTrailYs.sort((a, b) => a - b);

    // IQR (Interquartile Range) outlier filtering
    const getQuartiles = (arr) => {
      const q1 = arr[Math.floor(arr.length * 0.25)];
      const q3 = arr[Math.floor(arr.length * 0.75)];
      return { q1, q3, iqr: q3 - q1 };
    };

    const xStats = getQuartiles(allTrailXs);
    const yStats = getQuartiles(allTrailYs);

    const xLowCut = xStats.q1 - 1.5 * Math.max(xStats.iqr, 150);
    const xHighCut = xStats.q3 + 1.5 * Math.max(xStats.iqr, 150);

    const yLowCut = yStats.q1 - 1.5 * Math.max(yStats.iqr, 150);
    const yHighCut = yStats.q3 + 1.5 * Math.max(yStats.iqr, 150);

    const filteredXs = allTrailXs.filter((x) => x >= xLowCut && x <= xHighCut);
    const filteredYs = allTrailYs.filter((y) => y >= yLowCut && y <= yHighCut);

    if (filteredXs.length > 0) {
      minX = Math.min(minX, filteredXs[0]);
      maxX = Math.max(maxX, filteredXs[filteredXs.length - 1]);
    }
    if (filteredYs.length > 0) {
      minY = Math.min(minY, filteredYs[0]);
      maxY = Math.max(maxY, filteredYs[filteredYs.length - 1]);
    }
  }

  const margin = 140 * boardScale;
  minX -= margin;
  maxX += margin;
  minY -= margin;
  maxY += margin;

  let w = maxX - minX;
  let h = maxY - minY;

  // Enforce 1.6 aspect ratio
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

  // Reasonably clamp camera bounds so extreme outliers don't shrink the scene endlessly
  const MAX_W = 2800 * boardScale;
  const MAX_H = 1750 * boardScale;
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

  const updateCameraForSummary = useCallback(
    (pastTrails, level) => {
      targetViewBoxRef.current = calculateSummaryViewBox(pastTrails, level, boardScale);
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
    updateCameraForSummary,
    resetCamera,
    currentViewBoxRef,
    targetViewBoxRef,
    getDefaultViewBox: getDefVB,
  };
}
