import React from 'react';

export function ShieldRenderer({ shield }) {
  return (
    <g>
      <circle cx={shield.x} cy={shield.y} r={shield.shieldRadius} fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
      <circle cx={shield.x} cy={shield.y} r={shield.radius} fill="#64748b" stroke="#ffffff" strokeWidth="2" />
      <text x={shield.x} y={shield.y + shield.shieldRadius + 14} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">
        🛡️ Shield Deflector
      </text>
    </g>
  );
}
