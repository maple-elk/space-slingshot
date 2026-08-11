import { describe, it } from 'vitest';
import { simulateTrajectory } from '../game/ai/trajectorySimulator';
import { DEFAULT_G } from '../utils/physics';

describe('Debug Gravity Level', () => {
  it('debugs trajectory hitting angles', () => {
    const gravityLevel = {
      ship: { x: 100, y: 300 },
      target: { x: 500, y: 300, radius: 24 },
      planets: [
        { id: 'p1', x: 300, y: 220, radius: 35, mass: 500, type: 'terrestrial' },
      ],
      blackHoles: [], asteroids: [], wormholes: [], pulsars: [], boosters: [], shields: [],
    };

    const hits = [];
    for (let a = 0; a < 360; a++) {
      for (let p = 10; p <= 80; p += 5) {
        const sim = simulateTrajectory({
          startPos: gravityLevel.ship,
          angleDeg: a,
          power: p,
          level: gravityLevel,
          gravityG: DEFAULT_G,
          maxFrames: 600,
          shooter: 'player',
        });
        if (sim.outcome === 'target') {
          hits.push({ angle: a, power: p, turn: sim.totalTurnDeg, minDist: sim.minDistance });
        }
      }
    }
    console.log('HITS FOUND:', hits.length, hits.slice(0, 5));
  });
});
