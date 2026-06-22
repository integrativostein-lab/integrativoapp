#!/usr/bin/env node
/**
 * Deploy alfa automatizado: Supabase (SQL) + Render (env + redeploy) + Vercel (site) + testes.
 *
 * Uso:
 *   1. Copie .env.alfa.example → .env.alfa e preencha DATABASE_URL, RENDER_API_KEY, VERCEL_TOKEN
 *   2. node scripts/deploy-alfa.js
 *
 * Flags:
 *   --skip-sql      não roda migrações
 *   --skip-render   não configura Render
 *   --skip-vercel   não publica Vercel
 *   --skip-test     não roda testes finais
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { patchTemporario } = require('./lib/deploy-flag');
const { loadEnvFile, createRenderClient } = require('./lib/render-api');
const { prepararSupabaseLocal, autoPreencherSupabase, resolverDatabaseUrlRemoto, persistirChaveEnv } = require('./lib/supabase-env');
const { aplicarAlfaRender } = require('./lib/aplicar-alfa-render');
const { databaseUrlParaPooler } = require('../backend/utils/supabase-pooler');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.alfa');

const MIGRACOES_ALFA = [
  'migracao-base-alfa.sql',
  'migracao-v2.1.sql',
  'migracao-auditoria-lgpd.sql',
  'migracao-consentimentos-lgpd.sql',
  'migracao-anamnese.sql',
  'migracao-teleconsulta.sql'
];

const ERROS_MIGRACAO_IDEMPOTENTE = /already exists|duplicate key|duplicate_object/i;

const FLAGS = {
  skipSql: process.argv.includes('--skip-sql'),
  skipRender: process.argv.includes('--skip-render'),
  skipVercel: process.argv.includes('--skip-vercel'),
  skipTest: process.argv.includes('--skip-test'),
  dryRun: process.argv.includes('--dry-run'),
  colar: process.argv.includes('--colar') || process.argv.includes('--clipboard')
};

function loadEnv() {
  if (!loadEnvFile(ENV_FILE)) {
    console.error('❌ Arquivo .env.alfa não encontrado.');
    console.error('   Copie .env.alfa.example → .env.alfa e preencha os tokens.');
    process.exit(1);
  }
  autoPreencherSupabase(ENV_FILE, { clipboard: FLAGS.colar });
}

function step(n, titulo) {
  console.log(`\n${'═'.repeat(60)}\n  PASSO ${n}: ${titulo}\n${'═'.repeat(60)}`);
}

async function configurarRender() {
  const render = createRenderClient({
    apiKey: process.env.RENDER_API_KEY,
    dryRun: FLAGS.dryRun
  });

  const nome = process.env.RENDER_SERVICE_NAME || 'integrativoappespelho';
  const svc = await render.findService(nome);
  console.log(`   Serviço encontrado: ${svc.name} (${svc.id})`);

  await resolverDatabaseUrlRemoto({ render, envFile: ENV_FILE, alfaServiceId: svc.id });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente — preencha .env.alfa ou configure Render produção');

  const { jwt } = await aplicarAlfaRender(render, svc, {
    dryRun: FLAGS.dryRun,
    noDeploy: FLAGS.dryRun,
    envFile: ENV_FILE
  });

  if (jwt && !process.env.JWT_SECRET && !FLAGS.dryRun) {
    persistirChaveEnv(ENV_FILE, 'JWT_SECRET', jwt);
    console.log('   ✓ JWT_SECRET salvo em .env.alfa');
    console.log(`\n   💡 JWT_SECRET ativo neste deploy (primeiros 8 chars): ${jwt.slice(0, 8)}…`);
  }

  return svc.id;
}

async function aguardarAuthDemo(maxSeg = 120) {
  const api = process.env.ALFA_API_URL || 'https://integrativoappespelho.onrender.com/api';
  console.log(`   Aguardando login/verificar estáveis (${maxSeg}s max)…`);
  const inicio = Date.now();
  while (Date.now() - inicio < maxSeg * 1000) {
    try {
      const login = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'profissional@demo.com', senha: 'demo123' }),
        signal: AbortSignal.timeout(90000)
      });
      const body = await login.json();
      if (login.status === 429) throw new Error('rate limit');
      if (login.status !== 200 || !body.token) throw new Error('login');
      const ver = await fetch(`${api}/auth/verificar`, {
        headers: { Authorization: `Bearer ${body.token}` },
        signal: AbortSignal.timeout(90000)
      });
      if (ver.status === 200) {
        console.log('   ✓ Auth demo estável (login + verificar).');
        return;
      }
    } catch { /* retry */ }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 20000));
  }
  console.log('\n   ⚠️ Auth demo ainda instável — aguarde 2 min e rode testar-alfa-remoto.js.');
}

async function executarMigracao(pool, nome, sql) {
  process.stdout.write(`   → ${nome} … `);
  try {
    await pool.query(sql);
    console.log('ok');
  } catch (err) {
    if (ERROS_MIGRACAO_IDEMPOTENTE.test(err.message)) {
      console.log('ok (já aplicado)');
      return;
    }
    throw new Error(`${nome}: ${err.message}`);
  }
}

async function rodarMigracoes() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL ausente no .env.alfa');

  const urlPooler = databaseUrlParaPooler(process.env.DATABASE_URL);
  process.env.DATABASE_URL = urlPooler;

  const { Pool } = require(path.join(ROOT, 'backend/node_modules/pg'));
  const pool = new Pool({
    connectionString: urlPooler,
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
  });

  const arquivos = MIGRACOES_ALFA.filter((f) => fs.existsSync(path.join(ROOT, f)));

  for (const nome of arquivos) {
    const sql = fs.readFileSync(path.join(ROOT, nome), 'utf8');
    if (FLAGS.dryRun) {
      console.log(`   [dry-run] executaria ${nome}`);
      continue;
    }
    await executarMigracao(pool, nome, sql);
  }

  if (!FLAGS.dryRun) await pool.end();
  console.log('   ✓ Migrações concluídas.');
  await semearDemo();
}

async function semearDemo() {
  if (FLAGS.dryRun || FLAGS.skipSql) return;
  console.log('   → contas demo …');
  process.env.TEST_MODE = 'true';
  const r = spawnSync('node', [path.join(ROOT, 'backend/garantir-demo.js')], {
    cwd: path.join(ROOT, 'backend'),
    env: process.env,
    stdio: 'pipe',
    shell: true,
    encoding: 'utf8'
  });
  if (r.status === 0) {
    console.log('   ✓ Contas demo criadas (profissional@demo.com / paciente@demo.com).');
  } else {
    console.log('   ⚠️ Seed demo:', (r.stderr || r.stdout || '').trim().slice(0, 200));
  }
}

function deployVercel() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN ausente no .env.alfa');
  const project = process.env.VERCEL_PROJECT_NAME || 'integrativoapp-alfa';
  const scope = process.env.VERCEL_SCOPE || '';

  if (FLAGS.dryRun) {
    console.log(`   [dry-run] npx vercel --prod --scope ${scope || '(default)'} (INTEGRATIVO_DEPLOY=alfa)`);
    return;
  }

  console.log(`   Publicando projeto "${project}"… (pode levar 1–3 min)`);
  const restaurarFlag = patchTemporario('alfa');
  try {
    const env = { ...process.env };
    const scopeArgs = scope ? ['--scope', scope] : [];

    const link = spawnSync('npx', [
      '--yes', 'vercel@latest', 'link', '--yes',
      '--project', project,
      '--token', token,
      ...scopeArgs
    ], {
      cwd: ROOT,
      env,
      stdio: 'inherit',
      shell: true
    });

    if (link.status !== 0) {
      console.log('   ℹ️ link falhou — tentando deploy direto…');
    }

    const deploy = spawnSync('npx', [
      '--yes', 'vercel@latest', '--prod', '--yes',
      '--token', token,
      ...scopeArgs
    ], {
      cwd: ROOT,
      env,
      stdio: 'inherit',
      shell: true
    });

    if (deploy.status !== 0) throw new Error('Deploy Vercel falhou. Verifique VERCEL_TOKEN e VERCEL_SCOPE.');
    console.log(`   ✓ Site alfa: https://${project}.vercel.app`);
    console.log('   ✓ INTEGRATIVO_DEPLOY=alfa embutido neste deploy (subdomínios alfa.* também reconhecidos).');
  } finally {
    restaurarFlag();
    console.log('   ✓ config.js local restaurado para INTEGRATIVO_DEPLOY=producao');
  }
}

async function aguardarBackend(maxSeg = 240) {
  const root = (process.env.ALFA_API_URL || 'https://integrativoappespelho.onrender.com/api').replace(/\/api\/?$/, '');
  const timeoutReq = Number(process.env.ALFA_BACKEND_TIMEOUT_MS) || 90000;
  console.log(`   Aguardando backend (${maxSeg}s max, timeout ${timeoutReq / 1000}s por tentativa)…`);
  const inicio = Date.now();
  while (Date.now() - inicio < maxSeg * 1000) {
    try {
      const r = await fetch(`${root}/`, { signal: AbortSignal.timeout(timeoutReq) });
      const j = await r.json();
      if (r.ok && j.status === 'online') {
        console.log('   ✓ Backend online.');
        return;
      }
    } catch { /* retry */ }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 10000));
  }
  console.log('\n   ⚠️ Backend ainda não respondeu — rode testes manualmente depois.');
}

function rodarTestes() {
  if (FLAGS.dryRun) {
    console.log('   [dry-run] node scripts/testar-alfa-remoto.js --todos');
    return;
  }
  const r = spawnSync('node', [path.join(__dirname, 'testar-alfa-remoto.js'), '--todos'], {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
    shell: true
  });
  if (r.status !== 0) console.log('   ⚠️ Alguns testes falharam — veja acima.');
}

async function main() {
  console.log('\n🚀 Deploy alfa automatizado — Integrativo.App\n');
  loadEnv();

  if (!FLAGS.skipSql) {
    step(1, 'Supabase — migrações SQL');
    await rodarMigracoes();
  }

  if (!FLAGS.skipRender) {
    step(2, 'Render — variáveis + redeploy');
    await configurarRender();
    if (!FLAGS.dryRun) {
      await aguardarBackend();
      await aguardarAuthDemo();
    }
  }

  if (!FLAGS.skipVercel) {
    step(3, 'Vercel — publicar site alfa');
    deployVercel();
  }

  if (!FLAGS.skipTest) {
    step(4, 'Testes automáticos');
    rodarTestes();
  }

  console.log('\n✅ Automação concluída.');
  console.log(`\n   Site:     ${process.env.ALFA_FRONTEND_URL || 'https://integrativoapp-alfa.vercel.app'}`);
  console.log(`   API:      ${process.env.ALFA_API_URL || 'https://integrativoappespelho.onrender.com/api'}`);
  console.log('   Login demo: profissional@demo.com / demo123\n');
}

main().catch((err) => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
