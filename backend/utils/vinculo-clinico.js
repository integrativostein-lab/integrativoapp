const db = require('../database');

/** Verifica vínculo mínimo profissional ↔ paciente (agendamento existente). */
async function temVinculoClinico(profissionalId, pacienteId) {
  const r = await db.query(
    `SELECT 1 FROM agendamentos
     WHERE profissional_id = $1 AND paciente_id = $2
     LIMIT 1`,
    [profissionalId, pacienteId]
  );
  return r.rows.length > 0;
}

module.exports = { temVinculoClinico };
