// Run all ETL steps in order:
//   climate -> tags -> scores -> events -> crowd
// crowd depends on events already being inserted.
//
// Usage:
//   env $(cat .env | xargs) node scripts/etl/run-all.mjs

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const STEPS = [
  'climate.mjs',
  'tags.mjs',
  'scores.mjs',
  'events.mjs',
  'crowd.mjs',
];

function runStep(file) {
  return new Promise((resolve) => {
    const full = join(__dirname, file);
    console.log(`\n========== [run-all] START ${file} ==========`);
    const child = spawn(process.execPath, [full], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => {
      console.log(`========== [run-all] END   ${file} (exit ${code}) ==========`);
      resolve(code);
    });
  });
}

async function main() {
  const results = [];
  for (const s of STEPS) {
    const code = await runStep(s);
    results.push({ step: s, code });
  }
  console.log('\n[run-all] summary:');
  for (const r of results) {
    console.log(`  ${r.step}: exit ${r.code}`);
  }
  const failed = results.filter((r) => r.code !== 0);
  if (failed.length) {
    console.error(`[run-all] ${failed.length} step(s) failed`);
    process.exit(1);
  } else {
    console.log('[run-all] all steps completed');
  }
}

main().catch((e) => {
  console.error('[run-all] fatal:', e);
  process.exit(1);
});
