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
  angle = 335,
  power = 55,
  isSimulating = false,
  turnOwner = 'player',
  roundCompleted = false,
  dispatch,
  handleLaunch,
  handleStopFlight,
  level,
  gameMode = 'puzzle',
  onToggleGameMode,
  p1Score = 0,
  p2Score = 0,
}) {
  const isLaunchDisabled = isSimulating || (turnOwner !== 'player' && turnOwner !== 'player1' && turnOwner !== 'player2') || roundCompleted;
  const isDuel = gameMode === 'duel' || level?.generationMode === 'duel';

  return (
    <div className="slingshot-telemetry-bar">
      {/* Brand & Mode Switcher */}
      <div className="telemetry-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.3rem' }}>🚀</span>
        <span className="telemetry-title hide-on-mobile">{isDuel ? '2P Slingshot Duel' : 'Space Slingshot'}</span>

        {/* Mode Selector Button */}
        {onToggleGameMode && (
          <button
            className="btn-icon"
            onClick={onToggleGameMode}
            title={isDuel ? 'Switch to 1P Puzzle Mode' : 'Switch to 2P Local Slingshot Duel Mode'}
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: isDuel ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(245, 158, 11, 0.4))' : 'rgba(59, 130, 246, 0.25)',
              border: '1px solid',
              borderColor: isDuel ? '#ef4444' : '#3b82f6',
              color: isDuel ? '#fef08a' : '#93c5fd',
              borderRadius: '8px',
            }}
          >
            <span>{isDuel ? '⚔️ 2P Duel Active' : '🧩 1P Puzzle'}</span>
          </button>
        )}
      </div>

      {/* Center Info: Duel Active Turn & Round Scores vs 1P Map/Score Badge */}
      {isDuel ? (
        <div className="duel-telemetry-hud" style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(15, 23, 42, 0.85)', padding: '4px 14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: '700', color: turnOwner === 'player1' ? '#38bdf8' : '#94a3b8' }}>
            <span>🔵 P1 Wins:</span>
            <strong style={{ color: '#38bdf8' }}>{p1Score}</strong>
          </div>

          <div style={{ padding: '2px 10px', borderRadius: '12px', background: turnOwner === 'player1' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(239, 68, 68, 0.25)', border: '1px solid', borderColor: turnOwner === 'player1' ? '#06b6d4' : '#ef4444', color: turnOwner === 'player1' ? '#38bdf8' : '#f87171', fontWeight: '800', fontSize: '0.8rem' }}>
            {turnOwner === 'player1' ? '🚀 PLAYER 1\'S TURN' : '🚀 PLAYER 2\'S TURN'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: '700', color: turnOwner === 'player2' ? '#ef4444' : '#94a3b8' }}>
            <span>🔴 P2 Wins:</span>
            <strong style={{ color: '#ef4444' }}>{p2Score}</strong>
          </div>
        </div>
      ) : (
        /* Map Difficulty & Source Metadata Badge */
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
      )}

      {/* Right-Side Actions: Audio, Fullscreen & Settings Drawer Buttons */}
      <div className="telemetry-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onToggleSound && (
          <button
            className={`btn-icon ${soundEnabled ? 'active' : ''}`}
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        )}
        {onToggleFullscreen && (
          <button
            className={`btn-icon ${isFullscreen ? 'active' : ''}`}
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{ padding: '6px 10px', fontSize: '0.82rem' }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
        <button
          className={`btn-config-prominent ${isConfigOpen ? 'active' : ''}`}
          onClick={onToggleConfig}
          title="Open Game Menu & Settings Drawer"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
        >
          <Sliders size={15} />
          <span className="hide-on-mobile">Menu & Settings</span>
        </button>
      </div>
    </div>
  );
}
