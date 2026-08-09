import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PlanetRenderer } from '../components/renderers/PlanetRenderer';
import { BlackHoleRenderer } from '../components/renderers/BlackHoleRenderer';
import { AsteroidRenderer } from '../components/renderers/AsteroidRenderer';
import { WormholeRenderer } from '../components/renderers/WormholeRenderer';
import { PulsarRenderer } from '../components/renderers/PulsarRenderer';
import { BoosterRenderer } from '../components/renderers/BoosterRenderer';
import { ShieldRenderer } from '../components/renderers/ShieldRenderer';
import { EnemyShipRenderer } from '../components/renderers/EnemyShipRenderer';
import { TargetRenderer } from '../components/renderers/TargetRenderer';
import { SpaceCanvas } from '../components/renderers/SpaceCanvas';

describe('SVG Renderer Components Structural Tests', () => {
  it('renders PlanetRenderer SVG markup correctly', () => {
    const planet = { id: 1, x: 200, y: 300, radius: 35, mass: 180, fill: '#3b82f6' };
    const html = renderToString(<svg><PlanetRenderer planet={planet} /></svg>);

    expect(html).toContain('cx="200"');
    expect(html).toContain('cy="300"');
    expect(html).toContain('M = ');
    expect(html).toContain('180');
    expect(html).toContain('fill="#3b82f6"');
  });

  it('renders BlackHoleRenderer SVG markup correctly', () => {
    const bh = { id: 'bh_1', x: 400, y: 250, eventRadius: 40, radius: 20 };
    const html = renderToString(<svg><BlackHoleRenderer blackHole={bh} /></svg>);

    expect(html).toContain('translate(400, 250)');
    expect(html).toContain('Event Horizon');
  });

  it('renders AsteroidRenderer SVG markup correctly', () => {
    const ast = { id: 'ast_1', x: 150, y: 200, radius: 36 };
    const html = renderToString(<svg><AsteroidRenderer asteroid={ast} /></svg>);

    expect(html).toContain('cx="150"');
    expect(html).toContain('cy="200"');
    expect(html).toContain('Asteroid Drag Cloud');
  });

  it('renders WormholeRenderer SVG markup correctly', () => {
    const wh = { id: 'portal_a', x: 300, y: 150, radius: 22, color: '#06b6d4' };
    const html = renderToString(<svg><WormholeRenderer wormhole={wh} /></svg>);

    expect(html).toContain('translate(300, 150)');
    expect(html).toContain('stroke="#06b6d4"');
  });

  it('renders PulsarRenderer SVG markup correctly', () => {
    const pul = { id: 'pul_1', x: 500, y: 400, radius: 24 };
    const html = renderToString(<svg><PulsarRenderer pulsar={pul} /></svg>);

    expect(html).toContain('Pulsar (Anti-Gravity)');
  });

  it('renders BoosterRenderer SVG markup correctly', () => {
    const b = { id: 'boost_1', x: 250, y: 350 };
    const html = renderToString(<svg><BoosterRenderer booster={b} /></svg>);

    expect(html).toContain('BOOST');
  });

  it('renders ShieldRenderer SVG markup correctly', () => {
    const sh = { id: 'sh_1', x: 450, y: 300, shieldRadius: 42, radius: 16 };
    const html = renderToString(<svg><ShieldRenderer shield={sh} /></svg>);

    expect(html).toContain('Shield Deflector');
  });

  it('renders EnemyShipRenderer active and disabled markup', () => {
    const activeEnemy = { id: 'enemy_1', x: 800, y: 300, radius: 20, status: 'active' };
    const activeHtml = renderToString(<svg><EnemyShipRenderer enemyShip={activeEnemy} /></svg>);
    expect(activeHtml).toContain('Enemy Interceptor');

    const disabledEnemy = { ...activeEnemy, status: 'disabled' };
    const disabledHtml = renderToString(<svg><EnemyShipRenderer enemyShip={disabledEnemy} /></svg>);
    expect(disabledHtml).toContain('Disabled');
  });

  it('renders TargetRenderer SVG markup correctly', () => {
    const target = { x: 900, y: 300, radius: 24 };
    const html = renderToString(<svg><TargetRenderer target={target} /></svg>);

    expect(html).toContain('translate(900, 300)');
  });

  it('renders net force vector F_net with subscript when showNetVector is true and force is significant', () => {
    const level = { ship: { x: 100, y: 300 }, target: { x: 900, y: 300, radius: 24 }, planets: [] };
    const html = renderToString(
      <SpaceCanvas
        viewBox={[0, 0, 960, 600]}
        level={level}
        angle={0}
        power={50}
        showNetVector={true}
        netMag={0.5}
        netVectorEnd={{ x: 150, y: 300 }}
        netP1={{ x: 140, y: 295 }}
        netP2={{ x: 140, y: 305 }}
        netLabelPos={{ x: 165, y: 300 }}
        individualVectors={[]}
      />
    );

    expect(html).toContain('net-force-vector');
    expect(html).toContain('F<tspan dy="2" font-size="9">net</tspan>');
  });

  it('does not render net force vector when netMag is under threshold (< 0.05)', () => {
    const level = { ship: { x: 100, y: 300 }, target: { x: 900, y: 300, radius: 24 }, planets: [] };
    const html = renderToString(
      <SpaceCanvas
        viewBox={[0, 0, 960, 600]}
        level={level}
        angle={0}
        power={50}
        showNetVector={true}
        netMag={0.01}
        netVectorEnd={{ x: 100, y: 300 }}
        netP1={{ x: 100, y: 300 }}
        netP2={{ x: 100, y: 300 }}
        netLabelPos={{ x: 100, y: 300 }}
        individualVectors={[]}
      />
    );

    expect(html).not.toContain('net-force-vector');
  });

  it('renders enemy path when enemy is active (fired trail or predicted path)', () => {
    const activeEnemyLevel = {
      ship: { x: 100, y: 300 },
      target: { x: 900, y: 300, radius: 24 },
      enemyShip: { id: 'e1', status: 'active', x: 800, y: 200, radius: 20 },
      planets: [],
    };
    const enemyTrail = [{ x: 800, y: 200 }, { x: 500, y: 250 }, { x: 100, y: 300 }];
    const htmlWithTrail = renderToString(
      <SpaceCanvas
        viewBox={[0, 0, 960, 600]}
        level={activeEnemyLevel}
        angle={0}
        power={50}
        enemyTrail={enemyTrail}
      />
    );

    expect(htmlWithTrail).toContain('stroke="#ef4444"');
    expect(htmlWithTrail).toContain('points="800,200 500,250 100,300"');

    const htmlWithPredicted = renderToString(
      <SpaceCanvas
        viewBox={[0, 0, 960, 600]}
        level={activeEnemyLevel}
        angle={0}
        power={50}
        enemyTrail={[]}
      />
    );

    expect(htmlWithPredicted).toContain('stroke="#ef4444"');
    expect(htmlWithPredicted).toContain('<polyline');
  });

  it('does not render enemy path when enemy ship is disabled', () => {
    const disabledEnemyLevel = {
      ship: { x: 100, y: 300 },
      target: { x: 900, y: 300, radius: 24 },
      enemyShip: { id: 'e1', status: 'disabled', x: 800, y: 200, radius: 20 },
      planets: [],
    };
    const html = renderToString(
      <SpaceCanvas
        viewBox={[0, 0, 960, 600]}
        level={disabledEnemyLevel}
        angle={0}
        power={50}
        enemyTrail={[{ x: 800, y: 200 }, { x: 500, y: 250 }]}
      />
    );

    expect(html).not.toContain('stroke="#ef4444"');
  });
});
