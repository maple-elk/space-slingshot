import React, { memo } from 'react';
import { Play, RotateCcw } from 'lucide-react';

export const EndSummaryModal = memo(function EndSummaryModal({ roundCompleted, shotOutcome, shotsTaken, currentScore, level, handleNewLevel }) {
  if (!roundCompleted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '90%',
          maxWidth: '460px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '3rem' }}>
          {shotOutcome === 'hit_target'
            ? '🎯'
            : shotOutcome === 'hit_enemy'
            ? '🚀'
            : shotOutcome === 'black_hole'
            ? '🕳️'
            : '💥'}
        </div>

        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
          {shotOutcome === 'hit_target'
            ? 'Orbit Slingshot Mastery!'
            : shotOutcome === 'hit_enemy'
            ? 'Enemy Interceptor Destroyed!'
            : shotOutcome === 'black_hole'
            ? 'Consumed by Black Hole Event Horizon'
            : 'Crashing Collision in Deep Space'}
        </h2>

        <p style={{ color: 'var(--color-text-subtle)', margin: 0, fontSize: '0.95rem' }}>
          {shotOutcome === 'hit_target'
            ? `You successfully slingshotted through gravitational wells and docked at the space station in ${shotsTaken} shot(s)!`
            : shotOutcome === 'hit_enemy'
            ? `Direct hit! You neutralized the hostile enemy ship in ${shotsTaken} shot(s)!`
            : `Your probe suffered catastrophic structural failure. Study the gravity vectors and recalibrate your launch parameters.`}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px 24px',
            borderRadius: '12px',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>Round Shots</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-corner-a)' }}>{shotsTaken}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>Total Score</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent-gold)' }}>{currentScore}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>Planets</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-corner-b)' }}>{level.planets?.length || 0}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleNewLevel()}>
            <Play size={18} />
            <span>Next Solar System</span>
          </button>
          <button className="btn-icon" onClick={() => handleNewLevel()}>
            <RotateCcw size={18} />
            <span>Retry Level</span>
          </button>
        </div>
      </div>
    </div>
  );
});

