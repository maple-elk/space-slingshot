import React from 'react';
import { Sliders } from 'lucide-react';

export function SpaceObjectsToggleCard({
  enableBlackHoles,
  enableAsteroids,
  enableWormholes,
  enablePulsars,
  enableBoosters,
  enableShields,
  enableEnemyShip,
  dispatch,
  handleNewLevel,
}) {
  return (
    <div className="side-card">
      <div className="card-title">
        <Sliders size={20} color="var(--color-corner-b)" />
        <span>Space Objects & Phenomena</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enableBlackHoles}
            onChange={(e) => {
              dispatch({ type: 'SET_SETTING', key: 'enableBlackHoles', value: e.target.checked });
              handleNewLevel({ enableBlackHoles: e.target.checked });
            }}
          />
          <span style={{ fontSize: '0.85rem' }}>🕳️ Black Holes (Gravity Traps)</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enableAsteroids}
            onChange={(e) => {
              dispatch({ type: 'SET_SETTING', key: 'enableAsteroids', value: e.target.checked });
              handleNewLevel({ enableAsteroids: e.target.checked });
            }}
          />
          <span style={{ fontSize: '0.85rem' }}>🪨 Asteroid Clouds (Atmospheric Drag)</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enableWormholes}
            onChange={(e) => {
              dispatch({ type: 'SET_SETTING', key: 'enableWormholes', value: e.target.checked });
              handleNewLevel({ enableWormholes: e.target.checked });
            }}
          />
          <span style={{ fontSize: '0.85rem' }}>🌀 Wormhole Teleport Portals</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enablePulsars}
            onChange={(e) => {
              dispatch({ type: 'SET_SETTING', key: 'enablePulsars', value: e.target.checked });
              handleNewLevel({ enablePulsars: e.target.checked });
            }}
          />
          <span style={{ fontSize: '0.85rem' }}>⚡ Pulsar Anti-Gravity Emitters</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enableBoosters}
            onChange={(e) => {
              dispatch({ type: 'SET_SETTING', key: 'enableBoosters', value: e.target.checked });
              handleNewLevel({ enableBoosters: e.target.checked });
            }}
          />
          <span style={{ fontSize: '0.85rem' }}>🚀 Speed Booster Gates</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enableShields}
            onChange={(e) => {
              dispatch({ type: 'SET_SETTING', key: 'enableShields', value: e.target.checked });
              handleNewLevel({ enableShields: e.target.checked });
            }}
          />
          <span style={{ fontSize: '0.85rem' }}>🛡️ Shield Deflector Moons</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
          <input
            type="checkbox"
            checked={enableEnemyShip}
            onChange={(e) => {
              dispatch({ type: 'SET_SETTING', key: 'enableEnemyShip', value: e.target.checked });
              handleNewLevel({ enableEnemyShip: e.target.checked });
            }}
          />
          <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '700' }}>👾 Hostile Enemy Interceptor</span>
        </label>
      </div>
    </div>
  );
}
