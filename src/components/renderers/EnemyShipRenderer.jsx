import React from 'react';

export function EnemyShipRenderer({ enemyShip }) {
  if (!enemyShip) return null;

  return (
    <g transform={`translate(${enemyShip.x}, ${enemyShip.y})`}>
      {enemyShip.status === 'active' ? (
        <>
          <circle r={enemyShip.radius + 8} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle r={enemyShip.radius} fill="rgba(239, 68, 68, 0.35)" stroke="#ef4444" strokeWidth="2.5" />
          <text textAnchor="middle" dy="5" fontSize="15">
            👾
          </text>
          <text y={enemyShip.radius + 16} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">
            Enemy Interceptor
          </text>
        </>
      ) : (
        <>
          <circle r={enemyShip.radius} fill="rgba(100, 116, 139, 0.4)" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
          <text textAnchor="middle" dy="5" fontSize="14" opacity="0.5">
            💥
          </text>
          <text y={enemyShip.radius + 14} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">
            Disabled
          </text>
        </>
      )}
    </g>
  );
}
