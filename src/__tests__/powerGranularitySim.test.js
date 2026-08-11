import { describe, it } from 'vitest';
import { generateRandomLevel, DEFAULT_G } from '../utils/physics';
import { simulateTrajectory } from '../game/ai/trajectorySimulator';

describe('Power Granularity Sensitivity Simulation', () => {
  it('Measures trajectory outcome sensitivity d(miss)/dP at low vs high powers', () => {
    const level = generateRandomLevel(960, 600, {
      seed: 101,
      planetCount: 3,
      enableBlackHoles: true,
    });

    console.log('\n======================================================');
    console.log('PART 1: TRAJECTORY SENSITIVITY d(minDist)/dP ACROSS POWER RANGES');
    console.log('======================================================');

    const anglesToTest = [0, 45, 90, 135, 180, 225, 270, 315];

    for (const angle of anglesToTest) {
      console.log(`\n--- Angle ${angle}° ---`);
      
      // Low Power Range (10 to 40 in steps of 2)
      let lowSensSum = 0;
      let lowSamples = 0;
      let prevDistLow = null;
      for (let p = 10; p <= 40; p += 2) {
        const sim = simulateTrajectory({
          startPos: level.ship,
          angleDeg: angle,
          power: p,
          level,
          gravityG: DEFAULT_G,
          maxFrames: 500,
          shooter: 'player',
        });
        if (prevDistLow !== null) {
          lowSensSum += Math.abs(sim.minDistance - prevDistLow) / 2.0; // px per power unit
          lowSamples++;
        }
        prevDistLow = sim.minDistance;
      }

      // High Power Range (50 to 80 in steps of 2)
      let highSensSum = 0;
      let highSamples = 0;
      let prevDistHigh = null;
      for (let p = 50; p <= 80; p += 2) {
        const sim = simulateTrajectory({
          startPos: level.ship,
          angleDeg: angle,
          power: p,
          level,
          gravityG: DEFAULT_G,
          maxFrames: 500,
          shooter: 'player',
        });
        if (prevDistHigh !== null) {
          highSensSum += Math.abs(sim.minDistance - prevDistHigh) / 2.0; // px per power unit
          highSamples++;
        }
        prevDistHigh = sim.minDistance;
      }

      const avgLowSens = lowSamples > 0 ? (lowSensSum / lowSamples).toFixed(2) : 0;
      const avgHighSens = highSamples > 0 ? (highSensSum / highSamples).toFixed(2) : 0;

      console.log(`Angle ${angle.toString().padStart(3)}° | Low Power Sensitivity (10-40): ${avgLowSens} px/P | High Power Sensitivity (50-80): ${avgHighSens} px/P`);
    }

    console.log('\n======================================================');
    console.log('PART 2: COMPARISON OF POWER SAMPLING DISTRIBUTIONS');
    console.log('======================================================');

    // Test across 50 random level seeds
    let linearHits = 0;
    let quadraticHits = 0; // dense at high power
    let logHits = 0;       // dense at low power
    const numSeeds = 30;

    for (let seed = 1; seed <= numSeeds; seed++) {
      const sampleLevel = generateRandomLevel(960, 600, { seed, planetCount: 3 });

      // Scheme 1: Uniform Linear (8 steps: 10, 20, 30, 40, 50, 60, 70, 80)
      const linearPowers = [10, 20, 30, 40, 50, 60, 70, 80];
      for (let a = 0; a < 360; a += 5) {
        for (const p of linearPowers) {
          const sim = simulateTrajectory({ startPos: sampleLevel.ship, angleDeg: a, power: p, level: sampleLevel, gravityG: DEFAULT_G, maxFrames: 450, shooter: 'player' });
          if (sim.outcome === 'target') linearHits++;
        }
      }

      // Scheme 2: Dense at High Power (8 steps: 10, 25, 40, 52, 62, 70, 76, 80)
      const highDensePowers = [10, 25, 40, 52, 62, 70, 76, 80];
      for (let a = 0; a < 360; a += 5) {
        for (const p of highDensePowers) {
          const sim = simulateTrajectory({ startPos: sampleLevel.ship, angleDeg: a, power: p, level: sampleLevel, gravityG: DEFAULT_G, maxFrames: 450, shooter: 'player' });
          if (sim.outcome === 'target') quadraticHits++;
        }
      }

      // Scheme 3: Dense at Low Power (8 steps: 10, 14, 20, 28, 38, 50, 64, 80)
      const lowDensePowers = [10, 14, 20, 28, 38, 50, 64, 80];
      for (let a = 0; a < 360; a += 5) {
        for (const p of lowDensePowers) {
          const sim = simulateTrajectory({ startPos: sampleLevel.ship, angleDeg: a, power: p, level: sampleLevel, gravityG: DEFAULT_G, maxFrames: 450, shooter: 'player' });
          if (sim.outcome === 'target') logHits++;
        }
      }
    }

    console.log(`Uniform Linear Powers (8 steps)  -> Hits Found across 30 seeds: ${linearHits}`);
    console.log(`High-Power Dense (8 steps)      -> Hits Found across 30 seeds: ${quadraticHits}`);
    console.log(`Low-Power Dense (8 steps)       -> Hits Found across 30 seeds: ${logHits}`);
    console.log('======================================================\n');
  });
});
