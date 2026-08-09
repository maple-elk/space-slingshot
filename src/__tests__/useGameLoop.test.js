import { describe, it, expect } from 'vitest';
import { useGameLoop } from '../game/loop/useGameLoop';

describe('useGameLoop Hook Module', () => {
  it('exports useGameLoop function', () => {
    expect(typeof useGameLoop).toBe('function');
  });
});
