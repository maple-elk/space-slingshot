import fs from 'fs';
import path from 'path';
import os from 'os';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';
import { generateRandomLevel } from '../src/utils/physics.js';
import { solveHyperGridTrajectories } from '../src/game/ai/levelSolver.js';

const __filename = fileURLToPath(import.meta.url);

const TIER_CONFIG = {
  level2: {
    name: 'Level 2 (Standard)',
    minScoreThreshold: 1.0,
    calculateScore: (analysis) => {
      const minTurnDeg = analysis.minTurnDeg || 0;
      const maxDistinctBodies = analysis.maxDistinctBodies || 0;
      const maxSolutionWindowDeg = Math.max(analysis.maxSolutionWindowDeg || 0.001, 0.001);
      const windowFactor = (maxSolutionWindowDeg >= 1.5 && maxSolutionWindowDeg <= 8.0) ? 2.5 : 1.0;
      return (maxDistinctBodies * 2.0) + (minTurnDeg / 90) + windowFactor;
    },
  },
  level3: {
    name: 'Level 3 (Hard)',
    minScoreThreshold: 1.5,
    calculateScore: (analysis) => {
      const minTurnDeg = analysis.minTurnDeg || 0;
      const maxDistinctBodies = analysis.maxDistinctBodies || 0;
      const maxSolutionWindowDeg = Math.max(analysis.maxSolutionWindowDeg || 0.001, 0.001);
      return (minTurnDeg / 180) + (maxDistinctBodies * 1.5) + (5 / maxSolutionWindowDeg);
    },
  },
  level4: {
    name: 'Level 4 (Nightmare)',
    minScoreThreshold: 2.5,
    calculateScore: (analysis) => {
      const minTurnDeg = analysis.minTurnDeg || 0;
      const maxDistinctBodies = analysis.maxDistinctBodies || 0;
      const maxSolutionWindowDeg = Math.max(analysis.maxSolutionWindowDeg || 0.001, 0.001);
      return (minTurnDeg / 360) + maxDistinctBodies + (10 / maxSolutionWindowDeg);
    },
  },
  level5: {
    name: 'Level 5 (Singularity)',
    minScoreThreshold: 4.0,
    calculateScore: (analysis) => {
      const minTurnDeg = analysis.minTurnDeg || 0;
      const maxDistinctBodies = analysis.maxDistinctBodies || 0;
      const maxSolutionWindowDeg = Math.max(analysis.maxSolutionWindowDeg || 0.001, 0.001);
      return (minTurnDeg / 360) * 2.0 + (maxDistinctBodies * 2.0) + (20 / maxSolutionWindowDeg);
    },
  },
};

/**
 * Structural Dissimilarity Check: Ensures candidate map layout is visually
 * and positionally distinct from existing catalog presets.
 */
function isStructurallySimilar(candidate, catalog, minDistanceThreshold = 80) {
  for (const preset of catalog) {
    let pointDiffSum = 0;
    let pointCount = 0;

    if (preset.ship && candidate.ship) {
      pointDiffSum += Math.hypot(candidate.ship.x - preset.ship.x, candidate.ship.y - preset.ship.y);
      pointCount++;
    }
    if (preset.target && candidate.target) {
      pointDiffSum += Math.hypot(candidate.target.x - preset.target.x, candidate.target.y - preset.target.y);
      pointCount++;
    }

    const candPlanets = candidate.planets || [];
    const presPlanets = preset.planets || [];

    if (candPlanets.length === presPlanets.length) {
      for (let i = 0; i < candPlanets.length; i++) {
        pointDiffSum += Math.hypot(candPlanets[i].x - presPlanets[i].x, candPlanets[i].y - presPlanets[i].y);
        pointCount++;
      }
    } else {
      continue; // Different planet count -> distinctly different layout
    }

    const avgDist = pointCount > 0 ? pointDiffSum / pointCount : Infinity;
    if (avgDist < minDistanceThreshold) {
      return true; // Too similar!
    }
  }
  return false;
}

// WORKER THREAD LOGIC
if (!isMainThread) {
  const { startSeed, endSeed } = workerData;
  const minedResults = [];
  const telemetry = {
    totalEvaluated: 0,
    solvableCount: 0,
    criterionCounts: { turn_degree: 0, window_tightness: 0, body_interaction: 0, direct_sightline: 0 },
    windows: [],
    turns: [],
  };

  for (let seed = startSeed; seed <= endSeed; seed++) {
    telemetry.totalEvaluated++;

    const candidateLevel = generateRandomLevel(960, 600, {
      seed: seed * 10007 + 42,
      wildMix: true,
      bypassPresets: true,
    });

    if (!candidateLevel) continue;

    const analysis = solveHyperGridTrajectories(candidateLevel, {
      angleStep: 0.25,
      powerMin: 30,
      powerMax: 60,
      powerSteps: 16,
      maxFrames: 2000,
    });

    if (analysis.solutionCount === 0) continue;
    telemetry.solvableCount++;

    const crit = analysis.dominantCriterion || 'direct_sightline';
    telemetry.criterionCounts[crit] = (telemetry.criterionCounts[crit] || 0) + 1;
    telemetry.windows.push(analysis.maxSolutionWindowDeg || 0);
    telemetry.turns.push(analysis.minTurnDeg || 0);

    // Classify tier
    let evaluatedTier = 'level2';
    if (analysis.minTurnDeg > 360 && analysis.maxSolutionWindowDeg < 1.0 && (analysis.maxDistinctBodies || 0) >= 3) {
      evaluatedTier = 'level5';
    } else if (analysis.minTurnDeg > 360 || analysis.maxSolutionWindowDeg < 1.0) {
      evaluatedTier = 'level4';
    } else if (analysis.minTurnDeg > 180 || analysis.maxSolutionWindowDeg < 3.0) {
      evaluatedTier = 'level3';
    } else {
      evaluatedTier = 'level2';
    }

    if (!TIER_CONFIG[evaluatedTier]) continue;
    if ((evaluatedTier === 'level4' || evaluatedTier === 'level5') && analysis.hasDirectShot) continue;

    const tierCfg = TIER_CONFIG[evaluatedTier];
    const score = Number(tierCfg.calculateScore(analysis).toFixed(3));

    if (score < tierCfg.minScoreThreshold) continue;

    minedResults.push({
      seed,
      evaluatedTier,
      score,
      crit,
      analysis: {
        minTurnDeg: analysis.minTurnDeg,
        maxTurnDeg: analysis.maxTurnDeg,
        maxSolutionWindowDeg: analysis.maxSolutionWindowDeg,
        maxDistinctBodies: analysis.maxDistinctBodies,
        solutionCount: analysis.solutionCount,
      },
      candidateLevel,
    });
  }

  parentPort.postMessage({ minedResults, telemetry });
  process.exit(0);
}

// MAIN THREAD LOGIC
if (isMainThread) {
  const args = process.argv.slice(2);
  let targetCount = 50;
  let maxSeeds = 10000;
  let isStage1 = false;
  let outputDir = path.resolve('src/game/data');
  let devlogDir = path.resolve('../space-slingshot-devlog');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stage1') {
      isStage1 = true;
      maxSeeds = 500;
      targetCount = 20;
    } else if (args[i] === '--target' && args[i + 1]) {
      targetCount = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--max-seeds' && args[i + 1]) {
      maxSeeds = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--out-dir' && args[i + 1]) {
      outputDir = path.resolve(args[i + 1]);
      i++;
    }
  }

  const presetFiles = {
    level2: path.join(outputDir, 'presets_level2.json'),
    level3: path.join(outputDir, 'presets_level3.json'),
    level4: path.join(outputDir, 'presets_level4.json'),
    level5: path.join(outputDir, 'presets_level5.json'),
  };

  const catalogs = { level2: [], level3: [], level4: [], level5: [] };

  // Load existing catalogs
  for (const tier of ['level2', 'level3', 'level4', 'level5']) {
    const filePath = presetFiles[tier];
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) catalogs[tier] = parsed;
      } catch (err) {}
    }
  }

  const numCores = Math.max(1, os.cpus().length - 1);
  console.log(`\n🚀 Launching Multi-Core Bounded Hyper-Grid Golden Seed Mining Rig`);
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`Mode:                    ${isStage1 ? 'Stage 1 Subset' : 'Stage 2 Full Run'}`);
  console.log(`Worker Threads:          ${numCores} parallel cores`);
  console.log(`Power Range:             30 to 60 (Deflection-focused window)`);
  console.log(`Target Presets Per Tier: ${targetCount}`);
  console.log(`Max Candidate Seeds:     ${maxSeeds}`);
  console.log(`Output Directory:        ${outputDir}\n`);

  const chunkSize = Math.ceil(maxSeeds / numCores);
  let activeWorkers = numCores;
  let totalEvaluated = 0;
  let totalSolvable = 0;
  const combinedTelemetry = {
    totalEvaluated: 0,
    solvableCount: 0,
    criterionCounts: { turn_degree: 0, window_tightness: 0, body_interaction: 0, direct_sightline: 0 },
    windows: [],
    turns: [],
  };

  const handleWorkerResult = ({ minedResults, telemetry }) => {
    combinedTelemetry.totalEvaluated += telemetry.totalEvaluated;
    combinedTelemetry.solvableCount += telemetry.solvableCount;
    combinedTelemetry.windows.push(...telemetry.windows);
    combinedTelemetry.turns.push(...telemetry.turns);
    for (const k of Object.keys(telemetry.criterionCounts)) {
      combinedTelemetry.criterionCounts[k] = (combinedTelemetry.criterionCounts[k] || 0) + (telemetry.criterionCounts[k] || 0);
    }

    for (const res of minedResults) {
      const { seed, evaluatedTier, score, crit, analysis, candidateLevel } = res;
      const catalog = catalogs[evaluatedTier];
      const tierCfg = TIER_CONFIG[evaluatedTier];

      if (isStructurallySimilar(candidateLevel, catalog)) {
        continue; // Deduplicated for structural uniqueness!
      }

      const mapPreset = {
        ...candidateLevel,
        difficultyRating: {
          tier: evaluatedTier,
          solvable: true,
          compositeScore: score,
          minTurnDeg: analysis.minTurnDeg,
          maxTurnDeg: analysis.maxTurnDeg,
          maxSolutionWindowDeg: analysis.maxSolutionWindowDeg,
          distinctBodies: analysis.maxDistinctBodies,
          solutionCount: analysis.solutionCount,
          dominantCriterion: crit,
        },
      };

      catalog.push(mapPreset);
      catalog.sort((a, b) => (b.difficultyRating.compositeScore || 0) - (a.difficultyRating.compositeScore || 0));
      if (catalog.length > targetCount) {
        catalogs[evaluatedTier] = catalog.slice(0, targetCount);
      }

      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(presetFiles[evaluatedTier], JSON.stringify(catalogs[evaluatedTier], null, 2), 'utf-8');

      console.log(`[Worker Result] ✨ Mined ${tierCfg.name} Preset! Score: ${score} | MinTurn: ${analysis.minTurnDeg.toFixed(1)}° | Window: ${analysis.maxSolutionWindowDeg.toFixed(2)}° | Crit: ${crit}`);
    }
  };

  for (let c = 0; c < numCores; c++) {
    const startSeed = c * chunkSize + 1;
    const endSeed = Math.min((c + 1) * chunkSize, maxSeeds);

    const worker = new Worker(__filename, {
      workerData: { startSeed, endSeed },
    });

    worker.on('message', (data) => {
      handleWorkerResult(data);
    });

    worker.on('exit', () => {
      activeWorkers--;
      if (activeWorkers === 0) {
        onMiningComplete();
      }
    });
  }

  function onMiningComplete() {
    console.log(`\n================================================================================`);
    console.log(`🎉 Mining Complete across ${numCores} parallel worker threads!`);
    console.log(`Total Seeds Evaluated: ${combinedTelemetry.totalEvaluated}`);
    console.log(`Solvability Yield:     ${((combinedTelemetry.solvableCount / combinedTelemetry.totalEvaluated) * 100).toFixed(1)}%`);
    console.log(`Catalog Sizes:         Level 2: ${catalogs.level2.length} | Level 3: ${catalogs.level3.length} | Level 4: ${catalogs.level4.length} | Level 5: ${catalogs.level5.length}`);
    console.log(`================================================================================\n`);

    if (isStage1) {
      const avgWindow = combinedTelemetry.windows.length ? (combinedTelemetry.windows.reduce((a, b) => a + b, 0) / combinedTelemetry.windows.length).toFixed(2) : 0;
      const avgTurn = combinedTelemetry.turns.length ? (combinedTelemetry.turns.reduce((a, b) => a + b, 0) / combinedTelemetry.turns.length).toFixed(2) : 0;
      const solvabilityYield = ((combinedTelemetry.solvableCount / combinedTelemetry.totalEvaluated) * 100).toFixed(1);

      const report = `# Stage 1 Observability Report: Wild Candidate & Bounded Hyper-Grid Analysis

**Execution Date**: ${new Date().toISOString()}
**Candidate Seeds Evaluated**: ${combinedTelemetry.totalEvaluated}
**Power Window**: 30 to 60 (Deflection-focused)
**Hyper Grid Resolution**: 3,600 Angles (0.1°) x 16 Powers (Power range 30-60)

---

## 📊 High-Level Metrics
- **Solvability Yield**: ${solvabilityYield}% (${combinedTelemetry.solvableCount} / ${combinedTelemetry.totalEvaluated} maps solvable)
- **Average Solution Window ($\Delta \\theta$)**: ${avgWindow}°
- **Average Min Deflection Turn**: ${avgTurn}°

---

## 🔬 Dominant Difficulty Criterion Distribution
| Criterion | Count | Percentage |
| :--- | :--- | :--- |
| **Turn Degree ($\theta_{\\text{turn}} > 360^\\circ$)** | ${combinedTelemetry.criterionCounts.turn_degree || 0} | ${(((combinedTelemetry.criterionCounts.turn_degree || 0) / combinedTelemetry.solvableCount) * 100).toFixed(1)}% |
| **Solution Window Tightness ($\Delta \\theta < 2.0^\\circ$)** | ${combinedTelemetry.criterionCounts.window_tightness || 0} | ${(((combinedTelemetry.criterionCounts.window_tightness || 0) / combinedTelemetry.solvableCount) * 100).toFixed(1)}% |
| **Multi-Body Interaction ($\ge 4$ celestial bodies)** | ${combinedTelemetry.criterionCounts.body_interaction || 0} | ${(((combinedTelemetry.criterionCounts.body_interaction || 0) / combinedTelemetry.solvableCount) * 100).toFixed(1)}% |
| **Direct Sightline Availability** | ${combinedTelemetry.criterionCounts.direct_sightline || 0} | ${(((combinedTelemetry.criterionCounts.direct_sightline || 0) / combinedTelemetry.solvableCount) * 100).toFixed(1)}% |

---

## 🏆 Current Mined Catalog Sizes
- **Level 2 (Standard)**: ${catalogs.level2.length} presets
- **Level 3 (Hard)**: ${catalogs.level3.length} presets
- **Level 4 (Nightmare)**: ${catalogs.level4.length} presets
- **Level 5 (Singularity)**: ${catalogs.level5.length} presets
`;

      fs.mkdirSync(devlogDir, { recursive: true });
      const reportPath = path.join(devlogDir, 'stage1_observability_report.md');
      fs.writeFileSync(reportPath, report, 'utf-8');
    }
  }
}
