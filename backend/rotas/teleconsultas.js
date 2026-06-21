const express = require('express');
const jwt = require('jsonwebtoken');
const { AccessToken } = require('livekit-server-sdk');
const db = require('../database');
const auditoria = require('../servicos/auditoria-lgpd');
const { BASES_LEGAIS, TEXTO_CONSENTIMENTO, LIMITES_ATENDIMENTO } = require('../config/teleconsulta-normas');

const router = express.Router();

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido' });
  }
}

function normalizarSala(agendamentoId) {
  return `teleconsulta-${agendamentoId}`;
}

async function garantirTabelas() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS teleconsultas_sessoes (
      id SERIAL PRIMARY KEY,
      agendamento_id INTEGER NOT NULL UNIQUE REFERENCES agendamentos(id) ON DELETE CASCADE,
      paciente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      profissional_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      consentimento_paciente_em TIMESTAMPTZ,
      consentimento_profissional_em TIMESTAMPTZ,
      consentimento_gravacao_paciente_em TIMESTAMPTZ,
      consentimento_gravacao_prof_em TIMESTAMPTZ,
      limites_informados_paciente BOOLEAN DEFAULT FALSE,
      limites_informados_prof BOOLEAN DEFAULT FALSE,
      direito_presencial_reconhecido BOOLEAN DEFAULT FALSE,
      optou_atendimento_presencial BOOLEAN DEFAULT FALSE,
      consentimento_ip TEXT,
      consentimento_user_agent TEXT,
      inicio_em TIMESTAMPTZ,
      fim_em TIMESTAMPTZ,
      duracao_segundos INTEGER,
      status VARCHAR(40) NOT NULL DEFAULT 'pendente_consentimento',
      notas_encerramento TEXT,
      bases_legais JSONB DEFAULT '[]',
      criado_em TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function buscarAgendamento(id, usuarioId) {
  const r = await db.query('SELECT * FROM agendamentos WHERE id = $1', [id]);
  if (r.rows.length === 0) return null;
  const ag = r.rows[0];
  const isPaciente = ag.paciente_id === usuarioId;
  const isProf = ag.profissional_id === usuarioId;
  if (!isPaciente && !isProf) return { negado: true };
  return { ag, papel: isPaciente ? 'paciente' : 'profissional' };
}

async function obterOuCriarSessao(ag) {
  let s = await db.query('SELECT * FROM teleconsultas_sessoes WHERE agendamento_id = $1', [ag.id]);
  if (s.rows.length > 0) return s.rows[0];
  const ins = await db.query(
    `INSERT INTO teleconsultas_sessoes (agendamento_id, paciente_id, profissional_id, bases_legais)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [ag.id, ag.paciente_id, ag.profissional_id, JSON.stringify(BASES_LEGAIS)]
  );
  return ins.rows[0];
}

function consentimentoCompleto(sessao) {
  return !!(sessao.consentimento_paciente_em && sessao.consentimento_profissional_em);
}

router.get('/normas', autenticar, (req, res) => {
  res.json({
    bases_legais: BASES_LEGAIS,
    consentimento: TEXTO_CONSENTIMENTO,
    limites: LIMITES_ATENDIMENTO,
    gravacao: {
      exige_consentimento_especifico: true,
      referencia: 'Res. CFM 2.314/2022 Art. 15 e LGPD Art. 7º, I',
      retencao_padrao_dias: 7,
      observacao: 'Gravação só com autorização expressa de todos os participantes; integra o prontuário quando habilitada.'
    },
    prontuario: {
      registro_obrigatorio: true,
      referencia: 'Lei 14.510/2022 Art. 26-G · CFM 2.314/2022 Art. 3º §1º',
      observacao: 'Cada sessão gera registro auditável vinculado ao agendamento/prontuário.'
    }
  });
});

router.get('/agendamento/:id/preparacao', autenticar, async (req, res) => {
  await garantirTabelas();
  const dados = await buscarAgendamento(req.params.id, req.usuario.id);
  if (!dados) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  if (dados.negado) return res.status(403).json({ erro: 'Acesso negado a este agendamento.' });

  const { ag, papel } = dados;
  if (ag.modalidade !== 'online') {
    return res.status(400).json({ erro: 'Este agendamento não é teleconsulta (modalidade online).' });
  }
  if (['cancelado'].includes(ag.status)) {
    return res.status(400).json({ erro: 'Agendamento cancelado.' });
  }

  const sessao = await obterOuCriarSessao(ag);
  const meuConsentimento = papel === 'paciente'
    ? sessao.consentimento_paciente_em
    : sessao.consentimento_profissional_em;

  res.json({
    agendamento_id: ag.id,
    sala: normalizarSala(ag.id),
    papel,
    status_agendamento: ag.status,
    status_sessao: sessao.status,
    consentimento: {
      paciente: sessao.consentimento_paciente_em,
      profissional: sessao.consentimento_profissional_em,
      completo: consentimentoCompleto(sessao),
      meu_consentimento: meuConsentimento
    },
    gravacao: {
      paciente: sessao.consentimento_gravacao_paciente_em,
      profissional: sessao.consentimento_gravacao_prof_em,
      habilitada: !!(sessao.consentimento_gravacao_paciente_em && sessao.consentimento_gravacao_prof_em)
    },
    optou_presencial: sessao.optou_atendimento_presencial,
    pode_entrar: consentimentoCompleto(sessao) && !sessao.optou_atendimento_presencial
      && !['realizado', 'cancelado'].includes(ag.status),
    bases_legais: BASES_LEGAIS,
    texto_consentimento: TEXTO_CONSENTIMENTO,
    limites: LIMITES_ATENDIMENTO
  });
});

router.post('/agendamento/:id/consentir-telessaude', autenticar, async (req, res) => {
  await garantirTabelas();
  const { limites_informados, direito_presencial_reconhecido } = req.body;
  const dados = await buscarAgendamento(req.params.id, req.usuario.id);
  if (!dados || dados.negado) return res.status(403).json({ erro: 'Acesso negado.' });

  const { ag, papel } = dados;
  if (ag.modalidade !== 'online') return res.status(400).json({ erro: 'Não é teleconsulta.' });

  const sessao = await obterOuCriarSessao(ag);
  const ip = req.ip;
  const ua = req.get('user-agent');

  if (papel === 'paciente') {
    await db.query(
      `UPDATE teleconsultas_sessoes SET
        consentimento_paciente_em = NOW(),
        limites_informados_paciente = $1,
        direito_presencial_reconhecido = $2,
        consentimento_ip = $3,
        consentimento_user_agent = $4,
        status = CASE WHEN consentimento_profissional_em IS NOT NULL THEN 'autorizada' ELSE 'pendente_consentimento' END,
        atualizado_em = NOW()
       WHERE agendamento_id = $5`,
      [limites_informados !== false, direito_presencial_reconhecido !== false, ip, ua, ag.id]
    );
  } else {
    await db.query(
      `UPDATE teleconsultas_sessoes SET
        consentimento_profissional_em = NOW(),
        limites_informados_prof = $1,
        consentimento_ip = COALESCE(consentimento_ip, $2),
        consentimento_user_agent = COALESCE(consentimento_user_agent, $3),
        status = CASE WHEN consentimento_paciente_em IS NOT NULL THEN 'autorizada' ELSE 'pendente_consentimento' END,
        atualizado_em = NOW()
       WHERE agendamento_id = $4`,
      [limites_informados !== false, ip, ua, ag.id]
    );
  }

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
    acao: 'consentimento_telessaude',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'registro de TCLE telessaúde conforme Lei 14.510/2022',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'teleconsulta',
    recurso_id: ag.id,
    rota: req.originalUrl,
    metodo: req.method,
    ip,
    user_agent: ua,
    detalhes: { papel, agendamento_id: ag.id }
  });

  const atual = await db.query('SELECT * FROM teleconsultas_sessoes WHERE agendamento_id = $1', [ag.id]);
  res.json({
    mensagem: 'Consentimento para telessaúde registrado no prontuário.',
    consentimento_completo: consentimentoCompleto(atual.rows[0])
  });
});

router.post('/agendamento/:id/optar-presencial', autenticar, async (req, res) => {
  await garantirTabelas();
  const dados = await buscarAgendamento(req.params.id, req.usuario.id);
  if (!dados || dados.negado) return res.status(403).json({ erro: 'Acesso negado.' });
  if (dados.papel !== 'paciente') {
    return res.status(403).json({ erro: 'Apenas o paciente registra preferência por atendimento presencial.' });
  }

  await obterOuCriarSessao(dados.ag);
  await db.query(
    `UPDATE teleconsultas_sessoes SET optou_atendimento_presencial = TRUE, status = 'recusada_presencial', atualizado_em = NOW()
     WHERE agendamento_id = $1`,
    [dados.ag.id]
  );

  res.json({
    mensagem: 'Preferência por atendimento presencial registrada. A teleconsulta não será iniciada. Solicite remarcação presencial ao profissional.',
    direito: 'Lei 14.510/2022 Art. 26-A, III'
  });
});

router.post('/agendamento/:id/consentir-gravacao', autenticar, async (req, res) => {
  await garantirTabelas();
  const { autoriza } = req.body;
  const dados = await buscarAgendamento(req.params.id, req.usuario.id);
  if (!dados || dados.negado) return res.status(403).json({ erro: 'Acesso negado.' });

  const sessao = await obterOuCriarSessao(dados.ag);
  if (!consentimentoCompleto(sessao)) {
    return res.status(400).json({ erro: 'Consentimento de telessaúde deve ser concluído antes da gravação.' });
  }

  if (dados.papel === 'paciente') {
    await db.query(
      'UPDATE teleconsultas_sessoes SET consentimento_gravacao_paciente_em = $1, atualizado_em = NOW() WHERE agendamento_id = $2',
      [autoriza ? new Date() : null, dados.ag.id]
    );
  } else {
    await db.query(
      'UPDATE teleconsultas_sessoes SET consentimento_gravacao_prof_em = $1, atualizado_em = NOW() WHERE agendamento_id = $2',
      [autoriza ? new Date() : null, dados.ag.id]
    );
  }

  const atual = await db.query('SELECT * FROM teleconsultas_sessoes WHERE agendamento_id = $1', [dados.ag.id]);
  const s = atual.rows[0];
  res.json({
    mensagem: autoriza ? 'Consentimento para gravação registrado.' : 'Gravação não autorizada por este participante.',
    gravacao_habilitada: !!(s.consentimento_gravacao_paciente_em && s.consentimento_gravacao_prof_em)
  });
});

router.post('/agendamento/:id/iniciar', autenticar, async (req, res) => {
  await garantirTabelas();
  const dados = await buscarAgendamento(req.params.id, req.usuario.id);
  if (!dados || dados.negado) return res.status(403).json({ erro: 'Acesso negado.' });

  const sessao = await obterOuCriarSessao(dados.ag);
  if (!consentimentoCompleto(sessao)) {
    return res.status(403).json({ erro: 'Consentimento de telessaúde incompleto. Paciente e profissional devem consentir antes da sala.' });
  }
  if (sessao.optou_atendimento_presencial) {
    return res.status(403).json({ erro: 'Paciente optou por atendimento presencial.' });
  }

  await db.query(
    `UPDATE teleconsultas_sessoes SET inicio_em = COALESCE(inicio_em, NOW()), status = 'em_andamento', atualizado_em = NOW() WHERE agendamento_id = $1`,
    [dados.ag.id]
  );
  await db.query("UPDATE agendamentos SET status = 'em_andamento' WHERE id = $1 AND status IN ('agendado', 'reagendado')", [dados.ag.id]);

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
    acao: 'inicio_teleconsulta',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'registro de início de teleconsulta no prontuário',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'teleconsulta',
    recurso_id: dados.ag.id,
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent')
  });

  res.json({ mensagem: 'Teleconsulta iniciada.', sala: normalizarSala(dados.ag.id), status: 'em_andamento' });
});

router.post('/agendamento/:id/encerrar', autenticar, async (req, res) => {
  await garantirTabelas();
  const { notas } = req.body;
  const dados = await buscarAgendamento(req.params.id, req.usuario.id);
  if (!dados || dados.negado) return res.status(403).json({ erro: 'Acesso negado.' });

  const sessao = await db.query('SELECT * FROM teleconsultas_sessoes WHERE agendamento_id = $1', [dados.ag.id]);
  if (sessao.rows.length === 0) return res.status(404).json({ erro: 'Sessão não encontrada.' });

  await db.query(
    `UPDATE teleconsultas_sessoes SET
      fim_em = NOW(),
      duracao_segundos = EXTRACT(EPOCH FROM (NOW() - COALESCE(inicio_em, criado_em)))::INTEGER,
      status = 'realizado',
      notas_encerramento = $1,
      atualizado_em = NOW()
     WHERE agendamento_id = $2`,
    [notas || null, dados.ag.id]
  );
  await db.query("UPDATE agendamentos SET status = 'realizado' WHERE id = $1", [dados.ag.id]);

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.DADOS_SENSIVEIS,
    acao: 'fim_teleconsulta',
    base_legal: auditoria.BASE_LEGAL.TUTELA_SAUDE,
    finalidade: 'registro de encerramento de teleconsulta no prontuário',
    usuario_id: req.usuario.id,
    usuario_tipo: req.usuario.tipo,
    email: req.usuario.email,
    recurso: 'teleconsulta',
    recurso_id: dados.ag.id,
    rota: req.originalUrl,
    metodo: req.method,
    ip: req.ip,
    user_agent: req.get('user-agent'),
    detalhes: { notas: notas ? '[informado]' : null }
  });

  res.json({ mensagem: 'Teleconsulta encerrada e registrada no prontuário.', status: 'realizado' });
});

router.get('/agendamento/:id/registro', autenticar, async (req, res) => {
  await garantirTabelas();
  const dados = await buscarAgendamento(req.params.id, req.usuario.id);
  if (!dados || dados.negado) return res.status(403).json({ erro: 'Acesso negado.' });

  const r = await db.query(
    `SELECT ts.*, a.data_agendamento, a.horario_inicio, a.horario_fim, a.modalidade
     FROM teleconsultas_sessoes ts
     JOIN agendamentos a ON a.id = ts.agendamento_id
     WHERE ts.agendamento_id = $1`,
    [dados.ag.id]
  );
  if (r.rows.length === 0) return res.status(404).json({ erro: 'Registro de teleconsulta não encontrado.' });
  res.json(r.rows[0]);
});

router.post('/livekit-token', autenticar, async (req, res) => {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return res.status(500).json({ erro: 'LiveKit não configurado no ambiente.' });
  }

  await garantirTabelas();
  const agendamentoId = parseInt(req.body.agendamento_id, 10);
  if (!agendamentoId) {
    return res.status(400).json({ erro: 'agendamento_id é obrigatório para teleconsulta clínica.' });
  }

  const dados = await buscarAgendamento(agendamentoId, req.usuario.id);
  if (!dados || dados.negado) return res.status(403).json({ erro: 'Acesso negado ao agendamento.' });
  if (dados.ag.modalidade !== 'online') return res.status(400).json({ erro: 'Agendamento não é online.' });

  const sessao = await obterOuCriarSessao(dados.ag);
  if (!consentimentoCompleto(sessao)) {
    return res.status(403).json({ erro: 'Consentimento de telessaúde pendente. Conclua o TCLE antes de entrar na sala.' });
  }
  if (sessao.optou_atendimento_presencial) {
    return res.status(403).json({ erro: 'Paciente optou por atendimento presencial.' });
  }

  const sala = normalizarSala(agendamentoId);
  const nome = req.body.nome || req.usuario.nome || req.usuario.email || 'Participante';
  const identity = String(req.usuario.id);

  try {
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: nome,
      ttl: '2h'
    });
    token.addGrant({
      room: sala,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    if (sessao.status !== 'em_andamento') {
      await db.query(
        `UPDATE teleconsultas_sessoes SET inicio_em = COALESCE(inicio_em, NOW()), status = 'em_andamento', atualizado_em = NOW() WHERE agendamento_id = $1`,
        [agendamentoId]
      );
      await db.query("UPDATE agendamentos SET status = 'em_andamento' WHERE id = $1 AND status IN ('agendado', 'reagendado')", [agendamentoId]);
    }

    res.json({ url: LIVEKIT_URL, token: await token.toJwt(), sala, agendamento_id: agendamentoId });
  } catch (e) {
    console.error('[teleconsultas/livekit-token]', e.message);
    res.status(500).json({ erro: 'Erro ao gerar token da sala.' });
  }
});

module.exports = router;
