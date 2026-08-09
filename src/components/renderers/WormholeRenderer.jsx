import React from 'react';

export function WormholeRenderer({ wormhole }) {
  return (
    <g transform={`translate(${wormhole.x}, ${wormhole.y})`}>
      <circle r={wormhole.radius + 8} fill="none" stroke={wormhole.color} strokeWidth="2" strokeDasharray="4 4">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="360"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      <circle r={wormhole.radius} fill={`${wormhole.color}44`} stroke={wormhole.color} strokeWidth="3" />
      <text textAnchor="middle" dy="4" fontSize="14">
        🌀
      </text>
    </g>
  );
}
