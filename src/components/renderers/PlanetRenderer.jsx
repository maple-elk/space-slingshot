import React from 'react';

/**
 * Planet SVG Renderer
 * @param {{planet: import('../../types/entitySchemas').Planet}} props 
 */
export function PlanetRenderer({ planet }) {
  return (
    <g>
      <circle
        cx={planet.x}
        cy={planet.y}
        r={planet.radius * 2.6}
        fill="none"
        stroke={planet.fill}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.35"
      />
      <circle
        cx={planet.x}
        cy={planet.y}
        r={planet.radius}
        fill={planet.fill}
        filter="url(#planetGlow)"
      />
      <circle
        cx={planet.x - planet.radius * 0.3}
        cy={planet.y - planet.radius * 0.3}
        r={planet.radius * 0.4}
        fill="rgba(255, 255, 255, 0.25)"
      />
      <text
        x={planet.x}
        y={planet.y + planet.radius + 16}
        textAnchor="middle"
        fill="rgba(241, 245, 249, 0.75)"
        fontSize="11"
        fontWeight="600"
      >
        M = {planet.mass}
      </text>
    </g>
  );
}
