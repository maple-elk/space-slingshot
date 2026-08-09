import { describe, it, expect } from 'vitest';
import { getDefaultViewBox, calculateTargetViewBox, calculateSummaryViewBox } from '../game/camera/useCamera';

describe('Camera ViewBox Calculations', () => {
  it('getDefaultViewBox calculates standard bounds for scale = 1.0', () => {
    const vb = getDefaultViewBox(1.0);
    expect(vb).toEqual([-100, -60, 1160, 725]);
  });

  it('getDefaultViewBox scales bounds for scale = 1.5', () => {
    const vb = getDefaultViewBox(1.5);
    expect(vb).toEqual([-150, -90, 1740, 1087.5]);
  });

  it('calculateTargetViewBox returns default viewBox when activePos is null', () => {
    const vb = calculateTargetViewBox(null, 1.0);
    expect(vb).toEqual([-100, -60, 1160, 725]);
  });

  it('calculateTargetViewBox expands viewBox to enclose active projectile', () => {
    const vb = calculateTargetViewBox({ x: 2000, y: 1500 }, 1.0);

    expect(vb[0]).toBeLessThan(2000);
    expect(vb[1]).toBeLessThan(1500);
    expect(vb[0] + vb[2]).toBeGreaterThan(2000);
    expect(vb[1] + vb[3]).toBeGreaterThan(1500);
  });

  it('clamps viewBox dimensions to maximum arena limits (6800x4250)', () => {
    const vb = calculateTargetViewBox({ x: 10000, y: 10000 }, 1.0);

    expect(vb[2]).toBeLessThanOrEqual(6800);
    expect(vb[3]).toBeLessThanOrEqual(4250);
  });

  it('calculateSummaryViewBox encloses core level objects and past trail history', () => {
    const level = {
      ship: { x: 100, y: 300 },
      target: { x: 900, y: 300 },
      planets: [{ id: 1, x: 500, y: 300, radius: 40 }],
    };
    const pastTrails = [
      {
        id: 't1',
        points: [
          { x: 100, y: 300 },
          { x: 400, y: 150 },
          { x: 900, y: 300 },
        ],
      },
    ];

    const vb = calculateSummaryViewBox(pastTrails, level, 1.0);
    expect(vb[0]).toBeLessThan(100);
    expect(vb[0] + vb[2]).toBeGreaterThan(900);
    expect(vb[1]).toBeLessThan(150);
  });

  it('calculateSummaryViewBox trims extreme outlier points from shot history', () => {
    const level = {
      ship: { x: 100, y: 300 },
      target: { x: 900, y: 300 },
      planets: [],
    };

    // 20 normal points and 1 extreme outlier
    const normalPoints = Array.from({ length: 20 }, (_, i) => ({ x: 100 + i * 40, y: 300 + (i % 2) * 50 }));
    const extremePoints = [{ x: 99999, y: -99999 }];

    const pastTrails = [{ id: 't1', points: [...normalPoints, ...extremePoints] }];

    const vb = calculateSummaryViewBox(pastTrails, level, 1.0);

    // Bounding width should be clamped reasonably (< 2800) and NOT expand to 99999
    expect(vb[2]).toBeLessThanOrEqual(2800);
    expect(vb[0] + vb[2]).toBeLessThan(50000);
  });
});
