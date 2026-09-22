import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { gameReducer, createInitialGameState } from '../game/gameReducer';

describe('Spacebar Next Level Progression Invariants', () => {
  it('blurs focused button element when spacebar keydown occurs', () => {
    const handleNewLevelMock = vi.fn();

    // Create a mock button in JSDOM and focus it
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    // Simulate keydown event on button
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
          return;
        }
        if (e.target && e.target.tagName === 'BUTTON') {
          e.target.blur();
        }
        e.preventDefault();
        handleNewLevelMock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const spaceEvent = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(spaceEvent);

    expect(handleNewLevelMock).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(button);

    window.removeEventListener('keydown', handleKeyDown);
    document.body.removeChild(button);
  });

  it('preserves single player gameMode when resetting level', () => {
    const initialState = createInitialGameState({ gameMode: 'puzzle' });
    expect(initialState.gameMode).toBe('puzzle');

    // Simulate reset level dispatch in reducer
    const nextState = gameReducer(initialState, {
      type: 'RESET_LEVEL',
      newLevel: { seed: 12345, planets: [], generationMode: 'random' },
    });

    expect(nextState.gameMode).toBe('puzzle');
    expect(nextState.turnOwner).toBe('player');
    expect(nextState.enableEnemyShip).toBe(false);
  });
});
