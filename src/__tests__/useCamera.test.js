import { describe, it, expect } from 'vitest';
import { getDefaultViewBox, calculateTargetViewBox } from '../game/camera/useCamera';

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
});
