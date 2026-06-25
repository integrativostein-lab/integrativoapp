#!/usr/bin/env node
/**
 * Deploy do frontend de produção na Vercel (integrativo.app).
 * Garante INTEGRATIVO_DEPLOY=producao no bundle publicado.
 *
 * Projeto Vercel: integrativoapp (domínio integrativo.app).
 * O projeto integra-saude-psi é espelho legado — não use para o canônico.
 *
 * Pré-requisito: .env.alfa com VERCEL_TOKEN (mesmo token serve).
 *
 * Uso:
 *   node scripts/deploy-producao.js
 */
const path = require('path');
const { spawnSync } = require('child_process');
const { loadEnvFile } = require('./lib/render-api');
const { patchTemporario, lerFlagAtual } = require('./lib/deploy-flag');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.alfa');

function deployVercelProducao() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN ausente no .env.alfa');
  const project = process.env.VERCEL_PROD_PROJECT_NAME || 'integrativoapp';
  const scope = process.env.VERCEL_SCOPE || '';
  const scopeArgs = scope ? ['--scope', scope] : [];

  console.log(`\n🌿 Deploy produção — Vercel "${project}"\n`);
  const restaurarFlag = patchTemporario('producao');
  if (lerFlagAtual() !== 'producao') {
    throw new Error('Falha ao marcar INTEGRATIVO_DEPLOY=producao antes do deploy.');
  }
  try {
    const env = { ...process.env };
    const deploy = spawnSync('npx', [
      '--yes', 'vercel@latest', 'deploy', '--prod', '--yes',
      '--project', project,
      '--token', token,
      ...scopeArgs
    ], { cwd: ROOT, env, stdio: 'inherit', shell: true });

    if (deploy.status !== 0) throw new Error('Deploy Vercel produção falhou.');
    console.log(`\n   ✓ Produção publicada (INTEGRATIVO_DEPLOY=producao — sem banner de teste).`);
  } finally {
    restaurarFlag();
  }
}

function main() {
  if (!loadEnvFile(ENV_FILE)) {
    console.error('❌ Crie .env.alfa com VERCEL_TOKEN.');
    process.exit(1);
  }
  deployVercelProducao();
}

main();
