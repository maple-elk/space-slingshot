import React from 'react';

export function SunRenderer({ sun }) {
  if (!sun) return null;

  return (
    <g transform={`translate(${sun.x}, ${sun.y})`} className="sun-group">
      <defs>
        <radialGradient id="sunCoronaGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="1.0" />
          <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#f97316" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
        </radialGradient>

        <filter id="sunGlowFilter" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Solar Atmosphere Flare Ring */}
      <circle
        r={sun.radius * 2.8}
        fill="url(#sunCoronaGrad)"
        style={{ pointerEvents: 'none' }}
      />

      {/* Pulsing Sun Outer Glow */}
      <circle
        r={sun.radius * 1.5}
        fill="#fbbf24"
        opacity="0.35"
        filter="url(#sunGlowFilter)"
      />

      {/* Core Solar Body */}
      <circle
        r={sun.radius}
        fill="#fef08a"
        stroke="#f59e0b"
        strokeWidth="3.5"
        filter="url(#sunGlowFilter)"
      />

      {/* Sun Hotspot Core */}
      <circle
        r={sun.radius * 0.45}
        fill="#ffffff"
        opacity="0.9"
      />
    </g>
  );
}
