#!/usr/bin/env node
/**
 * Sincroniza os 2 backends Render (alfa + produção): repo GitHub, CORS, env, redeploy.
 *
 * Pré-requisito: .env.alfa com RENDER_API_KEY (e DATABASE_URL para alfa).
 *
 * Uso:
 *   node scripts/sincronizar-render.js
 *   node scripts/sincronizar-render.js --dry-run
 *   node scripts/sincronizar-render.js --alfa-only
 *   node scripts/sincronizar-render.js --prod-only --no-deploy
 */
const path = require('path');
const { loadEnvFile, createRenderClient } = require('./lib/render-api');
const { SITE_CANONICO, CORS_PRODUCAO } = require('../backend/config/dominios');
const { databaseUrlParaPooler } = require('../backend/utils/supabase-pooler');
const {
  autoPreencherSupabase,
  resolverDatabaseUrlRemoto,
  persistirChaveEnv
} = require('./lib/supabase-env');
const { aplicarAlfaRender } = require('./lib/aplicar-alfa-render');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.alfa');

const FLAGS = {
  dryRun: process.argv.includes('--dry-run'),
  alfaOnly: process.argv.includes('--alfa-only'),
  prodOnly: process.argv.includes('--prod-only'),
  noDeploy: process.argv.includes('--no-deploy'),
  skipRepo: process.argv.includes('--skip-repo'),
  colar: process.argv.includes('--colar') || process.argv.includes('--clipboard')
};

const GITHUB_REPO = process.env.GITHUB_REPO || 'integrativostein-lab/integrativoapp';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'master';
const ROOT_DIR = process.env.RENDER_ROOT_DIR || 'backend';

async function configurarAlfa(render) {
  const nome = process.env.RENDER_SERVICE_NAME || 'integrativoappespelho';
  const svc = await render.findService(nome);
  console.log(`\n📡 Alfa — ${svc.name} (${svc.id})`);

  autoPreencherSupabase(ENV_FILE, { clipboard: FLAGS.colar, silencioso: true });
  await resolverDatabaseUrlRemoto({ render, envFile: ENV_FILE, alfaServiceId: svc.id });

  const { jwt } = await aplicarAlfaRender(render, svc, {
    dryRun: FLAGS.dryRun,
    skipRepo: FLAGS.skipRepo,
    noDeploy: FLAGS.noDeploy,
    githubRepo: GITHUB_REPO,
    githubBranch: GITHUB_BRANCH,
    rootDir: ROOT_DIR,
    envFile: ENV_FILE
  });

  if (jwt && !process.env.JWT_SECRET && !FLAGS.dryRun) {
    persistirChaveEnv(ENV_FILE, 'JWT_SECRET', jwt);
  }

  return svc;
}

async function configurarProducao(render) {
  const nome = process.env.RENDER_PROD_SERVICE_NAME || 'integra-backend-ynrd';
  let svc;
  try {
    svc = await render.findService(nome);
  } catch {
    svc = await render.findService('integra-backend');
  }
  console.log(`\n🌿 Produção — ${svc.name} (${svc.id})`);

  if (!FLAGS.skipRepo) {
    await render.updateRepo(svc.id, { repo: GITHUB_REPO, branch: GITHUB_BRANCH, rootDir: ROOT_DIR });
  }

  await render.updateBuildCommands(svc.id, {
    buildCommand: 'npm install',
    startCommand: 'npm start'
  });

  const apiRoot = (process.env.PROD_API_URL || 'https://integra-backend-ynrd.onrender.com').replace(/\/api\/?$/, '');
  const cors = process.env.PROD_CORS_ORIGINS || CORS_PRODUCAO;

  const vars = {
    NODE_ENV: 'production',
    PORT: '10000',
    NODE_OPTIONS: '--dns-result-order=ipv4first',
    TEST_MODE: 'false',
    RECURSOS_CLINICOS_ATIVOS: 'false',
    CORS_ORIGINS: cors,
    FRONTEND_URL: SITE_CANONICO,
    EVOLUTION_SIMULATE: 'false',
    RNDS_ENABLED: 'false',
    AUDITORIA_LGPD_ATIVA: 'true',
    AUDITORIA_LGPD_RETENCAO_DIAS: '365',
    FHIR_BASE_URL: `${apiRoot}/api/fhir`,
    TISS_BASE_URL: `${apiRoot}/api/tiss`
  };

  if (process.env.PROD_DATABASE_URL) {
    const pooler = databaseUrlParaPooler(process.env.PROD_DATABASE_URL);
    vars.DATABASE_URL = pooler;
    if (pooler !== process.env.PROD_DATABASE_URL) {
      console.log('   ℹ️ PROD_DATABASE_URL convertida para pooler Supabase');
      persistirChaveEnv(ENV_FILE, 'PROD_DATABASE_URL', pooler);
    }
  }
  if (process.env.PROD_JWT_SECRET) vars.JWT_SECRET = process.env.PROD_JWT_SECRET;

  await render.upsertEnvMap(svc.id, vars);

  if (!FLAGS.noDeploy) await render.triggerDeploy(svc.id);
  return svc;
}

async function main() {
  console.log('\n🔧 Sincronizar Render — Integrativo.App\n');
  if (!loadEnvFile(ENV_FILE)) {
    console.error('❌ Crie .env.alfa a partir de .env.alfa.example (precisa de RENDER_API_KEY).');
    process.exit(1);
  }

  autoPreencherSupabase(ENV_FILE, { clipboard: FLAGS.colar });

  const render = createRenderClient({
    apiKey: process.env.RENDER_API_KEY,
    dryRun: FLAGS.dryRun
  });

  console.log(`   Repo GitHub alvo: ${GITHUB_REPO} @ ${GITHUB_BRANCH} (${ROOT_DIR}/)`);
  if (FLAGS.dryRun) console.log('   Modo dry-run — nada será gravado no Render\n');

  if (!FLAGS.prodOnly) await configurarAlfa(render);
  if (!FLAGS.alfaOnly) await configurarProducao(render);

  console.log('\n✅ Sincronização concluída.');
  console.log(`   Produção site: ${SITE_CANONICO}`);
  console.log(`   Alfa site:     ${process.env.ALFA_FRONTEND_URL || 'https://integrativoapp-alfa.vercel.app'}`);
  console.log('   Aguarde 2–5 min por serviço até status Live no Render.\n');
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
