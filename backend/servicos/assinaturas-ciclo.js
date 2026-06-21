const db = require('../database');

/**
 * Encerra assinaturas canceladas cujo ciclo mensal já expirou
 * (status ativa + data_cancelamento + data_expiracao <= agora).
 */
async function processarAssinaturasExpiradas({ usuarioId = null } = {}) {
  try {
  const params = [];
  let filtroUsuario = '';

  if (usuarioId) {
    params.push(usuarioId);
    filtroUsuario = `AND a.usuario_id = $${params.length}`;
  }

  const r = await db.query(
    `SELECT a.id, a.usuario_id, a.plano, a.data_fim
     FROM assinaturas a
     WHERE a.status = 'ativa'
       AND a.cancelada_em IS NOT NULL
       AND a.data_fim IS NOT NULL
       AND a.data_fim <= CURRENT_DATE
       ${filtroUsuario}`,
    params
  );

  const ids = [];

  for (const ass of r.rows) {
    await db.query("UPDATE assinaturas SET status = 'expirada' WHERE id = $1", [ass.id]);
    await db.query(
      `UPDATE usuarios
       SET plano = 'freemium'
       WHERE id = $1`,
      [ass.usuario_id]
    );
    ids.push(ass.id);
  }

  if (ids.length > 0) {
    console.log(`[assinaturas-ciclo] ${ids.length} assinatura(s) expirada(s) após cancelamento: ${ids.join(', ')}`);
  }

  return { processadas: ids.length, ids };
  } catch (err) {
    console.error('[assinaturas-ciclo]', err.message);
    return { processadas: 0, ids: [] };
  }
}

module.exports = { processarAssinaturasExpiradas };
