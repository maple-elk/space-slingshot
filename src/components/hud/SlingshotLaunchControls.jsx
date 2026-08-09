import React from 'react';
import { Play, RotateCcw, Compass, ArrowUpRight } from 'lucide-react';

export function SlingshotLaunchControls({
  angle,
  pitch = 12,
  yaw = 350,
  power,
  dimensionMode = '2d',
  isSimulating,
  turnOwner,
  roundCompleted,
  gameStatus,
  dispatch,
  handleLaunch,
  handleStopFlight,
  handleNewLevel,
}) {
  const isDisabled = isSimulating || turnOwner !== 'player' || roundCompleted;
  const is3D = dimensionMode === '3d';

  return (
    <div className="slingshot-launch-bar">
      <div className="launch-inputs" style={{ gap: is3D ? '16px' : undefined }}>
        {is3D ? (
          <>
            {/* 3D Pitch Slider */}
            <div className="launch-control-group">
              <div className="control-label">
                <ArrowUpRight size={16} color="#38bdf8" />
                <span>Pitch (θ):</span>
                <span className="control-val" style={{ color: '#38bdf8' }}>
                  {pitch}°
                </span>
              </div>
              <input
                type="range"
                min="-85"
                max="85"
                value={pitch}
                disabled={isDisabled}
                onChange={(e) => dispatch({ type: 'SET_AIM', pitch: Number(e.target.value) })}
                className="launch-slider"
                style={{ accentColor: '#38bdf8' }}
              />
            </div>

            {/* 3D Yaw Slider */}
            <div className="launch-control-group">
              <div className="control-label">
                <Compass size={16} color="#a855f7" />
                <span>Yaw (φ):</span>
                <span className="control-val" style={{ color: '#a855f7' }}>
                  {yaw}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={yaw}
                disabled={isDisabled}
                onChange={(e) => dispatch({ type: 'SET_AIM', yaw: Number(e.target.value) })}
                className="launch-slider"
                style={{ accentColor: '#a855f7' }}
              />
            </div>
          </>
        ) : (
          /* 2D Angle Slider */
          <div className="launch-control-group">
            <div className="control-label">
              <Compass size={16} color="var(--color-corner-a)" />
              <span>Angle (θ):</span>
              <span className="control-val" style={{ color: 'var(--color-corner-a)' }}>
                {angle}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={angle}
              disabled={isDisabled}
              onChange={(e) => dispatch({ type: 'SET_AIM', angle: Number(e.target.value) })}
              className="launch-slider"
              style={{ accentColor: 'var(--color-corner-a)' }}
            />
          </div>
        )}

        {/* Power Slider */}
        <div className="launch-control-group">
          <div className="control-label">
            <span style={{ color: 'var(--color-corner-c)', fontWeight: '700' }}>⚡</span>
            <span>Power (|v|):</span>
            <span className="control-val" style={{ color: 'var(--color-corner-c)' }}>
              {power}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            value={power}
            disabled={isDisabled}
            onChange={(e) => dispatch({ type: 'SET_AIM', power: Number(e.target.value) })}
            className="launch-slider"
            style={{ accentColor: 'var(--color-corner-c)' }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="launch-actions">
        <button
          className={isSimulating || gameStatus === 'enemy_flying' ? 'btn-primary btn-danger' : 'btn-primary'}
          style={{ padding: '8px 20px', fontSize: '0.9rem', backgroundColor: (isSimulating || gameStatus === 'enemy_flying') ? '#ef4444' : undefined }}
          onClick={() => {
            if (roundCompleted) handleNewLevel();
            else if (isSimulating || gameStatus === 'enemy_flying') handleStopFlight();
            else handleLaunch();
          }}
        >
          <Play size={16} />
          <span>
            {roundCompleted
              ? 'Next System [Space]'
              : isSimulating || gameStatus === 'enemy_flying'
              ? 'Stop [Space] 🛑'
              : 'Launch [Space]'}
          </span>
        </button>

        <button
          className="btn-icon"
          onClick={() => handleNewLevel()}
          title="Generate Random Planet System"
          style={{ padding: '8px 12px' }}
        >
          <RotateCcw size={16} />
          <span className="hide-on-mobile">New Orbit</span>
        </button>
      </div>

      <div className="launch-shortcuts-hint hide-on-mobile">
        {is3D ? (
          <span>⌨️ W/S/▲▼ Pitch • A/D/◀▶ Yaw • Q/E Power • [Space] Shoot</span>
        ) : (
          <span>⌨️ ◀▶ Angle • ▲▼ Power • [Space] Shoot</span>
        )}
      </div>
    </div>
  );
}
