#!/usr/bin/env node
/**
 * Infra completa: GitHub + Render (1 comando).
 *
 *   node scripts/sincronizar-infra.js
 *   node scripts/sincronizar-infra.js --dry-run
 */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dry = process.argv.includes('--dry-run');
const extra = process.argv.filter((a) => a.startsWith('--'));

function run(label, script) {
  console.log(`\n${'▓'.repeat(60)}\n  ${label}\n${'▓'.repeat(60)}`);
  const r = spawnSync('node', [path.join(__dirname, script), ...extra], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

run('GitHub', 'sincronizar-github.js');
run('Render', 'sincronizar-render.js');

console.log('\n✅ Infra GitHub + Render sincronizada.\n');
