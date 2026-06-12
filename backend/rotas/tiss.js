const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');
const {
  capabilityStatement,
  garantirTabelaTiss,
  montarDadosGuiaConsulta,
  validarGuiaConsulta,
  gerarXmlGuiaConsulta,
  salvarGuia
} = require('../servicos/tiss');

async function prepararBanco() {
  try {
    await garantirTabelaTiss(db);
  } catch (error) {
    console.warn('[tiss] Não foi possível garantir tabela tiss_guias:', error.message);
    throw error;
  }
}

async function buscarDadosAgendamento(agendamentoId, usuario) {
  const result = await db.query(
    `SELECT
       a.*,
       pac.id AS paciente_id_ref,
       pac.nome AS paciente_nome,
       pac.email AS paciente_email,
       pac.telefone AS paciente_telefone,
       pac.cpf AS paciente_cpf,
       pac.cns AS paciente_cns,
       pac.data_nascimento AS paciente_data_nascimento,
       pac.genero AS paciente_genero,
       prof.id AS profissional_id_ref,
       prof.nome AS profissional_nome,
       prof.email AS profissional_email,
       prof.telefone AS profissional_telefone,
       prof.cpf AS profissional_cpf,
       prof.cns AS profissional_cns,
       prof.cns_profissional AS profissional_cns_profissional,
       prof.cnes AS profissional_cnes,
       prof.cbo AS profissional_cbo,
       prof.cnpj AS profissional_cnpj,
       prof.registro_profissional AS profissional_registro_profissional,
       prof.conselho_classe AS profissional_conselho_classe,
       prof.conselho_profissional AS profissional_conselho_profissional,
       prof.uf_conselho AS profissional_uf_conselho
     FROM agendamentos a
     JOIN usuarios pac ON a.paciente_id = pac.id
     JOIN usuarios prof ON a.profissional_id = prof.id
     WHERE a.id = $1
       AND (a.paciente_id = $2 OR a.profissional_id = $2 OR $3 = 'admin')
     LIMIT 1`,
    [agendamentoId, usuario.id, usuario.tipo || null]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    agendamento: {
      ...row,
      paciente_nome: row.paciente_nome,
      profissional_nome: row.profissional_nome
    },
    paciente: {
      id: row.paciente_id_ref,
      nome: row.paciente_nome,
      email: row.paciente_email,
      telefone: row.paciente_telefone,
      cpf: row.paciente_cpf,
      cns: row.paciente_cns,
      data_nascimento: row.paciente_data_nascimento,
      genero: row.paciente_genero
    },
    profissional: {
      id: row.profissional_id_ref,
      nome: row.profissional_nome,
      email: row.profissional_email,
      telefone: row.profissional_telefone,
      cpf: row.profissional_cpf,
      cns: row.profissional_cns,
      cns_profissional: row.profissional_cns_profissional,
      cnes: row.profissional_cnes,
      cbo: row.profissional_cbo,
      cnpj: row.profissional_cnpj,
      registro_profissional: row.profissional_registro_profissional,
      conselho_classe: row.profissional_conselho_classe,
      conselho_profissional: row.profissional_conselho_profissional,
      uf_conselho: row.profissional_uf_conselho
    }
  };
}

router.get('/metadata', (req, res) => {
  res.json(capabilityStatement());
});

router.post('/guia-consulta', autenticar, async (req, res) => {
  try {
    const { agendamentoId, dadosComplementares } = req.body || {};
    if (!agendamentoId) return res.status(400).json({ erro: 'agendamentoId é obrigatório' });

    await prepararBanco();
    const dados = await buscarDadosAgendamento(agendamentoId, req.usuario);
    if (!dados) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const guia = montarDadosGuiaConsulta({
      ...dados,
      dadosComplementares: dadosComplementares || req.body
    });
    const pendencias = validarGuiaConsulta(guia);
    const xml = gerarXmlGuiaConsulta(guia);
    const registro = await salvarGuia(db, {
      usuarioId: req.usuario.id,
      agendamentoId,
      guia,
      xml,
      pendencias
    });

    res.status(201).json({
      mensagem: pendencias.length > 0
        ? 'Guia TISS gerada com pendências de validação.'
        : 'Guia TISS gerada com sucesso.',
      guia: registro,
      pendencias,
      xml
    });
  } catch (error) {
    console.error('[tiss/guia-consulta]', error);
    res.status(500).json({ erro: 'Erro ao gerar guia TISS' });
  }
});

router.get('/guias/:id', autenticar, async (req, res) => {
  try {
    await prepararBanco();
    const result = await db.query(
      `SELECT id, usuario_id, agendamento_id, tipo_guia, versao_tiss, status,
              numero_guia, protocolo_operadora, dados_json, erros_validacao,
              created_at, updated_at
       FROM tiss_guias
       WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Guia TISS não encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[tiss/guias/:id]', error);
    res.status(500).json({ erro: 'Erro ao buscar guia TISS' });
  }
});

router.get('/guias/:id/xml', autenticar, async (req, res) => {
  try {
    await prepararBanco();
    const result = await db.query(
      'SELECT numero_guia, xml FROM tiss_guias WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.usuario.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Guia TISS não encontrada' });

    const guia = result.rows[0];
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=TISS_${guia.numero_guia}.xml`);
    res.send(guia.xml);
  } catch (error) {
    console.error('[tiss/guias/:id/xml]', error);
    res.status(500).json({ erro: 'Erro ao baixar XML TISS' });
  }
});

module.exports = router;
