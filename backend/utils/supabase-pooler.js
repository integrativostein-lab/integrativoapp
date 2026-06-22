/**
 * Converte URI direta do Supabase (db.*.supabase.co) para pooler IPv4 no Render.
 * Região padrão: aws-1-sa-east-1 (Session mode, porta 5432).
 */
const REGIAO_PADRAO = process.env.SUPABASE_POOLER_REGION || 'aws-1-sa-east-1';

function databaseUrlParaPooler(url, regiao = REGIAO_PADRAO) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('pooler.supabase.com')) return url;

  const m = url.match(/postgresql:\/\/([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:5432\/(.+)/);
  if (!m || m[1] !== 'postgres') return url;

  const [, , pass, ref, db] = m;
  return `postgresql://postgres.${ref}:${pass}@${regiao}.pooler.supabase.com:5432/${db}`;
}

function hostDatabaseUrl(url) {
  if (!url) return '';
  try {
    return new URL(url.replace(/^postgresql:\/\//, 'http://')).hostname;
  } catch {
    return '';
  }
}

function precisaPooler(url) {
  const host = hostDatabaseUrl(url);
  return host.startsWith('db.') && host.endsWith('.supabase.co');
}

module.exports = {
  databaseUrlParaPooler,
  hostDatabaseUrl,
  precisaPooler,
  REGIAO_PADRAO
};
