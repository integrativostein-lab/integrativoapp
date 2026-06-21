const db = require('../database');

/**
 * Encerra assinaturas canceladas cujo ciclo mensal já expirou
 * (status ativa + data_cancelamento + data_expiracao <= agora).
 */
async function processarAssinaturasExpiradas({ usuarioId = null } = {}) {
  const params = [];
  let filtroUsuario = '';

  if (usuarioId) {
    params.push(usuarioId);
    filtroUsuario = `AND a.usuario_id = $${params.length}`;
  }

  const r = await db.query(
    `SELECT a.id, a.usuario_id, a.plano, a.data_expiracao
     FROM assinaturas a
     WHERE a.status = 'ativa'
       AND a.data_cancelamento IS NOT NULL
       AND a.data_expiracao IS NOT NULL
       AND a.data_expiracao <= NOW()
       ${filtroUsuario}`,
    params
  );

  const ids = [];

  for (const ass of r.rows) {
    await db.query("UPDATE assinaturas SET status = 'expirada' WHERE id = $1", [ass.id]);
    await db.query(
      `UPDATE usuarios
       SET plano = 'freemium',
           assinatura_ativa = 0,
           data_expiracao_assinatura = NULL
       WHERE id = $1`,
      [ass.usuario_id]
    );
    ids.push(ass.id);
  }

  if (ids.length > 0) {
    console.log(`[assinaturas-ciclo] ${ids.length} assinatura(s) expirada(s) após cancelamento: ${ids.join(', ')}`);
  }

  return { processadas: ids.length, ids };
}

module.exports = { processarAssinaturasExpiradas };
