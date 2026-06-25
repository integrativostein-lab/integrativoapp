const { modoTeste } = require('../config/ambiente');

/** Email padrão do criador (pode ser alterado no painel). */
const EMAIL_CRIADOR_PADRAO = 'integrativostein@gmail.com';

/** Planos em que o titular da conta atua como administrador da clínica/plataforma. */
const PLANOS_PAPEL_ADMIN = ['guardioes_floresta', 'pro', 'clinic', 'enterprise'];

let cacheEmailCriador = null;

function emailCriadorFromEnv() {
  return String(process.env.CRIADOR_EMAIL || '').trim().toLowerCase();
}

function invalidarCacheEmailCriador() {
  cacheEmailCriador = null;
}

/** @deprecated Use obterEmailCriador(db) — mantido para scripts síncronos. */
function emailCriador() {
  return emailCriadorFromEnv() || EMAIL_CRIADOR_PADRAO;
}

async function lerEmailCriadorDoBanco(db) {
  const r = await db.query(
    "SELECT valor FROM configuracoes WHERE chave = 'criador_email' AND usuario_id IS NULL LIMIT 1"
  ).catch(() => ({ rows: [] }));
  const valor = r.rows[0]?.valor;
  return valor ? String(valor).trim().toLowerCase() : '';
}

async function salvarEmailCriadorConfig(db, email) {
  const valor = String(email || '').trim().toLowerCase();
  if (!valor) throw new Error('Email do criador inválido');

  const ex = await db.query(
    "SELECT id FROM configuracoes WHERE chave = 'criador_email' AND usuario_id IS NULL LIMIT 1"
  );
  if (ex.rows.length) {
    await db.query('UPDATE configuracoes SET valor = $1 WHERE id = $2', [valor, ex.rows[0].id]);
  } else {
    await db.query(
      "INSERT INTO configuracoes (chave, valor, usuario_id) VALUES ('criador_email', $1, NULL)",
      [valor]
    );
  }
  invalidarCacheEmailCriador();
  return valor;
}

/** Ordem: banco (painel) → variável de ambiente → padrão Stein. */
async function obterEmailCriador(db) {
  if (cacheEmailCriador) return cacheEmailCriador;

  const doBanco = db ? await lerEmailCriadorDoBanco(db) : '';
  if (doBanco) {
    cacheEmailCriador = doBanco;
    return cacheEmailCriador;
  }

  const doEnv = emailCriadorFromEnv();
  cacheEmailCriador = doEnv || EMAIL_CRIADOR_PADRAO;
  return cacheEmailCriador;
}

function planoConcedePapelAdmin(plano) {
  const p = String(plano || '').toLowerCase();
  return PLANOS_PAPEL_ADMIN.includes(p);
}

async function ehContaCriador(db, usuario) {
  if (!usuario || usuario.tipo !== 'super_admin') return false;
  const criadorEmail = db ? await obterEmailCriador(db) : emailCriador();
  const email = String(usuario.email || '').trim().toLowerCase();
  if (email === criadorEmail) return true;
  if (modoTeste && email === 'admin@integra.com') return true;
  return false;
}

/** Assinante oficial — administra equipe e configurações no painel-admin. */
function ehAdminAssinante(usuario) {
  return usuario?.tipo === 'admin';
}

async function promoverAssinanteComoAdmin(db, usuarioId, plano) {
  if (modoTeste || !planoConcedePapelAdmin(plano)) return null;
  const r = await db.query(
    `UPDATE usuarios
     SET tipo = 'admin'
     WHERE id = $1 AND tipo = 'profissional'
     RETURNING id, tipo, email, plano`,
    [usuarioId]
  );
  return r.rows[0] || null;
}

function tipoInicialProfissional(plano) {
  if (modoTeste) return 'profissional';
  return planoConcedePapelAdmin(plano) ? 'admin' : 'profissional';
}

module.exports = {
  EMAIL_CRIADOR_PADRAO,
  PLANOS_PAPEL_ADMIN,
  emailCriador,
  emailCriadorFromEnv,
  invalidarCacheEmailCriador,
  obterEmailCriador,
  salvarEmailCriadorConfig,
  planoConcedePapelAdmin,
  ehContaCriador,
  ehAdminAssinante,
  promoverAssinanteComoAdmin,
  tipoInicialProfissional
};
