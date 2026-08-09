import React from 'react';

export function BoosterRenderer({ booster }) {
  return (
    <g transform={`translate(${booster.x}, ${booster.y})`}>
      <polygon points="0,-26 22,-13 22,13 0,26 -22,13 -22,-13" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="2.5" />
      <text textAnchor="middle" dy="4" fill="#4ade80" fontSize="11" fontWeight="800">
        🚀 BOOST
      </text>
    </g>
  );
}
