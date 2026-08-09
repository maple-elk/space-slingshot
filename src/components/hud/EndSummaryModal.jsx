import React, { memo, useState } from 'react';
import { Play, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';

export const EndSummaryModal = memo(function EndSummaryModal({
  roundCompleted,
  shotOutcome,
  shotsTaken,
  currentScore,
  level = {},
  pastTrails = [],
  handleNewLevel,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!roundCompleted) return null;

  const isSuccess = shotOutcome === 'hit_target' || shotOutcome === 'hit_enemy';

  const titleText =
    shotOutcome === 'hit_target'
      ? 'Target Reached'
      : shotOutcome === 'hit_enemy'
      ? 'Enemy Neutralized'
      : shotOutcome === 'hit_player'
      ? 'Probe Intercepted'
      : shotOutcome === 'black_hole'
      ? 'Black Hole Collision'
      : shotOutcome === 'hit_planet'
      ? 'Planet Impact'
      : 'Flight Terminated';

  const subtitleText = isSuccess
    ? `Completed successfully in ${shotsTaken} shot(s).`
    : `Round ended after ${shotsTaken} shot(s).`;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: '92%',
        maxWidth: '540px',
        pointerEvents: 'none',
      }}
    >
      <div
        className="glass-panel"
        style={{
          pointerEvents: 'auto',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isSuccess ? '1.5px solid rgba(74, 222, 128, 0.5)' : '1.5px solid rgba(248, 113, 113, 0.5)',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: 'all 0.25s ease-in-out',
        }}
      >
        {/* Top Header Row with Outcome Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                fontSize: '1.6rem',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isSuccess ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {shotOutcome === 'hit_target'
                ? '🎯'
                : shotOutcome === 'hit_enemy'
                ? '🚀'
                : shotOutcome === 'black_hole'
                ? '🕳️'
                : '💥'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, color: '#f8fafc' }}>
                {titleText}
              </h2>
              <p style={{ color: 'var(--color-text-subtle)', margin: 0, fontSize: '0.85rem' }}>
                {subtitleText}
              </p>
            </div>
          </div>

          <button
            className="btn-icon"
            onClick={() => setIsCollapsed((v) => !v)}
            title={isCollapsed ? 'Expand Summary' : 'Collapse Summary'}
            style={{ padding: '6px' }}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>

        {/* Collapsible Content Section */}
        {!isCollapsed && (
          <>
            {/* Stats Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '10px 16px',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Shots</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-corner-a)' }}>{shotsTaken}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Score</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-accent-gold)' }}>{currentScore}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase' }}>Planets</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-corner-b)' }}>{level.planets?.length || 0}</div>
              </div>
            </div>

            {/* Shots History List Summary */}
            {pastTrails && pastTrails.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  maxHeight: '64px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {pastTrails.map((tr, idx) => (
                  <span
                    key={tr.id || idx}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background:
                        tr.status === 'hit_target'
                          ? 'rgba(74, 222, 128, 0.2)'
                          : tr.status === 'hit_enemy'
                          ? 'rgba(236, 72, 153, 0.2)'
                          : tr.status === 'black_hole'
                          ? 'rgba(249, 115, 22, 0.2)'
                          : 'rgba(255, 255, 255, 0.08)',
                      color:
                        tr.status === 'hit_target'
                          ? '#4ade80'
                          : tr.status === 'hit_enemy'
                          ? '#ec4899'
                          : tr.status === 'black_hole'
                          ? '#f97316'
                          : '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    #{idx + 1}: {Math.round(tr.angle || 0)}° @ {Math.round(tr.power || 0)}%
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button className="btn-primary" style={{ flex: 1, padding: '10px 16px' }} onClick={() => handleNewLevel()}>
                <Play size={16} />
                <span>Next Solar System</span>
              </button>
              <button className="btn-icon" style={{ padding: '10px 14px' }} onClick={() => handleNewLevel()}>
                <RotateCcw size={16} />
                <span>Retry</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});


