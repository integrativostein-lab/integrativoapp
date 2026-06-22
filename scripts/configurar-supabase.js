#!/usr/bin/env node
/**
 * Configura DATABASE_URL no .env.alfa automaticamente.
 *
 * Opção A — copie a URI no Supabase e rode:
 *   node scripts/configurar-supabase.js --colar
 *
 * Opção B — defina no .env.alfa e rode:
 *   SUPABASE_PROJECT_REF=xxx
 *   SUPABASE_DB_PASSWORD=xxx
 *   node scripts/configurar-supabase.js
 *
 * Opção C — já configurado no Render produção (sem .env local):
 *   node scripts/sincronizar-render.js --alfa-only
 */
const path = require('path');
const { loadEnvFile } = require('./lib/render-api');
const { autoPreencherSupabase, resolverDatabaseUrlRemoto } = require('./lib/supabase-env');
const { createRenderClient } = require('./lib/render-api');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.alfa');
const colar = process.argv.includes('--colar') || process.argv.includes('--clipboard');

async function main() {
  console.log('\n🔌 Configurar Supabase → .env.alfa\n');
  if (!loadEnvFile(ENV_FILE)) {
    console.error('❌ Crie .env.alfa a partir de .env.alfa.example');
    process.exit(1);
  }

  const url = autoPreencherSupabase(ENV_FILE, { clipboard: colar });
  if (url) {
    console.log('\n✅ DATABASE_URL pronta (pooler IPv4 para Render).');
    return;
  }

  if (process.env.RENDER_API_KEY) {
    const render = createRenderClient({ apiKey: process.env.RENDER_API_KEY });
    const remota = await resolverDatabaseUrlRemoto({ render, envFile: ENV_FILE });
    if (remota) {
      console.log('\n✅ DATABASE_URL obtida do Render.');
      return;
    }
  }

  console.error('\n❌ Não foi possível obter DATABASE_URL.');
  console.error('   Copie a URI no Supabase → node scripts/configurar-supabase.js --colar');
  console.error('   Ou preencha SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD no .env.alfa');
  process.exit(1);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
