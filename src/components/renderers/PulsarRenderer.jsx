import React from 'react';

export function PulsarRenderer({ pulsar }) {
  return (
    <g transform={`translate(${pulsar.x}, ${pulsar.y})`}>
      <circle r={pulsar.radius + 12} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="360"
          to="0"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle r={pulsar.radius} fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
      <text textAnchor="middle" dy="4" fontSize="14">
        ⚡
      </text>
      <text y={pulsar.radius + 16} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">
        Pulsar (Anti-Gravity)
      </text>
    </g>
  );
}
