const express = require('express');
const router = express.Router();

const db = require('../database');
const auditoria = require('../servicos/auditoria-lgpd');
const { autenticar } = require('../middlewares/autenticar');
const {
  VERSAO_SCHEMA,
  CAMPOS_ANAMNESE,
  idsPadraoAtivos,
  idsPadraoObrigatorios,
  campoPorId,
  calcularCamposPendentes,
  camposFiltrados
} = require('../config/anamnese-campos');

async function garantirTabelas() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS config_anamnese_parte1 (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      especialidade_id VARCHAR(255) NOT NULL,
      campos_ativos JSONB NOT NULL DEFAULT '[]',
      campos_obrigatorios JSONB NOT NULL DEFAULT '[]',
      versao_schema VARCHAR(20) DEFAULT '2.1',
      atualizado_em TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(usuario_id, especialidade_id)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS anamneses (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      profissional_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
      especialidade VARCHAR(255),
      parte1_respostas JSONB NOT NULL DEFAULT '{}',
      parte2_respostas JSONB NOT NULL DEFAULT '{}',
      campos_pendentes JSONB NOT NULL DEFAULT '[]',
      status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
      versao_schema VARCHAR(20) DEFAULT '2.1',
      criado_em TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

function sanitizarRespostas(respostas = {}) {
  const limpo = {};
  Object.keys(respostas || {}).forEach((id) => {
    if (!campoPorId(id)) return;
    const v = respostas[id];
    if (v === undefined || v === null) return;
    limpo[id] = typeof v === 'string' ? v.trim().slice(0, 8000) : v;
  });
  return limpo;
}

router.get('/schema-publico', (req, res) => {
  const ativos = idsPadraoAtivos();
  const campos = camposFiltrados({ parte: 1, idsAtivos: ativos });
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({
    versao: VERSAO_SCHEMA,
    finalidade: 'auto_diagnostico_orientativo',
    aviso_legal:
      'Formulário educativo. Não constitui diagnóstico médico nem substitui consulta profissional.',
    total: campos.length,
    campos,
    padrao: {
      ativos,
      obrigatorios: idsPadraoObrigatorios().filter((id) => ativos.includes(id))
    }
  });
});

router.get('/schema', autenticar, (req, res) => {
  res.json({
    versao: VERSAO_SCHEMA,
    total: CAMPOS_ANAMNESE.length,
    campos: CAMPOS_ANAMNESE,
    padrao: { ativos: idsPadraoAtivos(), obrigatorios: idsPadraoObrigatorios() }
  });
});

async function buscarConfigAnamnese(usuarioId, especialidade) {
  const r = await db.query(
    'SELECT campos_ativos, campos_obrigatorios, versao_schema FROM config_anamnese_parte1 WHERE usuario_id = $1 AND especialidade_id = $2',
    [usuarioId, especialidade]
  );
  if (r.rows.length === 0) {
    return {
      especialidade_id: especialidade,
      campos_ativos: idsPadraoAtivos(),
      campos_obrigatorios: idsPadraoObrigatorios(),
      versao_schema: VERSAO_SCHEMA,
      padrao: true
    };
  }
  const row = r.rows[0];
  return {
    especialidade_id: especialidade,
    campos_ativos: typeof row.campos_ativos === 'string' ? JSON.parse(row.campos_ativos) : row.campos_ativos,
    campos_obrigatorios: typeof row.campos_obrigatorios === 'string' ? JSON.parse(row.campos_obrigatorios) : row.campos_obrigatorios,
    versao_schema: row.versao_schema || VERSAO_SCHEMA,
    padrao: false
  };
}

router.get('/config/:especialidade', autenticar, async (req, res) => {
  await garantirTabelas();
  const esp = decodeURIComponent(req.params.especialidade || '');
  res.json(await buscarConfigAnamnese(req.usuario.id, esp));
});

router.put('/config/:especialidade', autenticar, async (req, res) => {
  if (req.usuario.tipo !== 'profissional' && req.usuario.tipo !== 'admin' && req.usuario.tipo !== 'super_admin') {
    return res.status(403).json({ erro: 'Apenas profissionais podem configurar a anamnese.' });
  }
  await garantirTabelas();
  const esp = decodeURIComponent(req.params.especialidade || '');
  const { campos_ativos, campos_obrigatorios } = req.body;
  const ativos = (campos_ativos || []).filter((id) => campoPorId(id));
  const obrigatorios = (campos_obrigatorios || []).filter((id) => ativos.includes(id));

  const ex = await db.query(
    'SELECT id FROM config_anamnese_parte1 WHERE usuario_id = $1 AND especialidade_id = $2',
    [req.usuario.id, esp]
  );
  if (ex.rows.length > 0) {
    await db.query(
      'UPDATE config_anamnese_parte1 SET campos_ativos = $1, campos_obrigatorios = $2, versao_schema = $3, atualizado_em = NOW() WHERE id = $4',
      [JSON.stringify(ativos), JSON.stringify(obrigatorios), VERSAO_SCHEMA, ex.rows[0].id]
    );
  } else {
    await db.query(
      'INSERT INTO config_anamnese_parte1 (usuario_id, especialidade_id, campos_ativos, campos_obrigatorios, versao_schema) VALUES ($1, $2, $3, $4, $5)',
      [req.usuario.id, esp, JSON.stringify(ativos), JSON.stringify(obrigatorios), VERSAO_SCHEMA]
    );
  }

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
    acao: 'config_anamnese',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'personalização do formulário de anamnese integrativa',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'config_anamnese',
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: { especialidade: esp, total_ativos: ativos.length }
  });

  res.json({ mensagem: 'Configuração da anamnese salva!', campos_ativos: ativos, campos_obrigatorios: obrigatorios });
});

router.get('/config-profissional/:profissionalId/:especialidade', autenticar, async (req, res) => {
  await garantirTabelas();
  const profId = parseInt(req.params.profissionalId, 10);
  const esp = decodeURIComponent(req.params.especialidade || '');
  if (!profId) return res.status(400).json({ erro: 'profissional_id inválido.' });

  const relacao = await db.query(
    `SELECT 1 FROM agendamentos
     WHERE paciente_id = $1 AND profissional_id = $2
     LIMIT 1`,
    [req.usuario.id, profId]
  );
  const isProf = req.usuario.id === profId;
  const isStaff = req.usuario.tipo === 'admin' || req.usuario.tipo === 'super_admin';
  if (!isProf && !isStaff && relacao.rows.length === 0) {
    return res.status(403).json({ erro: 'Sem vínculo com este profissional.' });
  }

  res.json(await buscarConfigAnamnese(profId, esp));
});

router.post('/', autenticar, async (req, res) => {
  await garantirTabelas();
  const { paciente_id, profissional_id, agendamento_id, especialidade, parte1_respostas, parte2_respostas } = req.body;
  const isProf = req.usuario.tipo === 'profissional' || req.usuario.tipo === 'admin' || req.usuario.tipo === 'super_admin';
  const isPaciente = req.usuario.tipo === 'paciente';

  let profId = profissional_id;
  let pacId = paciente_id;

  if (isPaciente) {
    pacId = req.usuario.id;
    if (!profId) return res.status(400).json({ erro: 'profissional_id é obrigatório.' });
  } else if (isProf) {
    profId = req.usuario.id;
    if (!pacId) return res.status(400).json({ erro: 'paciente_id é obrigatório.' });
  } else {
    return res.status(403).json({ erro: 'Tipo de usuário não autorizado.' });
  }

  const p1 = sanitizarRespostas(parte1_respostas);
  const p2 = isProf ? sanitizarRespostas(parte2_respostas) : {};

  let configObrig = idsPadraoObrigatorios();
  if (especialidade) {
    const cfg = await db.query(
      'SELECT campos_obrigatorios FROM config_anamnese_parte1 WHERE usuario_id = $1 AND especialidade_id = $2',
      [profId, especialidade]
    );
    if (cfg.rows.length > 0) {
      configObrig = typeof cfg.rows[0].campos_obrigatorios === 'string'
        ? JSON.parse(cfg.rows[0].campos_obrigatorios)
        : cfg.rows[0].campos_obrigatorios;
    }
  }

  const pendentes = calcularCamposPendentes(p1, configObrig);
  const status = Object.keys(p2).length > 0 ? 'concluida' : (pendentes.length === 0 ? 'parte1_concluida' : 'rascunho');

  const r = await db.query(
    `INSERT INTO anamneses (paciente_id, profissional_id, agendamento_id, especialidade, parte1_respostas, parte2_respostas, campos_pendentes, status, versao_schema)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, status, campos_pendentes`,
    [pacId, profId, agendamento_id || null, especialidade || null, JSON.stringify(p1), JSON.stringify(p2), JSON.stringify(pendentes), status, VERSAO_SCHEMA]
  );

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
    acao: 'criacao_anamnese',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'registro de anamnese integrativa',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'anamnese',
    recurso_id: r.rows[0].id,
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: { paciente_id: pacId, profissional_id: profId, status }
  });

  res.status(201).json({
    mensagem: 'Anamnese registrada!',
    id: r.rows[0].id,
    status: r.rows[0].status,
    campos_pendentes: r.rows[0].campos_pendentes
  });
});

router.put('/:id', autenticar, async (req, res) => {
  await garantirTabelas();
  const { parte1_respostas, parte2_respostas, status: statusBody } = req.body;
  const atual = await db.query('SELECT * FROM anamneses WHERE id = $1', [req.params.id]);
  if (atual.rows.length === 0) return res.status(404).json({ erro: 'Anamnese não encontrada.' });

  const row = atual.rows[0];
  const isProf = req.usuario.id === row.profissional_id || req.usuario.tipo === 'admin' || req.usuario.tipo === 'super_admin';
  const isPaciente = req.usuario.id === row.paciente_id;

  if (!isProf && !isPaciente) return res.status(403).json({ erro: 'Acesso negado.' });

  let p1 = typeof row.parte1_respostas === 'string' ? JSON.parse(row.parte1_respostas) : (row.parte1_respostas || {});
  let p2 = typeof row.parte2_respostas === 'string' ? JSON.parse(row.parte2_respostas) : (row.parte2_respostas || {});

  if (parte1_respostas && (isPaciente || isProf)) {
    p1 = { ...p1, ...sanitizarRespostas(parte1_respostas) };
  }
  if (parte2_respostas && isProf) {
    p2 = { ...p2, ...sanitizarRespostas(parte2_respostas) };
  }

  let configObrig = idsPadraoObrigatorios();
  if (row.especialidade) {
    const cfg = await db.query(
      'SELECT campos_obrigatorios FROM config_anamnese_parte1 WHERE usuario_id = $1 AND especialidade_id = $2',
      [row.profissional_id, row.especialidade]
    );
    if (cfg.rows.length > 0) {
      configObrig = typeof cfg.rows[0].campos_obrigatorios === 'string'
        ? JSON.parse(cfg.rows[0].campos_obrigatorios)
        : cfg.rows[0].campos_obrigatorios;
    }
  }

  const pendentes = calcularCamposPendentes(p1, configObrig);
  let status = statusBody;
  if (!status) {
    status = Object.keys(p2).length > 0 ? 'concluida' : (pendentes.length === 0 ? 'parte1_concluida' : 'rascunho');
  }

  await db.query(
    `UPDATE anamneses SET parte1_respostas = $1, parte2_respostas = $2, campos_pendentes = $3, status = $4, atualizado_em = NOW() WHERE id = $5`,
    [JSON.stringify(p1), JSON.stringify(p2), JSON.stringify(pendentes), status, req.params.id]
  );

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
    acao: 'alteracao_anamnese',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'atualização de anamnese integrativa',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'anamnese',
    recurso_id: req.params.id,
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: { status, pendentes: pendentes.length }
  });

  res.json({ mensagem: 'Anamnese atualizada!', status, campos_pendentes: pendentes });
});

router.get('/:id', autenticar, async (req, res) => {
  await garantirTabelas();
  const r = await db.query(
    `SELECT a.*, up.nome AS paciente_nome, uf.nome AS profissional_nome
     FROM anamneses a
     JOIN usuarios up ON up.id = a.paciente_id
     JOIN usuarios uf ON uf.id = a.profissional_id
     WHERE a.id = $1`,
    [req.params.id]
  );
  if (r.rows.length === 0) return res.status(404).json({ erro: 'Anamnese não encontrada.' });
  const row = r.rows[0];
  if (req.usuario.id !== row.paciente_id && req.usuario.id !== row.profissional_id
    && req.usuario.tipo !== 'admin' && req.usuario.tipo !== 'super_admin') {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }
  res.json(row);
});

router.get('/paciente/minhas', autenticar, async (req, res) => {
  await garantirTabelas();
  const r = await db.query(
    `SELECT a.id, a.especialidade, a.status, a.campos_pendentes, a.criado_em, a.atualizado_em, uf.nome AS profissional_nome
     FROM anamneses a
     JOIN usuarios uf ON uf.id = a.profissional_id
     WHERE a.paciente_id = $1
     ORDER BY a.atualizado_em DESC
     LIMIT 50`,
    [req.usuario.id]
  );
  res.json(r.rows);
});

router.get('/profissional/lista', autenticar, async (req, res) => {
  if (req.usuario.tipo !== 'profissional' && req.usuario.tipo !== 'admin' && req.usuario.tipo !== 'super_admin') {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }
  await garantirTabelas();
  const { paciente_id } = req.query;
  let q = `SELECT a.id, a.paciente_id, a.especialidade, a.status, a.campos_pendentes, a.criado_em, a.atualizado_em, up.nome AS paciente_nome
           FROM anamneses a
           JOIN usuarios up ON up.id = a.paciente_id
           WHERE a.profissional_id = $1`;
  const params = [req.usuario.id];
  if (paciente_id) {
    q += ' AND a.paciente_id = $2';
    params.push(paciente_id);
  }
  q += ' ORDER BY a.atualizado_em DESC LIMIT 100';
  const r = await db.query(q, params);
  res.json(r.rows);
});

module.exports = router;
