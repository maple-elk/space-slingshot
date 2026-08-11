import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { runMapBenchmarkSuite, calculateStats } from './benchmarkRunner.js';
import { DIFFICULTY_TIERS } from './levelSolver.js';

const __filename = fileURLToPath(import.meta.url);

if (!isMainThread) {
  // Worker Thread Execution Logic
  const options = workerData;
  const workerResults = runMapBenchmarkSuite(options);
  parentPort.postMessage(workerResults);
}

/**
 * Runs a multi-threaded parallel map benchmark suite across worker threads.
 *
 * @param {Object} [options]
 * @param {number} [options.seedsPerTier=100]
 * @param {string[]} [options.tiers]
 * @param {number} [options.numWorkers] Defaults to CPU core count
 * @returns {Promise<Object>} Combined suite results
 */
export async function runParallelMapBenchmarkSuite(options = {}) {
  const {
    seedsPerTier = 100,
    tiers = ['level1', 'level2', 'level3', 'level4'],
    numWorkers = Math.min(os.cpus().length || 4, 8),
    startSeed = 1000,
  } = options;

  const seedsPerWorker = Math.max(1, Math.floor(seedsPerTier / numWorkers));
  const workerPromises = [];
  const suiteStartTime = performance.now();

  for (let w = 0; w < numWorkers; w++) {
    const workerStartSeed = startSeed + w * seedsPerWorker;
    const isLastWorker = w === numWorkers - 1;
    const workerSeedsCount = isLastWorker
      ? seedsPerTier - w * seedsPerWorker
      : seedsPerWorker;

    if (workerSeedsCount <= 0) continue;

    const workerOptions = {
      ...options,
      seedsPerTier: workerSeedsCount,
      startSeed: workerStartSeed,
    };

    const p = new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: workerOptions,
      });

      worker.on('message', (data) => resolve(data));
      worker.on('error', (err) => reject(err));
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });

    workerPromises.push(p);
  }

  const workerResultsArray = await Promise.all(workerPromises);

  // Merge records from all worker threads
  const combinedRecords = [];
  const combinedConfusionMatrix = {};
  const combinedTierStats = {};

  tiers.forEach((t) => {
    combinedConfusionMatrix[t] = { level1: 0, level2: 0, level3: 0, level4: 0, unrated: 0 };
  });

  workerResultsArray.forEach((wRes) => {
    combinedRecords.push(...wRes.records);

    // Merge confusion matrix
    Object.keys(wRes.confusionMatrix).forEach((reqTier) => {
      if (!combinedConfusionMatrix[reqTier]) {
        combinedConfusionMatrix[reqTier] = { level1: 0, level2: 0, level3: 0, level4: 0, unrated: 0 };
      }
      Object.keys(wRes.confusionMatrix[reqTier]).forEach((evalTier) => {
        combinedConfusionMatrix[reqTier][evalTier] =
          (combinedConfusionMatrix[reqTier][evalTier] || 0) +
          wRes.confusionMatrix[reqTier][evalTier];
      });
    });
  });

  // Re-calculate aggregations per tier across all combined records
  tiers.forEach((reqTier) => {
    const tierRecords = combinedRecords.filter((r) => r.requestedTier === reqTier);
    const totalEval = tierRecords.length;

    const solvableCount = tierRecords.filter((r) => r.solvable).length;
    const tierMatchCount = tierRecords.filter((r) => r.isTierMatch).length;
    const humanPlayableCount = tierRecords.filter((r) => r.isHumanPlayable).length;
    const gravityMandatedCount = tierRecords.filter((r) => r.isGravityMandated).length;
    const orbit3600Count = tierRecords.filter((r) => r.has3600Orbit).length;

    const windowStats = calculateStats(tierRecords.map((r) => r.maxSolutionWindowDeg));
    const genTimeStats = calculateStats(tierRecords.map((r) => r.genTimeMs));
    const turnStats = calculateStats(tierRecords.map((r) => r.minTurnDeg));
    const jitterStats = calculateStats(tierRecords.map((r) => r.jitterIndex || 0));
    const playerWinStats = calculateStats(tierRecords.map((r) => r.playerWinRatePct || 0));
    const chaosStats = calculateStats(tierRecords.map((r) => r.chaosLyapunovIndex || 0));

    combinedTierStats[reqTier] = {
      requestedTier: reqTier,
      label: DIFFICULTY_TIERS[reqTier]?.label || reqTier,
      totalEvaluated: totalEval,
      solvableYieldPct: totalEval > 0 ? Number(((solvableCount / totalEval) * 100).toFixed(1)) : 0,
      tierMatchAccuracyPct: totalEval > 0 ? Number(((tierMatchCount / totalEval) * 100).toFixed(1)) : 0,
      humanPlayablePct: totalEval > 0 ? Number(((humanPlayableCount / totalEval) * 100).toFixed(1)) : 0,
      gravityMandatedPct: totalEval > 0 ? Number(((gravityMandatedCount / totalEval) * 100).toFixed(1)) : 0,
      orbit3600Count,
      avgChaosLyapunovIndex: chaosStats.mean,
      avgHumanPlayabilityIndex: jitterStats.mean,
      avgPlayerWinRatePct: playerWinStats.mean,
      windowStats,
      genTimeStats,
      turnStats,
    };
  });

  // Calculate Exotic Object Permutation Telemetry
  const combinedPermutationTelemetry = {};
  const permGroups = {};
  combinedRecords.forEach((r) => {
    const k = r.objectPermutationKey || 'Planet';
    if (!permGroups[k]) permGroups[k] = [];
    permGroups[k].push(r);
  });

  Object.keys(permGroups).forEach((k) => {
    const group = permGroups[k];
    const solvableCount = group.filter((r) => r.solvable).length;
    const windows = group.map((r) => r.maxSolutionWindowDeg);
    const turns = group.map((r) => r.minTurnDeg);
    const chaos = group.map((r) => r.chaosLyapunovIndex);

    combinedPermutationTelemetry[k] = {
      permutationKey: k,
      count: group.length,
      solvableYieldPct: Number(((solvableCount / group.length) * 100).toFixed(1)),
      avgWindowDeg: calculateStats(windows).mean,
      avgMinTurnDeg: calculateStats(turns).mean,
      avgChaosIndex: calculateStats(chaos).mean,
    };
  });

  const totalSuiteTimeMs = performance.now() - suiteStartTime;
  const overallSolvable = combinedRecords.filter((r) => r.solvable).length;
  const overallMatches = combinedRecords.filter((r) => r.isTierMatch).length;
  const total3600Orbits = combinedRecords.filter((r) => r.has3600Orbit).length;

  return {
    timestamp: new Date().toISOString(),
    totalMaps: combinedRecords.length,
    seedsPerTier,
    total3600Orbits,
    isDeep: Boolean(options.deep || options.deepSearch || options.hyperResolution),
    isExhaustive: Boolean(options.exhaustive),
    isStressTest: Boolean(options.unconstrainedStressTest || options.stressTest),
    numWorkers,
    totalSuiteTimeMs: Number(totalSuiteTimeMs.toFixed(2)),
    avgTimePerMapMs: Number((totalSuiteTimeMs / (combinedRecords.length || 1)).toFixed(2)),
    overallSolvableYieldPct: combinedRecords.length > 0 ? Number(((overallSolvable / combinedRecords.length) * 100).toFixed(1)) : 0,
    overallTierMatchPct: combinedRecords.length > 0 ? Number(((overallMatches / combinedRecords.length) * 100).toFixed(1)) : 0,
    tierStats: combinedTierStats,
    permutationTelemetry: combinedPermutationTelemetry,
    confusionMatrix: combinedConfusionMatrix,
    records: combinedRecords,
  };
}
