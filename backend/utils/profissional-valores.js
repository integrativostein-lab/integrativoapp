const db = require('../database');

const PADROES = {
  valor_online: 150,
  valor_presencial: 200,
  valor_domicilio: 250,
  duracao_minutos: 60
};

async function resolverEspecialidadeId(usuarioId) {
  const usuario = await db.query('SELECT especialidades FROM usuarios WHERE id = $1', [usuarioId]);
  const raw = usuario.rows[0]?.especialidades;
  if (raw) {
    try {
      const lista = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const primeiro = Array.isArray(lista) ? lista[0] : null;
      if (primeiro) {
        const porNome = await db.query('SELECT id FROM especialidades WHERE nome = $1 LIMIT 1', [primeiro]);
        if (porNome.rows.length) return porNome.rows[0].id;
      }
    } catch (e) {
      /* ignora JSON inválido */
    }
  }

  const fallback = await db.query('SELECT id FROM especialidades ORDER BY id ASC LIMIT 1');
  return fallback.rows[0]?.id || null;
}

async function garantirValoresPadrao(usuarioId, opcoes = {}) {
  if (!usuarioId) return null;

  const existente = await db.query(
    'SELECT id FROM profissional_valores WHERE usuario_id = $1 LIMIT 1',
    [usuarioId]
  );
  if (existente.rows.length) return existente.rows[0].id;

  const especialidadeId = opcoes.especialidade_id || await resolverEspecialidadeId(usuarioId);
  if (!especialidadeId) return null;

  const valores = { ...PADROES, ...opcoes };
  const inserido = await db.query(
    `INSERT INTO profissional_valores
      (usuario_id, especialidade_id, valor_online, valor_presencial, valor_domicilio, duracao_minutos)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      usuarioId,
      especialidadeId,
      valores.valor_online,
      valores.valor_presencial,
      valores.valor_domicilio,
      valores.duracao_minutos
    ]
  ).catch(async () => {
    const duplicado = await db.query(
      'SELECT id FROM profissional_valores WHERE usuario_id = $1 AND especialidade_id = $2 LIMIT 1',
      [usuarioId, especialidadeId]
    );
    if (duplicado.rows.length) return duplicado;

    return db.query(
      `INSERT INTO profissional_valores
        (usuario_id, especialidade_id, valor_online, valor_presencial, valor_domicilio, duracao_minutos)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        usuarioId,
        especialidadeId,
        valores.valor_online,
        valores.valor_presencial,
        valores.valor_domicilio,
        valores.duracao_minutos
      ]
    );
  });

  return inserido.rows[0]?.id || null;
}

async function buscarValoresAgendamento(profissionalId) {
  let r = await db.query(
    'SELECT valor_online, valor_presencial, valor_domicilio, duracao_minutos FROM profissional_valores WHERE usuario_id = $1 LIMIT 1',
    [profissionalId]
  );
  if (r.rows.length) return r.rows[0];

  await garantirValoresPadrao(profissionalId);
  r = await db.query(
    'SELECT valor_online, valor_presencial, valor_domicilio, duracao_minutos FROM profissional_valores WHERE usuario_id = $1 LIMIT 1',
    [profissionalId]
  );
  return r.rows[0] || null;
}

module.exports = {
  PADROES,
  resolverEspecialidadeId,
  garantirValoresPadrao,
  buscarValoresAgendamento
};
