import React from 'react';
import { Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

export default function Navbar({
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
}) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-logo">🚀</div>
        <div>
          <div className="brand-title">Space Slingshot</div>
          <div className="brand-subtitle">Gravity Physics & Orbital Dynamics Game</div>
        </div>
      </div>

      <div className="nav-controls">
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
