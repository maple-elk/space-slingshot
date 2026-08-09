import React, { memo } from 'react';

/**
 * Fixed-size Telemetry HUD Badge overlaid on top right of space canvas
 */
export const TelemetryHUD = memo(function TelemetryHUD({ targetDist, currentSpeed }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 25,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '12px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        fontFamily: 'Outfit',
        fontSize: '0.85rem',
        fontWeight: '700',
      }}
    >
      <span style={{ color: '#38bdf8' }}>🎯 Target: {targetDist} px</span>
      <span style={{ color: '#4ade80' }}>⚡ Speed: {currentSpeed} px/s</span>
    </div>
  );
});

