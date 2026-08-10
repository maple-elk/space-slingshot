import React, { memo } from 'react';
import { Zap, Eye, EyeOff } from 'lucide-react';

export const UniverseControlsCard = memo(function UniverseControlsCard({
  simSpeedScale,
  boardScale,
  gravityG,
  planetCount,
  massMult,
  showGravityGradients,
  showGravityVectors,
  showNetVector,
  level,
  dispatch,
  handleNewLevel,
}) {
  return (
    <div className="side-card">
      <div className="card-title" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={20} color="var(--color-corner-c)" />
          <span>Universe Physics & Controls</span>
        </div>
        {level?.difficultyRating && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#c7d2fe',
            }}
          >
            {level.difficultyRating.tierEmoji} {level.difficultyRating.tierLabel}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>Orbit Simulation Speed</span>
            <span style={{ color: '#38bdf8' }}>{simSpeedScale}x</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0.5, 1.0, 1.5, 2.5].map((spd) => (
              <button
                key={spd}
                className={`preset-btn ${simSpeedScale === spd ? 'active' : ''}`}
                style={{ flex: 1, padding: '4px 2px', fontSize: '0.75rem' }}
                onClick={() => dispatch({ type: 'SET_SETTING', key: 'simSpeedScale', value: spd })}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>Board Arena Scale</span>
            <span style={{ color: '#ec4899' }}>{boardScale}x</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0.6, 1.0, 1.4, 1.8].map((scl) => (
              <button
                key={scl}
                className={`preset-btn ${boardScale === scl ? 'active' : ''}`}
                style={{ flex: 1, padding: '4px 2px', fontSize: '0.75rem' }}
                onClick={() => {
                  dispatch({ type: 'SET_SETTING', key: 'boardScale', value: scl });
                  handleNewLevel({ boardScale: scl });
                }}
              >
                {scl}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>Universal Gravitational Constant (G)</span>
            <span style={{ color: '#4ade80' }}>{gravityG}</span>
          </div>
          <input
            type="range"
            min="300"
            max="3000"
            step="100"
            value={gravityG}
            onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'gravityG', value: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#4ade80' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>Number of Orbiting Celestial Bodies</span>
            <span style={{ color: '#f59e0b' }}>{planetCount}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5, 6].map((cnt) => (
              <button
                key={cnt}
                className={`preset-btn ${planetCount === cnt ? 'active' : ''}`}
                style={{ flex: 1, padding: '4px 2px', fontSize: '0.7rem' }}
                onClick={() => {
                  dispatch({ type: 'SET_SETTING', key: 'planetCount', value: cnt });
                  handleNewLevel({ planetCount: cnt, massMult });
                }}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showGravityGradients}
              onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showGravityGradients', value: e.target.checked })}
            />
            <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {showGravityGradients ? <Eye size={14} /> : <EyeOff size={14} />} Show Gravitational Potential Fields
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showGravityVectors}
              onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showGravityVectors', value: e.target.checked })}
            />
            <span style={{ fontSize: '0.8rem' }}>Show Individual Gravitational Pull Vectors</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showNetVector}
              onChange={(e) => dispatch({ type: 'SET_SETTING', key: 'showNetVector', value: e.target.checked })}
            />
            <span style={{ fontSize: '0.8rem' }}>Show Combined Net Acceleration Vector</span>
          </label>
        </div>
      </div>
    </div>
  );
});

