/**
 * Prepara DATABASE_URL (pooler Supabase), persiste .env.alfa e copia LIVEKIT quando necessário.
 */
const fs = require('fs');
const {
  databaseUrlParaPooler,
  precisaPooler,
  REGIAO_PADRAO
} = require('../../backend/utils/supabase-pooler');

function persistirChaveEnv(envFile, key, value) {
  if (!envFile || !fs.existsSync(envFile) || !value) return false;
  let content = fs.readFileSync(envFile, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  const linha = `${key}=${value}`;
  if (re.test(content)) {
    const next = content.replace(re, linha);
    if (next === content) return false;
    fs.writeFileSync(envFile, next, 'utf8');
    return true;
  }
  fs.appendFileSync(envFile, `\n${linha}\n`, 'utf8');
  return true;
}

function isPlaceholderDatabaseUrl(url) {
  if (!url) return true;
  return /SUA_SENHA|SEU_PROJETO|xxxxxxxx|substitua|example/i.test(url);
}

function montarDatabaseUrlFromParts() {
  const ref = process.env.SUPABASE_PROJECT_REF;
  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!ref || !pass) return null;
  const senha = encodeURIComponent(pass);
  return `postgresql://postgres:${senha}@db.${ref}.supabase.co:5432/postgres`;
}

function extrairUriPostgres(texto) {
  if (!texto || typeof texto !== 'string') return null;
  const m = texto.match(/postgres(?:ql)?:\/\/[^\s'"<>]+/i);
  return m ? m[0].trim() : null;
}

function lerDatabaseUrlClipboard() {
  const { execSync } = require('child_process');
  try {
    if (process.platform === 'win32') {
      const raw = execSync('powershell -NoProfile -Command "Get-Clipboard -Raw"', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      return extrairUriPostgres(raw);
    }
    if (process.platform === 'darwin') {
      const raw = execSync('pbpaste', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      return extrairUriPostgres(raw);
    }
    const raw = execSync('xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output 2>/dev/null', {
      encoding: 'utf8',
      shell: true,
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return extrairUriPostgres(raw);
  } catch {
    return null;
  }
}

/**
 * Preenche DATABASE_URL sem abrir o .env.alfa manualmente:
 * 1) SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD
 * 2) área de transferência (--colar / AUTO_SUPABASE_CLIPBOARD)
 * 3) conversão para pooler + gravação no .env.alfa
 */
function autoPreencherSupabase(envFile, { clipboard = false, silencioso = false } = {}) {
  const usarClipboard = clipboard || process.env.AUTO_SUPABASE_CLIPBOARD === 'true';

  if (process.env.DATABASE_URL && !isPlaceholderDatabaseUrl(process.env.DATABASE_URL)) {
    return prepararSupabaseLocal(envFile, { silencioso });
  }

  const fromParts = montarDatabaseUrlFromParts();
  if (fromParts) {
    const pooler = aplicarPoolerLocal(fromParts);
    process.env.DATABASE_URL = pooler;
    if (envFile) persistirChaveEnv(envFile, 'DATABASE_URL', pooler);
    if (!silencioso) console.log('   ✓ DATABASE_URL montada (SUPABASE_PROJECT_REF + senha) → pooler');
    return pooler;
  }

  if (usarClipboard) {
    const clip = lerDatabaseUrlClipboard();
    if (clip) {
      const pooler = aplicarPoolerLocal(clip) || clip;
      process.env.DATABASE_URL = pooler;
      if (envFile) persistirChaveEnv(envFile, 'DATABASE_URL', pooler);
      if (!silencioso) console.log('   ✓ DATABASE_URL colada do clipboard → pooler Supabase');
      return pooler;
    }
    if (!silencioso) console.log('   ⚠️ Clipboard sem URI postgresql:// — copie no Supabase e use --colar');
  }

  return prepararSupabaseLocal(envFile, { silencioso });
}

function aplicarPoolerLocal(url, regiao = REGIAO_PADRAO) {
  return databaseUrlParaPooler(url, regiao);
}

/**
 * Converte DATABASE_URL local para pooler e grava em .env.alfa (sem expor senha no log).
 */
function prepararSupabaseLocal(envFile, { silencioso = false } = {}) {
  const regiao = process.env.SUPABASE_POOLER_REGION || REGIAO_PADRAO;
  const candidatos = [
    process.env.DATABASE_URL,
    process.env.PROD_DATABASE_URL
  ].filter(Boolean);

  for (const raw of candidatos) {
    const pooler = aplicarPoolerLocal(raw, regiao);
    if (!pooler) continue;
    if (pooler !== raw && !silencioso) {
      console.log(`   ✓ DATABASE_URL → pooler Supabase (${regiao})`);
    }
    process.env.DATABASE_URL = pooler;
    if (envFile && pooler !== raw) {
      persistirChaveEnv(envFile, 'DATABASE_URL', pooler);
    }
    return pooler;
  }

  if (process.env.DATABASE_URL && precisaPooler(process.env.DATABASE_URL) && !silencioso) {
    console.log('   ⚠️ DATABASE_URL direta (db.*.supabase.co) — não foi possível converter automaticamente.');
  }
  return process.env.DATABASE_URL || null;
}

async function lerEnvRender(render, serviceId, key) {
  const data = await render.api('GET', `/services/${serviceId}/env-vars?limit=100`);
  const lista = Array.isArray(data) ? data : (data?.items || []);
  const row = lista.find((x) => (x.envVar || x).key === key);
  return row?.envVar?.value || row?.value || null;
}

async function resolverDatabaseUrlRemoto({ render, envFile, alfaServiceId }) {
  const regiao = process.env.SUPABASE_POOLER_REGION || REGIAO_PADRAO;

  if (process.env.DATABASE_URL) {
    return prepararSupabaseLocal(envFile);
  }

  const fontes = [];
  if (process.env.PROD_DATABASE_URL) {
    fontes.push({ nome: 'PROD_DATABASE_URL', url: process.env.PROD_DATABASE_URL });
  }
  try {
    const prod = await render.findService(process.env.RENDER_PROD_SERVICE_NAME || 'integra-backend-ynrd');
    const prodUrl = await lerEnvRender(render, prod.id, 'DATABASE_URL');
    if (prodUrl) fontes.push({ nome: 'Render produção', url: prodUrl });
  } catch { /* ignore */ }
  if (alfaServiceId) {
    const alfaUrl = await lerEnvRender(render, alfaServiceId, 'DATABASE_URL');
    if (alfaUrl) fontes.push({ nome: 'Render alfa', url: alfaUrl });
  }

  for (const { nome, url } of fontes) {
    const pooler = aplicarPoolerLocal(url, regiao) || url;
    if (!pooler) continue;
    process.env.DATABASE_URL = pooler;
    if (envFile) persistirChaveEnv(envFile, 'DATABASE_URL', pooler);
    console.log(`   ℹ️ DATABASE_URL obtida de ${nome} (pooler Supabase)`);
    return pooler;
  }

  return null;
}

async function livekitParaAlfa(render) {
  if (process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
    return {
      LIVEKIT_URL: process.env.LIVEKIT_URL,
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET
    };
  }
  try {
    const prod = await render.findService(process.env.RENDER_PROD_SERVICE_NAME || 'integra-backend-ynrd');
    const keys = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'];
    const out = {};
    for (const key of keys) {
      const val = await lerEnvRender(render, prod.id, key);
      if (val) out[key] = val;
    }
    if (Object.keys(out).length === 3) {
      console.log('   ℹ️ LIVEKIT copiado do Render produção');
      return out;
    }
  } catch { /* ignore */ }
  return {};
}

module.exports = {
  persistirChaveEnv,
  prepararSupabaseLocal,
  autoPreencherSupabase,
  resolverDatabaseUrlRemoto,
  livekitParaAlfa,
  aplicarPoolerLocal,
  databaseUrlParaPooler,
  montarDatabaseUrlFromParts,
  lerDatabaseUrlClipboard,
  isPlaceholderDatabaseUrl
};
