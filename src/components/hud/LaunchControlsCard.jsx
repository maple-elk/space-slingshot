import React from 'react';
import { Compass, Play, RotateCcw } from 'lucide-react';

export function LaunchControlsCard({
  angle,
  power,
  isSimulating,
  turnOwner,
  roundCompleted,
  gameStatus,
  dispatch,
  handleLaunch,
  handleStopFlight,
  handleNewLevel,
}) {
  return (
    <div className="side-card">
      <div className="card-title">
        <Compass size={20} color="var(--color-accent-gold)" />
        <span>Launch Controls</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontWeight: '600',
            }}
          >
            <span>Launch Angle (θ) [◀ ▶]</span>
            <span style={{ color: 'var(--color-corner-a)' }}>{angle}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            disabled={isSimulating || turnOwner !== 'player' || roundCompleted}
            onChange={(e) => dispatch({ type: 'SET_AIM', angle: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--color-corner-a)' }}
          />
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontWeight: '600',
            }}
          >
            <span>Launch Power (|v|) [▲ ▼]</span>
            <span style={{ color: 'var(--color-corner-c)' }}>{power} Speed</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={power}
            disabled={isSimulating || turnOwner !== 'player' || roundCompleted}
            onChange={(e) => dispatch({ type: 'SET_AIM', power: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--color-corner-c)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            className={isSimulating || gameStatus === 'enemy_flying' ? 'btn-primary btn-danger' : 'btn-primary'}
            style={{ flex: 1, backgroundColor: isSimulating || gameStatus === 'enemy_flying' ? '#ef4444' : undefined }}
            onClick={() => {
              if (roundCompleted) handleNewLevel();
              else if (isSimulating || gameStatus === 'enemy_flying') handleStopFlight();
              else handleLaunch();
            }}
          >
            <Play size={18} />
            <span>
              {roundCompleted
                ? 'Next Solar System [Space]'
                : isSimulating || gameStatus === 'enemy_flying'
                ? 'Stop Flight [Space] 🛑'
                : 'Launch! [Space]'}
            </span>
          </button>

          <button className="btn-icon" onClick={() => handleNewLevel()} title="Generate Random Planet System">
            <RotateCcw size={18} />
            <span>New Orbit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
