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
const crypto = require('crypto');
const { spawnSync } = require('child_process');

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
  dryRun: process.argv.includes('--dry-run')
};

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ Arquivo .env.alfa não encontrado.');
    console.error('   Copie .env.alfa.example → .env.alfa e preencha os tokens.');
    process.exit(1);
  }
  const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
  lines.forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (!val) return;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
}

function step(n, titulo) {
  console.log(`\n${'═'.repeat(60)}\n  PASSO ${n}: ${titulo}\n${'═'.repeat(60)}`);
}

async function renderApi(method, endpoint, body) {
  const key = process.env.RENDER_API_KEY;
  if (!key) throw new Error('RENDER_API_KEY ausente no .env.alfa');
  const r = await fetch(`https://api.render.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120000)
  });
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`Render API ${method} ${endpoint}: ${r.status} — ${text.slice(0, 300)}`);
  return json;
}

async function descobrirServicoRender() {
  if (process.env.RENDER_SERVICE_ID) return process.env.RENDER_SERVICE_ID;
  const nome = process.env.RENDER_SERVICE_NAME || 'integrativoappespelho';
  const data = await renderApi('GET', '/services?limit=50');
  const lista = Array.isArray(data) ? data : (data?.items || data?.services || []);
  const found = lista.find((item) => {
    const svc = item.service || item;
    return svc.name === nome || svc.slug === nome;
  });
  if (!found) throw new Error(`Serviço Render "${nome}" não encontrado. Crie manualmente ou ajuste RENDER_SERVICE_NAME.`);
  const svc = found.service || found;
  console.log(`   Serviço encontrado: ${svc.name} (${svc.id})`);
  return svc.id;
}

async function upsertEnvRender(serviceId, key, value) {
  if (FLAGS.dryRun) {
    console.log(`   [dry-run] ${key}=${value.slice(0, 40)}${value.length > 40 ? '…' : ''}`);
    return;
  }
  try {
    await renderApi('PUT', `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`, { value });
    console.log(`   ✓ ${key}`);
  } catch (e) {
    if (String(e.message).includes('404')) {
      await renderApi('POST', `/services/${serviceId}/env-vars`, { envVar: { key, value } });
      console.log(`   ✓ ${key} (criado)`);
    } else {
      throw e;
    }
  }
}

async function listarEnvRender(serviceId) {
  const data = await renderApi('GET', `/services/${serviceId}/env-vars?limit=100`);
  return Array.isArray(data) ? data : (data?.items || data?.envVars || []);
}

async function obterEnvRender(serviceId, key) {
  const lista = await listarEnvRender(serviceId);
  const found = lista.find((item) => {
    const ev = item.envVar || item;
    return ev.key === key;
  });
  return found?.envVar?.value || found?.value || null;
}

async function configurarRender() {
  const serviceId = await descobrirServicoRender();
  let jwt = process.env.JWT_SECRET;
  if (!jwt) {
    jwt = await obterEnvRender(serviceId, 'JWT_SECRET');
    if (jwt) console.log('   ℹ️ JWT_SECRET preservado do Render (sem rotação).');
  }
  if (!jwt) {
    jwt = crypto.randomBytes(32).toString('hex');
    console.log('   💡 JWT_SECRET novo — guarde em .env.alfa para não rotacionar nos próximos deploys.');
  }
  const apiRoot = (process.env.ALFA_API_URL || 'https://integrativoappespelho.onrender.com/api').replace(/\/api\/?$/, '');
  const cors = process.env.CORS_ORIGINS || 'https://integrativoapp-alfa.vercel.app';

  const vars = {
    NODE_ENV: 'test',
    PORT: '10000',
    TEST_MODE: 'true',
    SIMULAR_NF_SEM_CERTIFICADO: 'true',
    CORS_ORIGINS: cors,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: jwt,
    EVOLUTION_SIMULATE: 'true',
    RNDS_ENABLED: 'false',
    AUDITORIA_LGPD_ATIVA: 'true',
    AUDITORIA_LGPD_RETENCAO_DIAS: '365',
    FHIR_BASE_URL: `${apiRoot}/api/fhir`,
    TISS_BASE_URL: `${apiRoot}/api/tiss`
  };

  if (process.env.LIVEKIT_URL) vars.LIVEKIT_URL = process.env.LIVEKIT_URL;
  if (process.env.LIVEKIT_API_KEY) vars.LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
  if (process.env.LIVEKIT_API_SECRET) vars.LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

  if (!vars.DATABASE_URL) throw new Error('DATABASE_URL ausente no .env.alfa');

  console.log('   Atualizando variáveis de ambiente…');
  for (const [k, v] of Object.entries(vars)) {
    await upsertEnvRender(serviceId, k, String(v));
  }

  if (!process.env.JWT_SECRET && jwt && !FLAGS.dryRun) {
    console.log(`\n   💡 Defina JWT_SECRET no .env.alfa para fixar:\n   ${jwt}`);
  }

  if (FLAGS.dryRun) {
    console.log('   [dry-run] deploy Render não disparado');
    return serviceId;
  }

  console.log('   Disparando redeploy…');
  await renderApi('POST', `/services/${serviceId}/deploys`, { clearCache: 'clear' });
  console.log('   ✓ Deploy iniciado no Render (aguarde 2–5 min até ficar Live).');
  return serviceId;
}

async function aguardarAuthDemo(maxSeg = 300) {
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
    await new Promise((r) => setTimeout(r, 15000));
  }
  console.log('\n   ⚠️ Auth demo ainda instável — pode ser rolling deploy no Render.');
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

  const { Pool } = require(path.join(ROOT, 'backend/node_modules/pg'));
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
    console.log(`   [dry-run] npx vercel --prod --scope ${scope || '(default)'}`);
    return;
  }

  console.log(`   Publicando projeto "${project}"… (pode levar 1–3 min)`);
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
    console.log('   [dry-run] node scripts/testar-alfa-remoto.js');
    return;
  }
  const r = spawnSync('node', [path.join(__dirname, 'testar-alfa-remoto.js')], {
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
