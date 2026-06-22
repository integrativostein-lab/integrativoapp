/**
 * Variáveis e ajustes do serviço Render alfa (compartilhado entre deploy-alfa e sincronizar-render).
 */
const crypto = require('crypto');
const { CORS_ALFA } = require('../../backend/config/dominios');
const { databaseUrlParaPooler } = require('../../backend/utils/supabase-pooler');
const { livekitParaAlfa } = require('./supabase-env');

async function lerJwtAlfa(render, serviceId) {
  let jwt = process.env.JWT_SECRET;
  if (jwt) return jwt;
  try {
    const envs = await render.api('GET', `/services/${serviceId}/env-vars?limit=100`);
    const lista = Array.isArray(envs) ? envs : (envs?.items || []);
    const row = lista.find((x) => (x.envVar || x).key === 'JWT_SECRET');
    jwt = row?.envVar?.value || row?.value;
    if (jwt) console.log('   ℹ️ JWT_SECRET preservado do Render (alfa)');
  } catch { /* ignore */ }
  return jwt || crypto.randomBytes(32).toString('hex');
}

async function aplicarAlfaRender(render, svc, {
  dryRun = false,
  skipRepo = false,
  noDeploy = false,
  githubRepo,
  githubBranch,
  rootDir,
  envFile
} = {}) {
  const repo = githubRepo || process.env.GITHUB_REPO || 'integrativostein-lab/integrativoapp';
  const branch = githubBranch || process.env.GITHUB_BRANCH || 'master';
  const root = rootDir || process.env.RENDER_ROOT_DIR || 'backend';

  if (!skipRepo) {
    await render.updateRepo(svc.id, { repo, branch, rootDir: root });
  }

  await render.updateBuildCommands(svc.id, {
    buildCommand: 'npm install',
    startCommand: 'npm start'
  });

  const apiRoot = (process.env.ALFA_API_URL || 'https://integrativoappespelho.onrender.com/api').replace(/\/api\/?$/, '');
  const cors = process.env.CORS_ORIGINS || process.env.ALFA_CORS_ORIGINS || CORS_ALFA;
  const jwt = await lerJwtAlfa(render, svc.id);

  let databaseUrl = databaseUrlParaPooler(process.env.DATABASE_URL);
  if (!databaseUrl) {
    console.log('   ⚠️ DATABASE_URL ausente — configure .env.alfa ou Render produção');
  } else if (process.env.DATABASE_URL && databaseUrl !== process.env.DATABASE_URL) {
    console.log('   ℹ️ DATABASE_URL convertida para pooler Supabase (IPv4)');
  }

  const livekit = await livekitParaAlfa(render);

  await render.upsertEnvMap(svc.id, {
    NODE_ENV: 'test',
    PORT: '10000',
    NODE_OPTIONS: '--dns-result-order=ipv4first',
    TEST_MODE: 'true',
    SIMULAR_NF_SEM_CERTIFICADO: 'true',
    RECURSOS_CLINICOS_ATIVOS: 'false',
    CORS_ORIGINS: cors,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwt,
    EVOLUTION_SIMULATE: 'true',
    RNDS_ENABLED: 'false',
    AUDITORIA_LGPD_ATIVA: 'true',
    AUDITORIA_LGPD_RETENCAO_DIAS: '365',
    FHIR_BASE_URL: `${apiRoot}/api/fhir`,
    TISS_BASE_URL: `${apiRoot}/api/tiss`,
    ...livekit
  });

  if (!noDeploy && !dryRun) {
    await render.triggerDeploy(svc.id);
  }

  return { jwt, databaseUrl };
}

module.exports = { aplicarAlfaRender, lerJwtAlfa };
