import React, { useState } from 'react';
import { X, Sliders, Eye, Sparkles, Globe } from 'lucide-react';

export function SlingshotConfigDrawer({
  isOpen,
  onClose,
  level,
  planetCount,
  gravityG,
  simSpeedScale,
  boardScale,
  enableBlackHoles,
  enableAsteroids,
  enableWormholes,
  enablePulsars,
  enableBoosters,
  enableShields,
  enableEnemyShip,
  showGravityGradients,
  showGravityVectors,
  showNetVector,
  dispatch,
  handleNewLevel,
}) {
  const [activeTab, setActiveTab] = useState('objects');

  if (!isOpen) return null;

  const handleToggleObject = (key, value) => {
    dispatch({ type: 'SET_SETTING', key, value });
    handleNewLevel({ ...level, [key]: value });
  };

  return (
    <div className="slingshot-config-overlay" onClick={onClose}>
      <div className="slingshot-config-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <Sliders size={20} color="var(--color-accent-purple)" />
            <span>Universe Config & Settings</span>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close Config Menu" style={{ padding: '4px 8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="drawer-tabs">
          <button
            className={`tab-btn ${activeTab === 'objects' ? 'active' : ''}`}
            onClick={() => setActiveTab('objects')}
          >
            <Sparkles size={14} />
            <span>Objects</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'physics' ? 'active' : ''}`}
            onClick={() => setActiveTab('physics')}
          >
            <Globe size={14} />
            <span>Physics</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'overlays' ? 'active' : ''}`}
            onClick={() => setActiveTab('overlays')}
          >
            <Eye size={14} />
            <span>Overlays</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-content">
          {/* TAB 1: Optional Space Objects */}
          {activeTab === 'objects' && (
            <div className="config-section">
              <div className="section-header">
                <span>🌌 Optional Celestial Objects (Defaults: OFF)</span>
              </div>
              <div className="toggle-grid">
                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={enableEnemyShip}
                    onChange={(e) => handleToggleObject('enableEnemyShip', e.target.checked)}
                    style={{ accentColor: '#ef4444' }}
                  />
                  <div>
                    <div className="toggle-title">👾 Enemy Interceptor Duel</div>
                    <div className="toggle-sub">AI ship counters with orbital fire</div>
                  </div>
                </label>

                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={enableBlackHoles}
                    onChange={(e) => handleToggleObject('enableBlackHoles', e.target.checked)}
                    style={{ accentColor: '#f97316' }}
                  />
                  <div>
                    <div className="toggle-title">🕳️ Black Hole</div>
                    <div className="toggle-sub">Massive singularity with event horizon</div>
                  </div>
                </label>

                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={enableAsteroids}
                    onChange={(e) => handleToggleObject('enableAsteroids', e.target.checked)}
                    style={{ accentColor: '#f59e0b' }}
                  />
                  <div>
                    <div className="toggle-title">🪨 Asteroid Drag Cloud</div>
                    <div className="toggle-sub">Dense space dust slowing trajectory</div>
                  </div>
                </label>

                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={enableWormholes}
                    onChange={(e) => handleToggleObject('enableWormholes', e.target.checked)}
                    style={{ accentColor: '#a855f7' }}
                  />
                  <div>
                    <div className="toggle-title">🌀 Wormhole Portals</div>
                    <div className="toggle-sub">Instant space teleportation gate</div>
                  </div>
                </label>

                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={enablePulsars}
                    onChange={(e) => handleToggleObject('enablePulsars', e.target.checked)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  <div>
                    <div className="toggle-title">⚡ Repulsive Pulsar</div>
                    <div className="toggle-sub">Anti-gravity repulsive star</div>
                  </div>
                </label>

                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={enableBoosters}
                    onChange={(e) => handleToggleObject('enableBoosters', e.target.checked)}
                    style={{ accentColor: '#10b981' }}
                  />
                  <div>
                    <div className="toggle-title">🚀 Speed Booster Gate</div>
                    <div className="toggle-sub">Directional velocity multiplier</div>
                  </div>
                </label>

                <label className="toggle-card">
                  <input
                    type="checkbox"
                    checked={enableShields}
                    onChange={(e) => handleToggleObject('enableShields', e.target.checked)}
                    style={{ accentColor: '#64748b' }}
                  />
                  <div>
                    <div className="toggle-title">🛡️ Shield Deflector Moon</div>
                    <div className="toggle-sub">Elastic reflective collision surface</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: Physics & Universe Controls */}
          {activeTab === 'physics' && (
            <div className="config-section">
              {/* Simulation Speed */}
              <div className="slider-group">
                <div className="slider-header">
                  <span>Simulation Flight Speed</span>
                  <span style={{ color: '#4ade80', fontWeight: '700' }}>{simSpeedScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={simSpeedScale}
                  onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'simSpeedScale', value: Number(e.target.value) })}
                  style={{ accentColor: '#4ade80' }}
                />
              </div>

              {/* Solar System Board Scale */}
              <div className="slider-group">
                <div className="slider-header">
                  <span>Solar System Board Scale</span>
                  <span style={{ color: '#38bdf8', fontWeight: '700' }}>
                    {boardScale.toFixed(1)}x {boardScale < 0.9 ? '(Compact)' : boardScale > 1.2 ? '(Expansive)' : '(Standard)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={boardScale}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    dispatch({ type: 'SET_SETTING', key: 'boardScale', value: val });
                    handleNewLevel({ boardScale: val });
                  }}
                  style={{ accentColor: '#38bdf8' }}
                />
              </div>

              {/* Planet Count */}
              <div className="slider-group">
                <div className="slider-header">
                  <span>Planet Count</span>
                  <span style={{ color: '#c7d2fe', fontWeight: '700' }}>
                    {planetCount === 'auto' ? 'Random (2-3)' : `${planetCount} Planets`}
                  </span>
                </div>
                <div className="planet-cnt-buttons">
                  {['auto', 1, 2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      className={`preset-btn ${planetCount === cnt ? 'active' : ''}`}
                      onClick={() => {
                        dispatch({ type: 'SET_SETTING', key: 'planetCount', value: cnt });
                        handleNewLevel({ planetCount: cnt });
                      }}
                    >
                      {cnt === 'auto' ? 'Auto' : `${cnt}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gravity Constant G */}
              <div className="slider-group">
                <div className="slider-header">
                  <span>Gravity Constant (G)</span>
                  <span style={{ color: '#38bdf8', fontWeight: '700' }}>{gravityG}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={gravityG}
                  onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'gravityG', value: Number(e.target.value) })}
                  style={{ accentColor: '#38bdf8' }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Visual Overlays */}
          {activeTab === 'overlays' && (
            <div className="config-section">
              <div className="section-header">
                <span>👁️ Physics Vector Overlays</span>
              </div>
              <div className="toggle-list">
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={showGravityVectors}
                    onChange={(e) => dispatch({ type: 'TOGGLE_OVERLAY', key: 'showGravityVectors' })}
                    style={{ accentColor: '#ec4899' }}
                  />
                  <span>🪐 Planet Gravity Pull Vectors (F₁, F₂, ...)</span>
                </label>

                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={showNetVector}
                    onChange={(e) => dispatch({ type: 'TOGGLE_OVERLAY', key: 'showNetVector' })}
                    style={{ accentColor: '#ffffff' }}
                  />
                  <span>⚡ Combined Net Gravity Vector (F_net)</span>
                </label>

                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={showGravityGradients}
                    onChange={(e) => dispatch({ type: 'TOGGLE_OVERLAY', key: 'showGravityGradients' })}
                    style={{ accentColor: '#8b5cf6' }}
                  />
                  <span>🌈 Planet Gravity Field Gradients</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
