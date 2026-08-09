import React from 'react';

export function TargetRenderer({ target }) {
  if (!target) return null;

  return (
    <g transform={`translate(${target.x}, ${target.y})`}>
      <circle
        r={target.radius + 10}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeDasharray="6 6"
        opacity="0.7"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="360"
          dur="10s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        r={target.radius}
        fill="rgba(56, 189, 248, 0.35)"
        stroke="#38bdf8"
        strokeWidth="3"
        filter="url(#targetGlow)"
      />
      <text textAnchor="middle" dy="5" fontSize="16">
        🎯
      </text>
    </g>
  );
}
