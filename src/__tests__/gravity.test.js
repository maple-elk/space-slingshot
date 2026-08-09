import { describe, it, expect } from 'vitest';
import {
  calculateGravitationalAccel,
  calculateIndividualGravitationalAccels,
  DEFAULT_G,
} from '../utils/physics';

describe('Gravity Calculations', () => {
  it('pulls toward a single planet', () => {
    const level = {
      planets: [{ id: 1, x: 500, y: 300, radius: 30, mass: 100 }],
      blackHoles: [],
      pulsars: [],
    };
    // Position to the left of the planet
    const pos = { x: 400, y: 300 };
    const { ax, ay } = calculateGravitationalAccel(pos.x, pos.y, level, DEFAULT_G);

    expect(ax).toBeGreaterThan(0); // Pulls right (+x)
    expect(ay).toBeCloseTo(0, 5); // No vertical force
  });

  it('handles negative mass pulsars as repulsive force', () => {
    const level = {
      planets: [],
      blackHoles: [],
      pulsars: [{ id: 'pul_1', x: 500, y: 300, radius: 24, mass: -100 }],
    };
    // Position to the left of the pulsar
    const pos = { x: 400, y: 300 };
    const { ax, ay } = calculateGravitationalAccel(pos.x, pos.y, level, DEFAULT_G);

    expect(ax).toBeLessThan(0); // Repels left (-x)
    expect(ay).toBeCloseTo(0, 5);
  });

  it('amplifies black hole gravity by 3.5x', () => {
    const planetLevel = {
      planets: [{ id: 1, x: 500, y: 300, radius: 20, mass: 100 }],
      blackHoles: [],
      pulsars: [],
    };
    const blackHoleLevel = {
      planets: [],
      blackHoles: [{ id: 'bh_1', x: 500, y: 300, radius: 20, mass: 100 }],
      pulsars: [],
    };
    const pos = { x: 400, y: 300 };
    const pAccel = calculateGravitationalAccel(pos.x, pos.y, planetLevel, DEFAULT_G);
    const bhAccel = calculateGravitationalAccel(pos.x, pos.y, blackHoleLevel, DEFAULT_G);

    expect(bhAccel.ax).toBeCloseTo(pAccel.ax * 3.5, 4);
  });

  it('returns individual acceleration vectors for all sources', () => {
    const level = {
      planets: [
        { id: 1, x: 200, y: 300, radius: 20, mass: 50, name: 'P1' },
        { id: 2, x: 800, y: 300, radius: 20, mass: 50, name: 'P2' },
      ],
      blackHoles: [],
      pulsars: [],
    };
    const pos = { x: 500, y: 300 };
    const vectors = calculateIndividualGravitationalAccels(pos.x, pos.y, level, DEFAULT_G);

    expect(vectors).toHaveLength(2);
    expect(vectors[0].ax).toBeLessThan(0); // Towards P1 (x=200)
    expect(vectors[1].ax).toBeGreaterThan(0); // Towards P2 (x=800)
  });
});
