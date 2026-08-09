import React from 'react';

export function AsteroidRenderer({ asteroid }) {
  return (
    <g>
      <circle
        cx={asteroid.x}
        cy={asteroid.y}
        r={asteroid.radius}
        fill="rgba(245, 158, 11, 0.16)"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />
      <text x={asteroid.x} y={asteroid.y + 4} textAnchor="middle" fontSize="24" opacity="0.7">
        🪨
      </text>
      <text x={asteroid.x} y={asteroid.y + asteroid.radius + 14} textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="700">
        Asteroid Drag Cloud
      </text>
    </g>
  );
}
