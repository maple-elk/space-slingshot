import React from 'react';

export function EnemyShipRenderer({ enemyShip, p2Angle = 155, isDuel = false }) {
  if (!enemyShip) return null;

  const isPlayer2 = isDuel || enemyShip.name === 'Player 2 Ship';

  if (isPlayer2) {
    return (
      <g transform={`translate(${enemyShip.x}, ${enemyShip.y})`}>
        {enemyShip.status === 'active' ? (
          <>
            <circle r="18" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="2.5" />
            <polygon points="0,-10 8,8 -8,8" fill="#ef4444" transform={`rotate(${p2Angle + 90})`} />
            <text y="32" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="800" letterSpacing="0.5px">
              Player 2
            </text>
          </>
        ) : (
          <>
            <circle r="18" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
            <text textAnchor="middle" dy="4" fontSize="14">💥</text>
            <text y="30" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">
              Player 2 (Hit)
            </text>
          </>
        )}
      </g>
    );
  }

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
