import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SpaceObjectsToggleCard } from '../components/hud/SpaceObjectsToggleCard';
import { SlingshotConfigDrawer } from '../components/hud/SlingshotConfigDrawer';
import { generateRandomLevel } from '../utils/physics';

describe('Space Objects Toggle Checkboxes & Config Drawer Integration', () => {
  it('SpaceObjectsToggleCard renders active checkbox state correctly', () => {
    const html = renderToString(
      <SpaceObjectsToggleCard
        enableBlackHoles={true}
        enableAsteroids={true}
        enableWormholes={false}
        enablePulsars={false}
        enableBoosters={false}
        enableShields={false}
        enableEnemyShip={false}
        dispatch={() => {}}
        handleNewLevel={() => {}}
      />
    );

    expect(html).toContain('Black Holes');
    expect(html).toContain('Asteroid Clouds');
  });

  it('level generation with multiple enable flags preserves all enabled objects', () => {
    const config = {
      enableBlackHoles: true,
      enableAsteroids: true,
      enableWormholes: true,
      enablePulsars: true,
      enableBoosters: true,
      enableShields: true,
      enableEnemyShip: true,
    };

    const level = generateRandomLevel(960, 600, config);

    expect(level.blackHoles.length).toBeGreaterThan(0);
    expect(level.asteroids.length).toBeGreaterThan(0);
    expect(level.wormholes.length).toBeGreaterThan(0);
    expect(level.pulsars.length).toBeGreaterThan(0);
    expect(level.boosters.length).toBeGreaterThan(0);
    expect(level.shields.length).toBeGreaterThan(0);
    expect(level.enemyShip).not.toBeNull();
  });

  it('merging new setting with existing state preserves other enabled objects', () => {
    const state = {
      planetCount: 'auto',
      massMult: 1.0,
      boardScale: 1.0,
      enableBlackHoles: true,
      enableAsteroids: true,
      enableWormholes: false,
      enablePulsars: false,
      enableBoosters: false,
      enableShields: false,
      enableEnemyShip: false,
    };

    // User checks wormholes
    const customConfig = { enableWormholes: true };

    const cfg = {
      planetCount: state.planetCount,
      massMult: state.massMult,
      boardScale: state.boardScale,
      enableBlackHoles: state.enableBlackHoles,
      enableAsteroids: state.enableAsteroids,
      enableWormholes: state.enableWormholes,
      enablePulsars: state.enablePulsars,
      enableBoosters: state.enableBoosters,
      enableShields: state.enableShields,
      enableEnemyShip: state.enableEnemyShip,
      ...customConfig,
    };

    const newLevel = generateRandomLevel(960, 600, cfg);

    expect(newLevel.blackHoles.length).toBeGreaterThan(0);
    expect(newLevel.asteroids.length).toBeGreaterThan(0);
    expect(newLevel.wormholes.length).toBeGreaterThan(0);
  });

  it('SlingshotConfigDrawer renders drawer overlay when isOpen is true', () => {
    const state = {
      enableSolarOrbit: true,
      enableBlackHoles: true,
      gravityG: 300,
      boardScale: 1.0,
      simSpeedScale: 1.0,
    };

    const openHtml = renderToString(
      <SlingshotConfigDrawer
        isOpen={true}
        state={state}
        dispatch={() => {}}
        onClose={() => {}}
      />
    );

    expect(openHtml).toContain('slingshot-config-drawer');
    expect(openHtml).toContain('Universe Config &amp; Settings');
    expect(openHtml).toContain('Enable Solar Orbit Mode');

    const closedHtml = renderToString(
      <SlingshotConfigDrawer
        isOpen={false}
        state={state}
        dispatch={() => {}}
        onClose={() => {}}
      />
    );

    expect(closedHtml).toBe('');
  });
});
