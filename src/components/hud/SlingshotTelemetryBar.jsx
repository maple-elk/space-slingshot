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
}) {
  const isLaunchDisabled = isSimulating || turnOwner !== 'player' || roundCompleted;

  return (
    <div className="slingshot-telemetry-bar">
      {/* Brand */}
      <div className="telemetry-left">
        <span style={{ fontSize: '1.3rem' }}>🚀</span>
        <span className="telemetry-title hide-on-mobile">Space Slingshot</span>
      </div>

      {/* Main Aim & Flight Controls (Migrated to Top Bar) */}
      <div className="telemetry-launch-controls" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Angle Slider */}
        <div className="control-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Compass size={14} color="var(--color-corner-a)" />
          <span className="hide-on-mobile">θ:</span>
          <span style={{ color: 'var(--color-corner-a)', fontWeight: '700', minWidth: '32px' }}>{angle}°</span>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            disabled={isLaunchDisabled}
            onChange={(e) => dispatch && dispatch({ type: 'SET_AIM', angle: Number(e.target.value) })}
            className="launch-slider"
            style={{ width: '80px', accentColor: 'var(--color-corner-a)' }}
          />
        </div>

        {/* Power Slider */}
        <div className="control-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--color-corner-c)', fontWeight: '700' }}>⚡</span>
          <span className="hide-on-mobile">Pwr:</span>
          <span style={{ color: 'var(--color-corner-c)', fontWeight: '700', minWidth: '28px' }}>{power}</span>
          <input
            type="range"
            min="10"
            max="60"
            value={power}
            disabled={isLaunchDisabled}
            onChange={(e) => dispatch && dispatch({ type: 'SET_AIM', power: Number(e.target.value) })}
            className="launch-slider"
            style={{ width: '80px', accentColor: 'var(--color-corner-c)' }}
          />
        </div>

        {/* Action Button */}
        {handleLaunch && (
          <button
            className={isSimulating || gameStatus === 'enemy_flying' ? 'btn-primary btn-danger' : 'btn-primary'}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              whiteSpace: 'nowrap',
              minWidth: '95px',
              justifyContent: 'center',
              backgroundColor: (isSimulating || gameStatus === 'enemy_flying') ? '#ef4444' : undefined,
            }}
            onClick={() => {
              if (roundCompleted) onNewLevel();
              else if (isSimulating || gameStatus === 'enemy_flying') handleStopFlight && handleStopFlight();
              else handleLaunch();
            }}
          >
            <Play size={14} />
            <span>
              {roundCompleted
                ? 'Next System'
                : isSimulating || gameStatus === 'enemy_flying'
                ? 'Stop 🛑'
                : 'Launch'}
            </span>
          </button>
        )}
      </div>

      {/* Telemetry Stats Readout */}
      <div
        className="telemetry-stats hide-on-mobile"
        style={{ fontSize: '0.82rem', gap: '12px', fontVariantNumeric: 'tabular-nums' }}
      >
        <span style={{ color: '#38bdf8', minWidth: '80px', display: 'inline-block' }}>
          🎯 {targetDist}px
        </span>
        <span style={{ color: '#4ade80', minWidth: '85px', display: 'inline-block' }}>
          ⚡ {currentSpeed}px/s
        </span>
      </div>

      {/* System Actions: Single Prominent Menu & Settings Button */}
      <div className="telemetry-actions">
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
