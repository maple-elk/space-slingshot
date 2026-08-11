import React from 'react';
import { Eye, EyeOff, Sliders, Maximize2, Minimize2, RotateCcw, Volume2, VolumeX, Play, Compass } from 'lucide-react';

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
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  // Launch Control Props
  angle = 335,
  power = 55,
  isSimulating = false,
  turnOwner = 'player',
  roundCompleted = false,
  dispatch,
  handleLaunch,
  handleStopFlight,
  level,
}) {
  const isLaunchDisabled = isSimulating || turnOwner !== 'player' || roundCompleted;

  return (
    <div className="slingshot-telemetry-bar">
      {/* Brand */}
      <div className="telemetry-left">
        <span style={{ fontSize: '1.3rem' }}>🚀</span>
        <span className="telemetry-title hide-on-mobile">Space Slingshot</span>
      </div>



      {/* Map Difficulty & Source Metadata Badge */}
      <div className="telemetry-stats" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {level?.difficultyRating && (
          <div
            onClick={onToggleConfig}
            className="btn-icon"
            title={`Click to open Map & Difficulty Settings. Seed #${level.seed || 'N/A'}`}
            style={{
              padding: '4px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#e9d5ff',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>{level.difficultyRating.tierEmoji}</span>
            <span style={{ color: '#f8fafc', fontWeight: '800' }}>{level.difficultyRating.tierLabel} Tier</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            
            {/* Source Label & Seed */}
            <span style={{ color: '#c084fc', fontWeight: '600', fontSize: '0.74rem' }}>
              {level.generationMode === 'preset'
                ? `🏆 Golden Seed #${level.seed}`
                : level.generationMode === 'runtime_scored'
                ? `🎯 Mined Seed #${level.seed}`
                : `🎲 Random Seed #${level.seed}`}
            </span>
          </div>
        )}

        {/* Current Session Status Badge (Score & Shots Taken) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '4px 12px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '0.78rem',
            fontWeight: '700',
            fontVariantNumeric: 'tabular-nums',
            color: '#e2e8f0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#f59e0b' }}>🏆</span>
            <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>Score:</span>
            <strong style={{ color: '#fbbf24' }}>{score || 0}</strong>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#38bdf8' }}>🎯</span>
            <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>Shots:</span>
            <strong style={{ color: '#38bdf8' }}>{(pastTrails || []).length}</strong>
          </span>
        </div>
      </div>

      {/* System Actions: Fullscreen & Menu Buttons */}
      <div className="telemetry-actions">
        {onToggleFullscreen && (
          <button
            className={`btn-icon ${isFullscreen ? 'active' : ''}`}
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hide-on-mobile">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        )}
        <button
          className={`btn-config-prominent ${isConfigOpen ? 'active' : ''}`}
          onClick={onToggleConfig}
          title="Open Game Menu & Settings Drawer"
          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
        >
          <Sliders size={15} />
          <span>Menu & Settings</span>
        </button>
      </div>
    </div>
  );
}
