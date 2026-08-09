import React from 'react';
import { Eye, EyeOff, Sliders, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

export function SlingshotTelemetryBar({
  targetDist,
  currentSpeed,
  netAccelMag,
  score,
  gameStatus,
  enemyAimInfo,
  pastTrails,
  showAllPastTrails,
  onTogglePastTrails,
  onNewLevel,
  onToggleConfig,
  isConfigOpen,
  isFullscreen,
  onToggleFullscreen,
}) {
  return (
    <div className="slingshot-telemetry-bar">
      <div className="telemetry-left">
        <span style={{ fontSize: '1.3rem' }}>🚀</span>
        <span className="telemetry-title">Space Slingshot</span>

        {/* Status Badges */}
        {gameStatus === 'hit_enemy' && (
          <div className="status-badge" style={{ background: 'rgba(236, 72, 153, 0.3)', color: '#ec4899', border: '1px solid #ec4899' }}>
            💥 Enemy Disabled (+150 pts)!
          </div>
        )}
        {gameStatus === 'hit_player' && (
          <div className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', border: '1px solid #ef4444' }}>
            💥 Direct Hit! Enemy struck your ship!
          </div>
        )}
        {gameStatus === 'enemy_aiming' && enemyAimInfo && (
          <div className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b', border: '1px solid #f59e0b' }}>
            👾 Enemy Interceptor: {enemyAimInfo.archetypeName}
          </div>
        )}
      </div>

      {/* Center Telemetry Readouts */}
      <div className="telemetry-stats">
        <span style={{ color: '#38bdf8' }}>🎯 Target: {targetDist} px</span>
        <span style={{ color: '#4ade80' }}>⚡ Speed: {currentSpeed} px/s</span>
        <span style={{ color: '#ec4899' }}>🌌 F_net: {netAccelMag.toFixed(1)}</span>
        <span style={{ color: '#fbbf24', fontWeight: '800' }}>🏆 Score: {score}</span>
      </div>

      {/* Right Controls */}
      <div className="telemetry-actions">
        {pastTrails && pastTrails.length > 0 && (
          <button
            className={`btn-icon ${showAllPastTrails ? 'active' : ''}`}
            onClick={onTogglePastTrails}
            title="Toggle showing all past shot trails"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
          >
            {showAllPastTrails ? <Eye size={15} /> : <EyeOff size={15} />}
            <span className="hide-on-mobile">
              {showAllPastTrails ? `Past (${pastTrails.length})` : 'Shots'}
            </span>
          </button>
        )}

        <button
          className="btn-icon"
          onClick={onNewLevel}
          title="Generate Random Planet System"
          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
        >
          <RotateCcw size={15} />
          <span className="hide-on-mobile">New Orbit</span>
        </button>

        <button
          className={`btn-config-prominent ${isConfigOpen ? 'active' : ''}`}
          onClick={onToggleConfig}
          title="Open Universe Config & Customization Menu"
        >
          <Sliders size={16} />
          <span>⚙️ Config</span>
        </button>

        {onToggleFullscreen && (
          <button
            className="btn-icon"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}
