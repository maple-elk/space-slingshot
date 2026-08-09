import React from 'react';

/**
 * Black Hole SVG Renderer
 * @param {{blackHole: import('../../types/entitySchemas').BlackHole}} props
 */
export function BlackHoleRenderer({ blackHole }) {
  return (
    <g transform={`translate(${blackHole.x}, ${blackHole.y})`}>
      <circle
        r={blackHole.eventRadius}
        fill="rgba(249, 115, 22, 0.15)"
        stroke="#f97316"
        strokeWidth="2"
        strokeDasharray="6 4"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="360"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle r={blackHole.radius} fill="#000000" stroke="#f97316" strokeWidth="2.5" />
      <text y={blackHole.eventRadius + 15} textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="700">
        🕳️ Event Horizon
      </text>
    </g>
  );
}
