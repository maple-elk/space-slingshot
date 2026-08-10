import React, { memo } from 'react';
import { Play, RotateCcw } from 'lucide-react';

export const EndSummaryModal = memo(function EndSummaryModal({
  roundCompleted,
  shotOutcome,
  shotsTaken,
  currentScore,
  level = {},
  pastTrails = [],
  handleNewLevel,
}) {
  if (!roundCompleted) return null;

  const isSuccess = shotOutcome === 'hit_target';

  const titleText =
    shotOutcome === 'hit_target'
      ? 'Target Reached!'
      : shotOutcome === 'hit_player'
      ? 'Probe Intercepted!'
      : shotOutcome === 'black_hole'
      ? 'Black Hole Collision!'
      : shotOutcome === 'hit_planet'
      ? 'Planet Impact!'
      : 'Flight Terminated!';

  const iconEmoji =
    shotOutcome === 'hit_target'
      ? '🎯'
      : shotOutcome === 'black_hole'
      ? '🕳️'
      : '💥';

  const totalShots = pastTrails.length > 0 ? pastTrails.length : shotsTaken;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        width: '92%',
        maxWidth: '680px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isSuccess
            ? '1.5px solid rgba(74, 222, 128, 0.6)'
            : '1.5px solid rgba(248, 113, 113, 0.6)',
          borderRadius: '16px',
          padding: '10px 18px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {/* Outcome & Stats Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '1.5rem',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: isSuccess ? 'rgba(74, 222, 128, 0.18)' : 'rgba(248, 113, 113, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {iconEmoji}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{titleText}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '12px', marginTop: '2px' }}>
              <span>Shots: <strong style={{ color: '#38bdf8' }}>{totalShots}</strong></span>
              <span>Score: <strong style={{ color: '#fbbf24' }}>{currentScore}</strong></span>
              <span>Planets: <strong style={{ color: '#10b981' }}>{level.planets?.length || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Spacebar to Continue Action Badge & Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => handleNewLevel()}
            style={{
              padding: '8px 16px',
              fontSize: '0.88rem',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isSuccess
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            }}
          >
            <Play size={15} />
            <span>Next Level</span>
            <span
              style={{
                fontSize: '0.72rem',
                opacity: 0.9,
                background: 'rgba(0,0,0,0.25)',
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: '4px',
                fontWeight: 600,
              }}
            >
              [Space]
            </span>
          </button>

          <button
            className="btn-icon"
            onClick={() => handleNewLevel()}
            title="Retry Level"
            style={{ padding: '8px 10px' }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
});


