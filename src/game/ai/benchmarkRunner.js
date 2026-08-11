import { generateRandomLevel, DEFAULT_G } from '../../utils/physics.js';
import { evaluateMapDifficulty, analyzeLevelSolutions, solveExhaustiveTrajectories, DIFFICULTY_TIERS } from './levelSolver.js';
import { analyzeJitterSensitivity } from './jitterSensitivityAnalyzer.js';
import { evaluateCombatBalance } from './combatSimulator.js';
import { analyzeOrbitComplexity } from './orbitComplexityAnalyzer.js';

/**
 * Extracts unique exotic and space object type tags present in a level.
 * @param {import('../../types/entitySchemas').Level} level 
 * @returns {string[]} Alphabetically sorted array of object types
 */
export function getObjectPermutation(level) {
  if (!level) return [];
  const set = new Set();
  if (level.planets && level.planets.length > 0) set.add('Planet');
  if (level.blackHoles && level.blackHoles.length > 0) set.add('BlackHole');
  if (level.asteroids && level.asteroids.length > 0) set.add('AsteroidCloud');
  if (level.wormholes && level.wormholes.length > 0) set.add('WormholePortal');
  if (level.pulsars && level.pulsars.length > 0) set.add('Pulsar');
  if (level.boosters && level.boosters.length > 0) set.add('BoosterGate');
  if (level.shields && level.shields.length > 0) set.add('ShieldMoon');
  if (level.enemyShip && level.enemyShip.status === 'active') set.add('EnemyShip');
  return Array.from(set).sort();
}

/**
 * Calculates statistical metrics (Mean, Median, P95, Min, Max) for an array of numbers.
 * @param {number[]} values 
 * @returns {{ mean: number, median: number, p95: number, min: number, max: number }}
 */
export function calculateStats(values) {
  const valid = (values || []).filter((v) => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) {
    return { mean: 0, median: 0, p95: 0, min: 0, max: 0 };
  }
  const sorted = [...valid].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95Idx = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);
  const p95 = sorted[p95Idx];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  return {
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
  };
}

/**
 * Executes a full Monte Carlo benchmark sweep across specified difficulty tiers and seeds.
 *
 * @param {Object} [options]
 * @param {number} [options.seedsPerTier=100] Number of seeds per tier to evaluate
 * @param {string[]} [options.tiers] Tiers to evaluate (default 4 tiers)
 * @param {number} [options.gravityG=DEFAULT_G] Gravity constant
 * @param {number} [options.boardWidth=960] Board width
 * @param {number} [options.boardHeight=600] Board height
 * @param {number} [options.startSeed=1000] Starting seed offset
 * @param {boolean} [options.includeAdvancedAnalytics=true] Whether to run jitter & combat analysis
 * @param {boolean} [options.deep=false] Whether to run deep search (2500 frames, 0.05deg hyper-resolution)
 * @param {boolean} [options.exhaustive=false] Un-pruned brute force grid simulation (0.1deg steps)
 * @param {boolean} [options.unconstrainedStressTest=false] Bypass generator rejection retries
 * @param {number} [options.stage=0] Checkpoint stage (0 = all, 1 = first half, 2 = second half)
 * @returns {Object} Suite results including raw records, per-tier stats, permutation telemetry, and confusion matrix
 */
export function runMapBenchmarkSuite(options = {}) {
  const {
    seedsPerTier = 100,
    tiers = ['level1', 'level2', 'level3', 'level4'],
    gravityG = DEFAULT_G,
    boardWidth = 960,
    boardHeight = 600,
    startSeed = 1000,
    includeAdvancedAnalytics = true,
    deep = false,
    exhaustive = false,
    unconstrainedStressTest = false,
    stage = 0,
  } = options;

  const isDeep = Boolean(deep || options.deepSearch || options.hyperResolution);
  const isExhaustive = Boolean(exhaustive);
  const isStressTest = Boolean(unconstrainedStressTest || options.stressTest);
  const maxFrames = isDeep || isExhaustive ? 2500 : (options.maxFrames || 600);

  let seedOffset = 0;
  let runSeedsPerTier = seedsPerTier;

  if (stage === 1) {
    seedOffset = 0;
    runSeedsPerTier = Math.max(1, Math.floor(seedsPerTier / 2));
  } else if (stage === 2) {
    seedOffset = Math.floor(seedsPerTier / 2);
    runSeedsPerTier = seedsPerTier - seedOffset;
  }

  const records = [];
  const confusionMatrix = {};
  const tierStats = {};

  tiers.forEach((t) => {
    confusionMatrix[t] = {};
    tiers.forEach((t2) => {
      confusionMatrix[t][t2] = 0;
    });
    confusionMatrix[t]['unrated'] = 0;
  });

  const suiteStartTime = performance.now();

  tiers.forEach((reqTier) => {
    const tierRecords = [];

    for (let i = 0; i < runSeedsPerTier; i++) {
      const seed = startSeed + seedOffset + i;
      const t0 = performance.now();

      const level = generateRandomLevel(boardWidth, boardHeight, {
        seed,
        difficultyTier: reqTier,
        gravityG,
        enableEnemyShip: true,
        unconstrainedStressTest: isStressTest,
      });

      const genTimeMs = performance.now() - t0;
      const solverOpts = { gravityG, maxFrames, hyperResolution: isDeep, deepSearch: isDeep, exhaustive: isExhaustive };

      const analysis = isExhaustive
        ? solveExhaustiveTrajectories(level, solverOpts)
        : analyzeLevelSolutions(level, solverOpts);

      const rating = evaluateMapDifficulty(level, solverOpts);

      const evalTier = rating ? rating.tier : 'unrated';
      const solvable = rating ? rating.solvable : false;
      const maxWindow = rating ? rating.maxSolutionWindowDeg : 0;
      const minTurn = rating ? rating.minTurnDeg : 0;
      const maxTurn = rating ? rating.maxTurnDeg : 0;
      const maxLoops = rating ? rating.maxLoops : 0;
      const hasDirectShot = rating ? rating.hasDirectShot : false;
      const isGravityMandated = rating ? rating.isGravityMandated : false;
      const maxOrbitalTurnsDeg = rating ? rating.maxOrbitalTurnsDeg : 0;
      const isTierMatch = evalTier === reqTier;
      const isHumanPlayable = maxWindow >= 0.25;

      const permArray = getObjectPermutation(level);
      const permKey = permArray.join('+') || 'Planet';

      let jitter = null;
      let combat = null;
      let orbitComplexity = null;

      if (solvable) {
        orbitComplexity = analyzeOrbitComplexity(level, analysis.solutions, { gravityG, maxFrames });
      }

      if (includeAdvancedAnalytics && solvable) {
        jitter = analyzeJitterSensitivity(level, analysis.solutions, { gravityG, samplesPerSolution: 5 });
        combat = evaluateCombatBalance(level, analysis.solutions, { gravityG, duelsCount: 5 });
      }

      if (confusionMatrix[reqTier]) {
        confusionMatrix[reqTier][evalTier] = (confusionMatrix[reqTier][evalTier] || 0) + 1;
      }

      const rec = {
        seed,
        requestedTier: reqTier,
        evaluatedTier: evalTier,
        solvable,
        maxSolutionWindowDeg: maxWindow,
        minTurnDeg: minTurn,
        maxTurnDeg: maxTurn,
        maxLoops,
        hasDirectShot,
        isGravityMandated,
        maxOrbitalTurnsDeg,
        has3600Orbit: orbitComplexity ? orbitComplexity.has3600DegreeOrbit : false,
        chaosLyapunovIndex: orbitComplexity ? orbitComplexity.chaosLyapunovIndex : 0,
        chaosCategory: orbitComplexity ? orbitComplexity.category : 'unsolvable',
        isTierMatch,
        isHumanPlayable,
        jitterIndex: jitter ? jitter.humanPlayabilityIndex : 0,
        jitterCategory: jitter ? jitter.category : 'unsolvable',
        playerWinRatePct: combat ? combat.playerWinRatePct : 0,
        enemyWinRatePct: combat ? combat.enemyWinRatePct : 0,
        genTimeMs: Number(genTimeMs.toFixed(2)),
        objectPermutation: permArray,
        objectPermutationKey: permKey,
        objectCounts: level ? {
          planets: level.planets?.length || 0,
          blackHoles: level.blackHoles?.length || 0,
          asteroids: level.asteroids?.length || 0,
          wormholes: level.wormholes?.length || 0,
          pulsars: level.pulsars?.length || 0,
          boosters: level.boosters?.length || 0,
          shields: level.shields?.length || 0,
        } : {},
      };

      records.push(rec);
      tierRecords.push(rec);
    }

    // Aggregations per tier
    const solvableCount = tierRecords.filter((r) => r.solvable).length;
    const tierMatchCount = tierRecords.filter((r) => r.isTierMatch).length;
    const humanPlayableCount = tierRecords.filter((r) => r.isHumanPlayable).length;
    const directShotCount = tierRecords.filter((r) => r.hasDirectShot).length;
    const gravityMandatedCount = tierRecords.filter((r) => r.isGravityMandated).length;
    const orbit3600Count = tierRecords.filter((r) => r.has3600Orbit).length;

    const windowStats = calculateStats(tierRecords.map((r) => r.maxSolutionWindowDeg));
    const genTimeStats = calculateStats(tierRecords.map((r) => r.genTimeMs));
    const turnStats = calculateStats(tierRecords.map((r) => r.minTurnDeg));
    const jitterStats = calculateStats(tierRecords.map((r) => r.jitterIndex));
    const playerWinStats = calculateStats(tierRecords.map((r) => r.playerWinRatePct));
    const chaosStats = calculateStats(tierRecords.map((r) => r.chaosLyapunovIndex));

    tierStats[reqTier] = {
      requestedTier: reqTier,
      label: DIFFICULTY_TIERS[reqTier]?.label || reqTier,
      totalEvaluated: runSeedsPerTier,
      solvableYieldPct: Number(((solvableCount / runSeedsPerTier) * 100).toFixed(1)),
      tierMatchAccuracyPct: Number(((tierMatchCount / runSeedsPerTier) * 100).toFixed(1)),
      humanPlayablePct: Number(((humanPlayableCount / runSeedsPerTier) * 100).toFixed(1)),
      directShotPct: Number(((directShotCount / runSeedsPerTier) * 100).toFixed(1)),
      gravityMandatedPct: Number(((gravityMandatedCount / runSeedsPerTier) * 100).toFixed(1)),
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
  const permutationTelemetry = {};
  const permGroups = {};
  records.forEach((r) => {
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

    permutationTelemetry[k] = {
      permutationKey: k,
      count: group.length,
      solvableYieldPct: Number(((solvableCount / group.length) * 100).toFixed(1)),
      avgWindowDeg: calculateStats(windows).mean,
      avgMinTurnDeg: calculateStats(turns).mean,
      avgChaosIndex: calculateStats(chaos).mean,
    };
  });

  const totalSuiteTimeMs = performance.now() - suiteStartTime;
  const overallSolvable = records.filter((r) => r.solvable).length;
  const overallMatches = records.filter((r) => r.isTierMatch).length;
  const total3600Orbits = records.filter((r) => r.has3600Orbit).length;

  return {
    timestamp: new Date().toISOString(),
    totalMaps: records.length,
    seedsPerTier: runSeedsPerTier,
    stage,
    total3600Orbits,
    isDeep,
    isExhaustive,
    isStressTest,
    totalSuiteTimeMs: Number(totalSuiteTimeMs.toFixed(2)),
    avgTimePerMapMs: Number((totalSuiteTimeMs / records.length).toFixed(2)),
    overallSolvableYieldPct: Number(((overallSolvable / records.length) * 100).toFixed(1)),
    overallTierMatchPct: Number(((overallMatches / records.length) * 100).toFixed(1)),
    tierStats,
    permutationTelemetry,
    confusionMatrix,
    records,
  };
}

/**
 * Formats benchmark suite results into a structured Markdown document.
 *
 * @param {Object} suiteResults 
 * @param {Object} [baseline] Optional baseline object for differential comparison
 * @returns {string} Markdown document string
 */
export function formatBenchmarkMarkdownReport(suiteResults, baseline = null) {
  const {
    timestamp,
    totalMaps,
    seedsPerTier,
    total3600Orbits = 0,
    isDeep = false,
    isExhaustive = false,
    isStressTest = false,
    stage = 0,
    totalSuiteTimeMs,
    avgTimePerMapMs,
    overallSolvableYieldPct,
    overallTierMatchPct,
    tierStats,
    permutationTelemetry = {},
    confusionMatrix,
  } = suiteResults;

  const tierCount = Object.keys(tierStats).length;

  let md = `# Space Slingshot Map Benchmark Report (Round 4 Exhaustive Trajectory & Generator Stress-Testing)\n\n`;
  md += `**Execution Date**: ${timestamp}  \n`;
  md += `**Total Maps Evaluated**: ${totalMaps} (${seedsPerTier} seeds/tier across ${tierCount} tiers, Stage: ${stage || 'Full'})  \n`;
  md += `**Solver Mode**: ${isExhaustive ? 'Un-pruned Brute-Force Grid (0.1° step)' : isDeep ? 'Deep Search (0.05° hyper-res)' : 'Coarse-to-Fine Adaptive'}  \n`;
  md += `**Generator Mode**: ${isStressTest ? 'Unconstrained Stress-Test (Zero Rejection Retries)' : 'Standard Solvability Rejection Filter'}  \n`;
  md += `**3,600°+ Multi-Loop Orbits Discovered**: ${total3600Orbits}  \n`;
  md += `**Total Suite Execution Time**: ${(totalSuiteTimeMs / 1000).toFixed(2)}s (${avgTimePerMapMs} ms/map)  \n\n`;

  md += `> [!NOTE]\n`;
  md += `> **Overall Solvability Yield**: ${overallSolvableYieldPct}%  \n`;
  md += `> **Overall Tier Classification Accuracy**: ${overallTierMatchPct}%\n\n`;

  if (baseline) {
    const yieldDiff = (overallSolvableYieldPct - baseline.overallSolvableYieldPct).toFixed(1);
    const matchDiff = (overallTierMatchPct - baseline.overallTierMatchPct).toFixed(1);
    md += `> [!TIP]\n`;
    md += `> **Differential vs Prior Baseline**:  \n`;
    md += `> - Solvability Yield: ${yieldDiff >= 0 ? '+' : ''}${yieldDiff}%  \n`;
    md += `> - Tier Accuracy: ${matchDiff >= 0 ? '+' : ''}${matchDiff}%\n\n`;
  }

  md += `## Tier Performance Summary (4-Tier Schema)\n\n`;
  md += `| Tier | Label | Solvability Yield | Tier Match % | Gravity Mandated % | 3600°+ Orbits | Chaos Index (λ) | Mean Window ($\Delta \\theta$) | Avg Gen Latency |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  Object.keys(tierStats).forEach((tierKey) => {
    const t = tierStats[tierKey];
    md += `| **${tierKey}** | ${t.label} | ${t.solvableYieldPct}% | ${t.tierMatchAccuracyPct}% | ${t.gravityMandatedPct}% | ${t.orbit3600Count} | ${t.avgChaosLyapunovIndex} | ${t.windowStats.mean}° | ${t.genTimeStats.mean} ms |\n`;
  });

  md += `\n## Exotic Space Object Permutation Telemetry\n\n`;
  md += `| Object Permutation | Map Count | Solvability Yield | Mean Window ($\Delta \\theta$) | Avg Min Turn | Chaos Index (λ) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  Object.keys(permutationTelemetry).forEach((permKey) => {
    const p = permutationTelemetry[permKey];
    md += `| **${p.permutationKey}** | ${p.count} | ${p.solvableYieldPct}% | ${p.avgWindowDeg}° | ${p.avgMinTurnDeg}° | ${p.avgChaosIndex} |\n`;
  });

  md += `\n## Tier Confusion Matrix (Requested vs Evaluated)\n\n`;
  const evaluatedKeys = ['level1', 'level2', 'level3', 'level4', 'unrated'];
  md += `| Requested \\ Evaluated | ${evaluatedKeys.map((k) => k === 'unrated' ? 'Unrated' : k.toUpperCase()).join(' | ')} |\n`;
  md += `| :--- | ${evaluatedKeys.map(() => ':---').join(' | ')} |\n`;

  Object.keys(confusionMatrix).forEach((reqTier) => {
    const row = confusionMatrix[reqTier];
    md += `| **${reqTier}** | ${evaluatedKeys.map((k) => row[k] || 0).join(' | ')} |\n`;
  });

  md += `\n## Diagnostic Recommendations\n\n`;
  if (overallTierMatchPct < 85) {
    md += `> [!WARNING]\n`;
    md += `> **Tier Match Rate Below Target (85%)**: Generator target matching is degrading to lower tiers. Consider adjusting template placement weights in level generator.\n\n`;
  } else {
    md += `> [!TIP]\n`;
    md += `> **Tier Match Target Achieved ($\ge 85\%$)**: Generator sightline constraints, Level 2 chokepoint gates, and 4-tier solver threshold calibrations are functioning as intended.\n\n`;
  }

  return md;
}

/**
 * Formats benchmark records into tabular CSV format for export.
 *
 * @param {Object} suiteResults 
 * @returns {string} CSV string
 */
export function formatBenchmarkCSV(suiteResults) {
  const headers = [
    'Seed',
    'RequestedTier',
    'EvaluatedTier',
    'Solvable',
    'IsTierMatch',
    'ObjectPermutation',
    'MaxSolutionWindowDeg',
    'MinTurnDeg',
    'MaxTurnDeg',
    'MaxLoops',
    'HasDirectShot',
    'IsGravityMandated',
    'Has3600Orbit',
    'ChaosLyapunovIndex',
    'ChaosCategory',
    'IsHumanPlayable',
    'JitterIndex',
    'PlayerWinRatePct',
    'GenTimeMs',
  ];

  const rows = [headers.join(',')];

  suiteResults.records.forEach((r) => {
    rows.push(
      [
        r.seed,
        r.requestedTier,
        r.evaluatedTier,
        r.solvable,
        r.isTierMatch,
        `"${r.objectPermutationKey}"`,
        r.maxSolutionWindowDeg,
        r.minTurnDeg,
        r.maxTurnDeg,
        r.maxLoops,
        r.hasDirectShot,
        r.isGravityMandated,
        r.has3600Orbit,
        r.chaosLyapunovIndex,
        r.chaosCategory,
        r.isHumanPlayable,
        r.jitterIndex,
        r.playerWinRatePct,
        r.genTimeMs,
      ].join(',')
    );
  });

  return rows.join('\n');
}
