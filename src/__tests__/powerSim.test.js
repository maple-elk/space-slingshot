import { describe, it } from 'vitest';
import { generateRandomLevel, DEFAULT_G } from '../utils/physics';
import { simulateTrajectory } from '../game/ai/trajectorySimulator';

describe('Power & Solver Efficiency Simulation Suite', () => {
  it('Evaluates Max Power Reach, Deflection, Solvability & Solver Performance', { timeout: 60000 }, () => {
    const powersToTest = [40, 60, 80, 100, 150, 200];
    const boardWidth = 960;
    const boardHeight = 600;

    console.log('\n======================================================');
    console.log('PART 1: POWER VS DEFLECTION AROUND A PLANET');
    console.log('======================================================');

    const testPlanet = { x: 480, y: 300, radius: 45, mass: 350 };
    const levelWithPlanet = {
      ship: { x: 200, y: 300 },
      target: { x: 760, y: 300, radius: 24 },
      planets: [testPlanet],
      blackHoles: [], asteroids: [], wormholes: [], pulsars: [], boosters: [], shields: [],
    };

    for (const p of powersToTest) {
      // Launch slightly above planet to curve around it
      const sim = simulateTrajectory({
        startPos: levelWithPlanet.ship,
        angleDeg: 340, // 20 deg upward angle
        power: p,
        level: levelWithPlanet,
        gravityG: DEFAULT_G,
        maxFrames: 600,
        shooter: 'player',
      });

      console.log(`Power ${p.toString().padStart(3)} | Turn Deg: ${sim.totalTurnDeg.toFixed(1)}° | Min Dist to Target: ${sim.minDistance.toFixed(1)}px | Outcome: ${sim.outcome}`);
    }

    console.log('\n======================================================');
    console.log('PART 2: SOLVABILITY & AVERAGE SOLUTION WINDOWS');
    console.log('======================================================');

    for (const pMax of powersToTest) {
      let solvableCount = 0;
      let totalSolutionHits = 0;
      let totalTurnSum = 0;
      const numSeeds = 10;

      for (let seed = 1; seed <= numSeeds; seed++) {
        const level = generateRandomLevel(boardWidth, boardHeight, {
          seed,
          planetCount: 3,
          enableBlackHoles: seed % 2 === 0,
        });

        let levelHits = 0;
        for (let a = 0; a < 360; a += 2) { // 180 angle steps
          for (let p = 15; p <= pMax; p += Math.max(10, pMax / 5)) {
            const sim = simulateTrajectory({
              startPos: level.ship,
              angleDeg: a,
              power: p,
              level,
              gravityG: DEFAULT_G,
              maxFrames: 600,
              shooter: 'player',
            });
            if (sim.outcome === 'target') {
              levelHits++;
              totalTurnSum += sim.totalTurnDeg;
            }
          }
        }

        if (levelHits > 0) {
          solvableCount++;
          totalSolutionHits += levelHits;
        }
      }

      const avgHitsPerSolvableLevel = solvableCount > 0 ? (totalSolutionHits / solvableCount).toFixed(1) : 0;
      const avgTurn = totalSolutionHits > 0 ? (totalTurnSum / totalSolutionHits).toFixed(1) : 0;
      console.log(`Max Power ${pMax.toString().padStart(3)} | Solvable: ${solvableCount}/${numSeeds} (${(solvableCount/numSeeds*100).toFixed(0)}%) | Avg Hits/Level: ${avgHitsPerSolvableLevel} | Avg Solution Turn: ${avgTurn}°`);
    }

    console.log('\n======================================================');
    console.log('PART 3: SOLVER EFFICIENCY - FULL GRID VS ADAPTIVE SOLVER');
    console.log('======================================================');

    const sampleLevel = generateRandomLevel(boardWidth, boardHeight, {
      seed: 42,
      planetCount: 4,
      enableBlackHoles: true,
      enableAsteroids: true,
    });

    const targetPowerMax = 80;

    // Strategy A: Brute Force 360 angle steps x 10 power steps = 3,600 sims
    const t0 = performance.now();
    let countA = 0;
    for (let a = 0; a < 360; a += 1) {
      for (let p = 10; p <= targetPowerMax; p += (targetPowerMax / 10)) {
        const sim = simulateTrajectory({
          startPos: sampleLevel.ship,
          angleDeg: a,
          power: p,
          level: sampleLevel,
          gravityG: DEFAULT_G,
          maxFrames: 500,
          shooter: 'player',
        });
        if (sim.outcome === 'target') countA++;
      }
    }
    const durationA = performance.now() - t0;

    // Strategy B: Two-Pass Coarse-to-Fine (72 coarse angle steps -> 1 deg fine refinement around candidates)
    const t1 = performance.now();
    let countB = 0;
    let totalSimsB = 0;
    const coarseAngleStep = 5;
    const candidateAngleRanges = new Set();

    for (let a = 0; a < 360; a += coarseAngleStep) {
      for (let p = 10; p <= targetPowerMax; p += (targetPowerMax / 4)) {
        totalSimsB++;
        const sim = simulateTrajectory({
          startPos: sampleLevel.ship,
          angleDeg: a,
          power: p,
          level: sampleLevel,
          gravityG: DEFAULT_G,
          maxFrames: 500,
          shooter: 'player',
        });
        if (sim.outcome === 'target' || sim.minDistance < 70) {
          for (let subA = a - 4; subA <= a + 4; subA++) {
            candidateAngleRanges.add((subA + 360) % 360);
          }
        }
      }
    }

    for (const fineA of candidateAngleRanges) {
      for (let p = 10; p <= targetPowerMax; p += (targetPowerMax / 10)) {
        totalSimsB++;
        const sim = simulateTrajectory({
          startPos: sampleLevel.ship,
          angleDeg: fineA,
          power: p,
          level: sampleLevel,
          gravityG: DEFAULT_G,
          maxFrames: 500,
          shooter: 'player',
        });
        if (sim.outcome === 'target') countB++;
      }
    }
    const durationB = performance.now() - t1;

    console.log(`Full 360x10 Grid (3600 sims): Time = ${durationA.toFixed(2)}ms | Hits Found = ${countA}`);
    console.log(`Adaptive Two-Pass (${totalSimsB} sims): Time = ${durationB.toFixed(2)}ms | Hits Found = ${countB} | Speedup = ${(durationA / durationB).toFixed(2)}x`);
    console.log('======================================================\n');
  });
});
