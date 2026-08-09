import React from 'react';
import { PlanetRenderer } from './PlanetRenderer';
import { BlackHoleRenderer } from './BlackHoleRenderer';
import { AsteroidRenderer } from './AsteroidRenderer';
import { WormholeRenderer } from './WormholeRenderer';
import { PulsarRenderer } from './PulsarRenderer';
import { BoosterRenderer } from './BoosterRenderer';
import { ShieldRenderer } from './ShieldRenderer';
import { EnemyShipRenderer } from './EnemyShipRenderer';
import { TargetRenderer } from './TargetRenderer';

/**
 * SVG Space Viewport Canvas Component
 */
export function SpaceCanvas({
  svgRef,
  viewBox,
  level,
  angle,
  power,
  isSimulating,
  turnOwner,
  roundCompleted,
  gameStatus,
  showGravityGradients,
  showGravityVectors,
  showNetVector,
  displayedPastTrails = [],
  enemyAimInfo,
  enemyTrail = [],
  enemyProjectilePos,
  projectilePos,
  projectileVel,
  projectileAccel,
  trail = [],
  individualVectors = [],
  netMag,
  netVectorEnd,
  netP1,
  netP2,
  netLabelPos,
  handlePointerMove,
  handlePointerUp,
  handlePointerDown,
} = {}) {
  const {
    ship,
    target,
    planets = [],
    blackHoles = [],
    asteroids = [],
    wormholes = [],
    pulsars = [],
    boosters = [],
    shields = [],
    enemyShip,
  } = level;

  // Aiming vector end point in SVG
  const rad = (angle * Math.PI) / 180;
  const aimLength = power * 1.7;
  const aimVectorEnd = {
    x: ship.x + aimLength * Math.cos(rad),
    y: ship.y + aimLength * Math.sin(rad),
  };

  // Threat Arc Path for Enemy Aiming phase
  let enemyThreatArcPath = '';
  if (enemyShip && enemyAimInfo && gameStatus === 'enemy_aiming') {
    const eRad = (enemyAimInfo.angleDeg * Math.PI) / 180;
    const spread = 0.35;
    const r = 160;
    const x1 = enemyShip.x + r * Math.cos(eRad - spread);
    const y1 = enemyShip.y + r * Math.sin(eRad - spread);
    const x2 = enemyShip.x + r * Math.cos(eRad + spread);
    const y2 = enemyShip.y + r * Math.sin(eRad + spread);
    enemyThreatArcPath = `M ${enemyShip.x} ${enemyShip.y} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  }

  const currentPos = projectilePos || ship;

  return (
    <svg
      ref={svgRef}
      className="svg-viewport space-viewport"
      viewBox={viewBox.join(' ')}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <defs>
        <radialGradient id="spaceBg" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        {planets.map((planet) => (
          <radialGradient key={planet.id} id={`gravGrad_${planet.id}`}>
            <stop offset="0%" stopColor={planet.fill} stopOpacity="0.45" />
            <stop offset="50%" stopColor={planet.fill} stopOpacity="0.18" />
            <stop offset="100%" stopColor={planet.fill} stopOpacity="0.0" />
          </radialGradient>
        ))}

        <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="targetGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Infinite Space Backdrop */}
      <rect
        x={viewBox[0] - 20000}
        y={viewBox[1] - 20000}
        width={viewBox[2] + 40000}
        height={viewBox[3] + 40000}
        fill="url(#spaceBg)"
      />

      {/* Gravity Field Gradients */}
      {showGravityGradients &&
        planets.map((planet) => (
          <circle
            key={`grad_${planet.id}`}
            cx={planet.x}
            cy={planet.y}
            r={planet.radius * 2.9}
            fill={`url(#gravGrad_${planet.id})`}
            style={{ pointerEvents: 'none' }}
          />
        ))}

      {/* Historical Past Shot Trails */}
      {displayedPastTrails.map((past, idx) => {
        if (!past.points || past.points.length === 0) return null;
        const color =
          past.status === 'hit_target'
            ? '#4ade80'
            : past.status === 'hit_enemy'
            ? '#ec4899'
            : past.status === 'black_hole'
            ? '#f97316'
            : past.status === 'hit_planet'
            ? '#f87171'
            : '#cbd5e1';

        const endPt = past.points[past.points.length - 1];
        const labelText = `#${past.shotNumber || idx + 1}`;

        return (
          <g key={past.id || idx}>
            <polyline
              points={past.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              opacity={past.opacity}
            />
            {endPt && (
              <g transform={`translate(${endPt.x}, ${endPt.y})`} opacity={past.opacity}>
                <circle r="8" fill="rgba(15, 23, 42, 0.85)" stroke={color} strokeWidth="1.2" />
                <text
                  textAnchor="middle"
                  dy="3"
                  fill={color}
                  fontSize="8"
                  fontWeight="800"
                  fontFamily="sans-serif"
                >
                  {labelText}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Planets */}
      {planets.map((planet) => (
        <PlanetRenderer key={planet.id} planet={planet} />
      ))}

      {/* Black Holes */}
      {blackHoles.map((bh) => (
        <BlackHoleRenderer key={bh.id} blackHole={bh} />
      ))}

      {/* Asteroid Clouds */}
      {asteroids.map((ast) => (
        <AsteroidRenderer key={ast.id} asteroid={ast} />
      ))}

      {/* Wormholes */}
      {wormholes.map((wh) => (
        <WormholeRenderer key={wh.id} wormhole={wh} />
      ))}

      {/* Pulsars */}
      {pulsars.map((pul) => (
        <PulsarRenderer key={pul.id} pulsar={pul} />
      ))}

      {/* Boosters */}
      {boosters.map((b) => (
        <BoosterRenderer key={b.id} booster={b} />
      ))}

      {/* Shields */}
      {shields.map((sh) => (
        <ShieldRenderer key={sh.id} shield={sh} />
      ))}

      {/* Threat Arc */}
      {enemyThreatArcPath && (
        <path d={enemyThreatArcPath} fill="rgba(239, 68, 68, 0.16)" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
      )}

      {/* Enemy Ship */}
      <EnemyShipRenderer enemyShip={enemyShip} />

      {/* Enemy Trajectory & Projectile */}
      {enemyTrail.length > 1 && (
        <polyline
          points={enemyTrail.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#ef4444"
          strokeWidth="3.5"
          strokeDasharray="6 3"
          strokeLinecap="round"
          opacity="0.95"
        />
      )}

      {enemyProjectilePos && (
        <circle
          cx={enemyProjectilePos.x}
          cy={enemyProjectilePos.y}
          r="7"
          fill="#fef2f2"
          stroke="#ef4444"
          strokeWidth="3"
          filter="url(#planetGlow)"
        />
      )}

      {/* Target Station */}
      <TargetRenderer target={target} />

      {/* Aiming Vector Line & Drag Handle */}
      {!isSimulating && turnOwner === 'player' && !roundCompleted && (
        <g>
          <line
            x1={ship.x}
            y1={ship.y}
            x2={aimVectorEnd.x}
            y2={aimVectorEnd.y}
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
          <circle
            cx={aimVectorEnd.x}
            cy={aimVectorEnd.y}
            r="16"
            fill="rgba(245, 158, 11, 0.25)"
            stroke="#f59e0b"
            strokeWidth="2.5"
            style={{ cursor: 'grab' }}
            onPointerDown={handlePointerDown}
          />
          <circle
            cx={aimVectorEnd.x}
            cy={aimVectorEnd.y}
            r="6"
            fill="#f59e0b"
            style={{ pointerEvents: 'none' }}
          />
        </g>
      )}

      {/* Player Flying Projectile & Trail */}
      {trail.length > 1 && (
        <polyline
          points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      )}

      {projectilePos && (
        <circle
          cx={projectilePos.x}
          cy={projectilePos.y}
          r="7"
          fill="#ffffff"
          stroke="#38bdf8"
          strokeWidth="3"
          filter="url(#planetGlow)"
        />
      )}

      {/* Player Ship */}
      <g transform={`translate(${ship.x}, ${ship.y})`}>
        <circle r="18" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="2.5" />
        <polygon points="0,-10 8,8 -8,8" fill="#3b82f6" transform={`rotate(${angle + 90})`} />
      </g>

      {/* Individual Planet Gravity Force Vectors */}
      {showGravityVectors &&
        individualVectors.map((v, i) => {
          if (v.accelMag < 0.05) return null;
          const len = Math.max(12, Math.min(60, v.accelMag * 40));
          const vx = currentPos.x + len * Math.cos(v.angle);
          const vy = currentPos.y + len * Math.sin(v.angle);
          const textX = currentPos.x + (len + 12) * Math.cos(v.angle);
          const textY = currentPos.y + (len + 12) * Math.sin(v.angle);
          return (
            <g key={i}>
              <line
                x1={currentPos.x}
                y1={currentPos.y}
                x2={vx}
                y2={vy}
                stroke={v.planet.fill}
                strokeWidth="2"
                opacity="0.85"
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="central"
                fill={v.planet.fill}
                fontSize="10"
                fontWeight="700"
              >
                F{i + 1}
              </text>
            </g>
          );
        })}

      {/* Combined Net Gravity Vector (F_net) */}
      {showNetVector && netMag >= 0.05 && netVectorEnd && netP1 && netP2 && netLabelPos && (
        <g className="net-force-vector">
          <line
            x1={currentPos.x}
            y1={currentPos.y}
            x2={netVectorEnd.x}
            y2={netVectorEnd.y}
            stroke="#ffffff"
            strokeWidth="3"
            strokeDasharray="4 2"
          />
          <polygon
            points={`${netVectorEnd.x},${netVectorEnd.y} ${netP1.x},${netP1.y} ${netP2.x},${netP2.y}`}
            fill="#ffffff"
          />
          <g transform={`translate(${netLabelPos.x}, ${netLabelPos.y})`}>
            <rect
              x="-20"
              y="-11"
              width="40"
              height="21"
              rx="6"
              fill="rgba(15, 23, 42, 0.9)"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.2"
            />
            <text
              textAnchor="middle"
              dy="3.5"
              fill="#ffffff"
              fontSize="11"
              fontWeight="800"
              fontFamily="Fredoka, sans-serif"
            >
              F<tspan dy="2" fontSize="9">net</tspan>
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
