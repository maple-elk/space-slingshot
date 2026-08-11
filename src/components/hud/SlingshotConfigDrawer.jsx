import React, { useState } from 'react';
import { X, Sliders, Sparkles, Globe, Eye, EyeOff, Volume2, VolumeX, RotateCcw, Maximize2, Minimize2, Settings, Link, Check, Compass } from 'lucide-react';
import { copyDeepLinkToClipboard } from '../../utils/deepLink';
import { getAllGoldenPresets } from '../../game/data/presetRegistry.js';

export function SlingshotConfigDrawer(props) {
  const [copied, setCopied] = useState(false);
  const [selectedPresetTier, setSelectedPresetTier] = useState('level5');
  const {
    isOpen,
    onClose,
    dispatch,
    handleNewLevel,
    onApplyNewConfig,
    soundEnabled,
    onToggleSound,
    pastTrails = [],
    showAllPastTrails = false,
    onTogglePastTrails,
    isFullscreen = false,
    onToggleFullscreen,
  } = props;

  const s = props.state || props;

  const {
    difficultyTier = 'auto',
    planetCount,
    gravityG = 300,
    simSpeedScale = 1.0,
    boardScale = 1.0,
    enableBlackHoles = false,
    enableAsteroids = false,
    enableWormholes = false,
    enablePulsars = false,
    enableBoosters = false,
    enableShields = false,
    enableEnemyShip = false,
    showGravityGradients = false,
    showGravityVectors = false,
    showNetVector = false,
    level,
  } = s;

  if (!isOpen) return null;

  const applyNewConfig = handleNewLevel || onApplyNewConfig;

  const handleCopyLink = async () => {
    const success = await copyDeepLinkToClipboard(s, level?.seed, true);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleObject = (key, value) => {
    dispatch({ type: 'SET_SETTING', key, value });
    if (applyNewConfig) applyNewConfig({ [key]: value });
  };

  return (
    <div className="slingshot-config-overlay" onClick={onClose}>
      <div className="slingshot-config-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <Settings size={20} color="var(--color-accent-purple)" />
            <span>Game Menu & Settings</span>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close Menu" style={{ padding: '4px 8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Single Labeled Panel Content (Scrollable) */}
        <div className="drawer-content">
          {/* SECTION 0: Quick System Actions */}
          <div className="config-section" style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '12px' }}>
            <div className="section-header">
              <Sliders size={16} color="#38bdf8" />
              <span style={{ color: '#38bdf8', fontWeight: '800' }}>System Quick Controls</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
              {onToggleSound && (
                <button
                  className={`btn-icon ${soundEnabled ? 'active' : ''}`}
                  onClick={onToggleSound}
                  style={{ justifyContent: 'center', padding: '8px 12px', fontSize: '0.82rem' }}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{soundEnabled ? 'Audio On' : 'Mute'}</span>
                </button>
              )}

              <button
                className={`btn-icon ${showAllPastTrails ? 'active' : ''}`}
                onClick={onTogglePastTrails}
                disabled={!pastTrails || pastTrails.length === 0}
                style={{
                  justifyContent: 'center',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  opacity: pastTrails && pastTrails.length > 0 ? 1 : 0.4,
                }}
              >
                {showAllPastTrails ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>{showAllPastTrails ? 'Show All' : 'Past Trails'}</span>
              </button>

              <button
                className="btn-icon"
                onClick={() => applyNewConfig && applyNewConfig()}
                style={{ justifyContent: 'center', padding: '8px 12px', fontSize: '0.82rem' }}
              >
                <RotateCcw size={16} />
                <span>New System</span>
              </button>

              <button
                className={`btn-icon ${copied ? 'active' : ''}`}
                onClick={handleCopyLink}
                title="Copy Shareable Deep Link URL to Clipboard"
                style={{
                  justifyContent: 'center',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  borderColor: copied ? '#4ade80' : 'rgba(255,255,255,0.15)',
                  color: copied ? '#4ade80' : 'inherit',
                }}
              >
                {copied ? <Check size={16} color="#4ade80" /> : <Link size={16} />}
                <span>{copied ? 'Copied Link!' : 'Deep Link'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 0.5: Difficulty Tier & Complexity Rating */}
          <div className="config-section" style={{ borderLeft: '3px solid #a855f7', paddingLeft: '12px' }}>
            <div className="section-header">
              <Sparkles size={16} color="#a855f7" />
              <span style={{ color: '#a855f7', fontWeight: '800' }}>Difficulty & Map Complexity</span>
            </div>

            {/* Compact Smooth Difficulty Range Slider */}
            <div style={{ marginTop: '10px', background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              {(() => {
                const TIER_ORDER = [
                  { id: 'auto', label: '🎲 Random (Procedural)', color: '#38bdf8' },
                  { id: 'easy', label: '🟢 Easy (Level 2)', color: '#4ade80' },
                  { id: 'medium', label: '🟡 Medium (Level 3)', color: '#f59e0b' },
                  { id: 'hard', label: '🔴 Hard (Level 4)', color: '#f43f5e' },
                  { id: 'nightmare', label: '☠️ Nightmare (Level 4)', color: '#ef4444' },
                  { id: 'singularity', label: '🌀 Singularity (Level 5)', color: '#c084fc' },
                ];
                const activeIdx = Math.max(0, TIER_ORDER.findIndex((t) => t.id === difficultyTier));
                const currentTierObj = TIER_ORDER[activeIdx] || TIER_ORDER[0];

                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.8rem' }}>
                      <span style={{ opacity: 0.8 }}>Target Tier:</span>
                      <span style={{ fontWeight: '800', color: currentTierObj.color }}>
                        {currentTierObj.label}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={activeIdx}
                      onChange={(e) => {
                        const newTierObj = TIER_ORDER[Number(e.target.value)];
                        if (newTierObj) {
                          dispatch({ type: 'SET_SETTING', key: 'difficultyTier', value: newTierObj.id });
                          if (applyNewConfig) applyNewConfig({ difficultyTier: newTierObj.id });
                        }
                      }}
                      style={{ width: '100%', accentColor: currentTierObj.color, cursor: 'pointer' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', opacity: 0.6, marginTop: '4px' }}>
                      <span>Random</span>
                      <span>Easy</span>
                      <span>Med</span>
                      <span>Hard</span>
                      <span>Nightmare</span>
                      <span>Singularity</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Curated Golden Seed Presets Browser Sub-Panel */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px rgba(255, 255, 255, 0.1) solid' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a855f7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={14} color="#a855f7" />
                <span>Golden Presets Catalog (161 Mined Maps)</span>
              </div>

              {/* Tier selector for presets browser in compact 2x2 grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '6px' }}>
                {[
                  { id: 'level2', label: 'Standard (50)' },
                  { id: 'level3', label: 'Hard (50)' },
                  { id: 'level4', label: 'Nightmare (50)' },
                  { id: 'level5', label: '🌀 Singularity (11)' },
                ].map((pt) => (
                  <button
                    key={pt.id}
                    className={`preset-btn ${selectedPresetTier === pt.id ? 'active' : ''}`}
                    style={{ padding: '4px 6px', fontSize: '0.7rem', width: '100%' }}
                    onClick={() => setSelectedPresetTier(pt.id)}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>

              {/* Grid of preset map cards */}
              <div
                style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '6px',
                  paddingRight: '4px',
                }}
              >
                {(getAllGoldenPresets()[selectedPresetTier] || []).map((p, idx) => {
                  const rating = p.difficultyRating || {};
                  const isSelected = level?.seed === p.seed;

                  return (
                    <div
                      key={p.seed || idx}
                      onClick={() => {
                        dispatch({ type: 'SET_SETTING', key: 'difficultyTier', value: rating.tier || selectedPresetTier });
                        if (applyNewConfig) {
                          applyNewConfig({
                            difficultyTier: rating.tier || selectedPresetTier,
                            seed: p.seed,
                            bypassPresets: false,
                          });
                        }
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: '700', color: isSelected ? '#a855f7' : '#e2e8f0' }}>
                        Seed #{p.seed}
                      </div>
                      <div style={{ opacity: 0.85, fontSize: '0.68rem', marginTop: '2px' }}>
                        Score: {rating.compositeScore || 'N/A'}
                      </div>
                      <div style={{ opacity: 0.7, fontSize: '0.66rem' }}>
                        Turn: {Math.round(rating.minTurnDeg || 0)}° | Win: {rating.maxSolutionWindowDeg || 0.1}°
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {level?.difficultyRating && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {level.difficultyRating.tierEmoji} {level.difficultyRating.tierLabel} Tier
                  </span>
                  <span style={{ color: level.difficultyRating.solvable ? '#4ade80' : '#ef4444' }}>
                    {level.difficultyRating.solvable ? '✓ Solvable' : '⚠ Unsolvable'}
                  </span>
                </div>
                <div style={{ opacity: 0.85, fontSize: '0.74rem' }}>
                  Min Turn: {Math.round(level.difficultyRating.minTurnDeg || 0)}° | Max Turn: {Math.round(level.difficultyRating.maxTurnDeg || 0)}° | Window: {(level.difficultyRating.windowDensity !== undefined ? level.difficultyRating.windowDensity : (level.difficultyRating.maxSolutionWindowDeg || 0)).toFixed(2)}° ({level.difficultyRating.solutionCount || 0} solutions)
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: Optional Celestial Objects */}
          <div className="config-section">
            <div className="section-header">
              <Sparkles size={16} />
              <span>Celestial Objects & Phenomena</span>
            </div>
            <div className="toggle-grid dense-grid">
              <label className="toggle-card dense">
                <input
                  type="checkbox"
                  checked={enableEnemyShip}
                  onChange={(e) => handleToggleObject('enableEnemyShip', e.target.checked)}
                  style={{ accentColor: '#ef4444' }}
                />
                <div>
                  <div className="toggle-title" style={{ color: '#ef4444' }}>👾 Hostile Enemy Interceptor</div>
                  <div className="toggle-sub">Active AI ship firing counter-projectiles</div>
                </div>
              </label>

              <label className="toggle-card dense">
                <input
                  type="checkbox"
                  checked={enableBlackHoles}
                  onChange={(e) => handleToggleObject('enableBlackHoles', e.target.checked)}
                  style={{ accentColor: '#f97316' }}
                />
                <div>
                  <div className="toggle-title">🕳️ Black Hole Singularity</div>
                  <div className="toggle-sub">Massive gravity trap with fatal event horizon</div>
                </div>
              </label>

              <label className="toggle-card dense">
                <input
                  type="checkbox"
                  checked={enableAsteroids}
                  onChange={(e) => handleToggleObject('enableAsteroids', e.target.checked)}
                  style={{ accentColor: '#f59e0b' }}
                />
                <div>
                  <div className="toggle-title">🪨 Asteroid Drag Cloud</div>
                  <div className="toggle-sub">Dense space dust field that decelerates ship</div>
                </div>
              </label>

              <label className="toggle-card dense">
                <input
                  type="checkbox"
                  checked={enableWormholes}
                  onChange={(e) => handleToggleObject('enableWormholes', e.target.checked)}
                  style={{ accentColor: '#a855f7' }}
                />
                <div>
                  <div className="toggle-title">🌀 Wormhole Teleport Portals</div>
                  <div className="toggle-sub">Instant portal entry-to-exit transfer gate</div>
                </div>
              </label>

              <label className="toggle-card dense">
                <input
                  type="checkbox"
                  checked={enablePulsars}
                  onChange={(e) => handleToggleObject('enablePulsars', e.target.checked)}
                  style={{ accentColor: '#38bdf8' }}
                />
                <div>
                  <div className="toggle-title">⚡ Repulsive Pulsar Star</div>
                  <div className="toggle-sub">Anti-gravity force repelling trajectories</div>
                </div>
              </label>

              <label className="toggle-card dense">
                <input
                  type="checkbox"
                  checked={enableBoosters}
                  onChange={(e) => handleToggleObject('enableBoosters', e.target.checked)}
                  style={{ accentColor: '#10b981' }}
                />
                <div>
                  <div className="toggle-title">🚀 Speed Booster Gate</div>
                  <div className="toggle-sub">Velocity multiplier gate accelerating flight</div>
                </div>
              </label>

              <label className="toggle-card dense">
                <input
                  type="checkbox"
                  checked={enableShields}
                  onChange={(e) => handleToggleObject('enableShields', e.target.checked)}
                  style={{ accentColor: '#64748b' }}
                />
                <div>
                  <div className="toggle-title">🛡️ Shield Deflector Moon</div>
                  <div className="toggle-sub">Elastic surface reflecting shot ricochets</div>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 2: Physics & Solar System Controls */}
          <div className="config-section">
            <div className="section-header">
              <Globe size={16} />
              <span>Solar System Physics & Scale</span>
            </div>

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

          {/* SECTION 3: Visual & Vector Overlays */}
          <div className="config-section">
            <div className="section-header">
              <Eye size={16} />
              <span>Physics Vector & Visual Overlays</span>
            </div>
            <div className="toggle-list dense-list">
              <label className="toggle-row dense">
                <input
                  type="checkbox"
                  checked={showGravityVectors}
                  onChange={(e) => dispatch({ type: 'TOGGLE_OVERLAY', key: 'showGravityVectors' })}
                  style={{ accentColor: '#ec4899' }}
                />
                <span>🪐 Planet Gravity Pull Vectors (F₁, F₂, ...)</span>
              </label>

              <label className="toggle-row dense">
                <input
                  type="checkbox"
                  checked={showNetVector}
                  onChange={(e) => dispatch({ type: 'TOGGLE_OVERLAY', key: 'showNetVector' })}
                  style={{ accentColor: '#ffffff' }}
                />
                <span>⚡ Combined Net Gravity Vector (F_net)</span>
              </label>

              <label className="toggle-row dense">
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
        </div>
      </div>
    </div>
  );
}
