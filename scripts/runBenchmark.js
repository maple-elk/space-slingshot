import { runMapBenchmarkSuite, formatBenchmarkMarkdownReport, formatBenchmarkCSV } from '../src/game/ai/benchmarkRunner.js';
import { runParallelMapBenchmarkSuite } from '../src/game/ai/benchmarkWorkerPool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI flags: e.g. node scripts/runBenchmark.js --seeds 100 --parallel --deep --exhaustive --stress-test --stage 1
const args = process.argv.slice(2);
let seedsPerTier = 50;
let isParallel = false;
let isDeep = false;
let isExhaustive = false;
let isStressTest = false;
let stage = 0;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seeds' && args[i + 1]) {
    seedsPerTier = parseInt(args[i + 1], 10) || 50;
  }
  if (args[i] === '--parallel') {
    isParallel = true;
  }
  if (args[i] === '--deep') {
    isDeep = true;
  }
  if (args[i] === '--exhaustive') {
    isExhaustive = true;
  }
  if (args[i] === '--stress-test') {
    isStressTest = true;
  }
  if (args[i] === '--stage' && args[i + 1]) {
    stage = parseInt(args[i + 1], 10) || 0;
  }
}

console.log(`🚀 Launching Space Slingshot Map Benchmark Suite Round 4...`);
console.log(`   Config: seeds/tier=${seedsPerTier}, parallel=${isParallel}, deep=${isDeep}, exhaustive=${isExhaustive}, stressTest=${isStressTest}, stage=${stage || 'Full'}`);

const startTime = Date.now();
const runOptions = {
  seedsPerTier,
  startSeed: 1000,
  deep: isDeep,
  exhaustive: isExhaustive,
  unconstrainedStressTest: isStressTest,
  stage,
};

const results = isParallel
  ? await runParallelMapBenchmarkSuite(runOptions)
  : runMapBenchmarkSuite(runOptions);

const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

console.log(`\n✅ Benchmark Sweep Complete in ${durationSec}s!`);
console.log(`📊 Solvability Yield: ${results.overallSolvableYieldPct}%`);
console.log(`🎯 Tier Match Accuracy: ${results.overallTierMatchPct}%`);
console.log(`🌀 3600°+ Multi-Loop Orbits: ${results.total3600Orbits || 0}\n`);

const outputDir = path.resolve(__dirname, '../dist/benchmark');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (stage === 1) {
  const checkpointPath = path.join(outputDir, 'checkpoint_stage1.json');
  fs.writeFileSync(checkpointPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`📁 Stage 1 Checkpoint written to: ${checkpointPath}`);
} else {
  // Load prior baseline if available
  const jsonPath = path.join(outputDir, 'benchmark_results.json');
  let baseline = null;
  if (fs.existsSync(jsonPath)) {
    try {
      baseline = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (err) {
      // Ignore baseline if parsing fails
    }
  }

  const reportMd = formatBenchmarkMarkdownReport(results, baseline);
  const csvContent = formatBenchmarkCSV(results);

  const mdPath = path.join(outputDir, 'benchmark_report.md');
  const csvPath = path.join(outputDir, 'benchmark_metrics.csv');

  fs.writeFileSync(mdPath, reportMd, 'utf8');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

  console.log(reportMd);
  console.log(`\n📁 Reports written to:`);
  console.log(` - Markdown: ${mdPath}`);
  console.log(` - CSV:      ${csvPath}`);
  console.log(` - JSON:     ${jsonPath}`);
}
