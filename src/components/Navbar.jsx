import React from 'react';
import { Volume2, VolumeX, Maximize, Minimize, Globe, Clock, Box } from 'lucide-react';

export default function Navbar({
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  dimensionMode = '2d',
  onSelectDimensionMode,
  enableSolarOrbit = false,
  onToggleSolarOrbit,
  gameMode = 'puzzle',
  onToggleGameMode,
}) {
  // Compute active dimension mode ('2d' | '3d' | 'solar')
  const currentMode = dimensionMode !== '2d' ? dimensionMode : (enableSolarOrbit ? 'solar' : '2d');

  const handleSelectMode = (mode) => {
    if (onSelectDimensionMode) {
      onSelectDimensionMode(mode);
    }
    if (onToggleSolarOrbit) {
      onToggleSolarOrbit(mode === 'solar');
    }
  };

  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-logo">🚀</div>
        <div>
          <div className="brand-title">Space Slingshot</div>
          <div className="brand-subtitle">Gravity Physics & Orbital Dynamics Engine</div>
        </div>
      </div>

      <div className="nav-controls">
        {/* Mode Switcher: 2D Classic vs 3D WebGL vs Time Dimensions */}
        <div className="mode-switcher-group" style={{ display: 'flex', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            className={`btn-icon ${currentMode === '2d' ? 'active' : ''}`}
            onClick={() => handleSelectMode('2d')}
            title="Switch to Classic 2D Space Slingshot Mode"
            style={{ padding: '5px 10px', fontSize: '0.8rem', background: currentMode === '2d' ? 'rgba(59, 130, 246, 0.35)' : 'transparent', borderColor: currentMode === '2d' ? '#3b82f6' : 'transparent' }}
          >
            <Globe size={15} />
            <span>🪐 2D Classic</span>
          </button>

          <button
            className={`btn-icon ${currentMode === '3d' ? 'active' : ''}`}
            onClick={() => handleSelectMode('3d')}
            title="Switch to 3D WebGL Orbital Engine"
            style={{ padding: '5px 10px', fontSize: '0.8rem', background: currentMode === '3d' ? 'rgba(168, 85, 247, 0.35)' : 'transparent', borderColor: currentMode === '3d' ? '#a855f7' : 'transparent', color: currentMode === '3d' ? '#e9d5ff' : 'inherit' }}
          >
            <Box size={15} />
            <span>🌌 3D WebGL</span>
          </button>

          <button
            className={`btn-icon ${currentMode === 'solar' ? 'active' : ''}`}
            onClick={() => handleSelectMode('solar')}
            title="Switch to Space Slingshot: Time Dimensions (Solar Orbit)"
            style={{ padding: '5px 10px', fontSize: '0.8rem', background: currentMode === 'solar' ? 'rgba(251, 191, 36, 0.35)' : 'transparent', borderColor: currentMode === 'solar' ? '#fbbf24' : 'transparent', color: currentMode === 'solar' ? '#fef08a' : 'inherit' }}
          >
            <Clock size={15} />
            <span>⏳ Time Dimensions</span>
          </button>
        </div>

        {/* 1P Puzzle vs 2P Duel Toggle Button */}
        {onToggleGameMode && (
          <button
            className="btn-icon"
            onClick={onToggleGameMode}
            title={gameMode === 'duel' ? 'Switch to 1P Puzzle Mode' : 'Switch to 2P Local Slingshot Duel Mode'}
            style={{
              padding: '5px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: gameMode === 'duel' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(245, 158, 11, 0.4))' : 'rgba(59, 130, 246, 0.25)',
              border: '1px solid',
              borderColor: gameMode === 'duel' ? '#ef4444' : '#3b82f6',
              color: gameMode === 'duel' ? '#fef08a' : '#93c5fd',
              borderRadius: '8px',
            }}
          >
            <span>{gameMode === 'duel' ? '⚔️ 2P Duel Active' : '🧩 Mode: 1P Puzzle'}</span>
          </button>
        )}

        <button
          className={`btn-icon ${isFullscreen ? 'active' : ''}`}
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen Mode' : 'Enter Single-Screen Fullscreen Mode'}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>

        <button
          className={`btn-icon ${soundEnabled ? 'active' : ''}`}
          onClick={onToggleSound}
          title="Toggle Sound Effects"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{soundEnabled ? 'Audio: ON' : 'Mute'}</span>
        </button>
      </div>
    </header>
  );
}
