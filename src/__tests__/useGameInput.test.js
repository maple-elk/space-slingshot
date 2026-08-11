import { describe, it, expect } from 'vitest';
import { calculateAimFromPointer, getSVGCoordinates } from '../game/input/useGameInput';

describe('Game Input Utilities', () => {
  it('calculateAimFromPointer computes angle 0 deg for straight right pointer', () => {
    const ship = { x: 100, y: 300 };
    const coords = { x: 270, y: 300 };
    const aim = calculateAimFromPointer(coords, ship);

    expect(aim.angle).toBe(0);
    expect(aim.power).toBe(60); // 170 / 1.7 = 100 capped to max 60
  });

  it('calculateAimFromPointer computes angle 90 deg for straight down pointer', () => {
    const ship = { x: 100, y: 300 };
    const coords = { x: 100, y: 385 };
    const aim = calculateAimFromPointer(coords, ship);

    expect(aim.angle).toBe(90);
    expect(aim.power).toBe(50); // 85 / 1.7 = 50
  });

  it('clamps power between 10 and 200', () => {
    const ship = { x: 100, y: 300 };

    const minAim = calculateAimFromPointer({ x: 101, y: 300 }, ship);
    expect(minAim.power).toBe(10);

    const maxAim = calculateAimFromPointer({ x: 1000, y: 300 }, ship);
    expect(maxAim.power).toBe(60);
  });

  it('getSVGCoordinates returns (0, 0) if svg element is null', () => {
    const coords = getSVGCoordinates(null, { clientX: 100, clientY: 200 });
    expect(coords).toEqual({ x: 0, y: 0 });
  });
});
