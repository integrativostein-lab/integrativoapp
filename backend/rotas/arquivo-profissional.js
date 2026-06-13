const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar, exigirTipo } = require('../middlewares/autenticar');

async function consultaSegura(sql, params = []) {
  try {
    const resultado = await db.query(sql, params);
    return resultado.rows;
  } catch (error) {
    console.warn('[arquivo-profissional] Consulta ignorada:', error.message);
    return [];
  }
}

async function garantirTabelaArquivo() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS arquivos_profissionais (
      id SERIAL PRIMARY KEY,
      profissional_id INTEGER NOT NULL,
      tipo VARCHAR(80) NOT NULL,
      status VARCHAR(40) NOT NULL,
      pacote_json JSONB NOT NULL,
      totais_json JSONB,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_arquivos_profissionais_profissional
    ON arquivos_profissionais (profissional_id, criado_em DESC)
  `);
}

function idsUnicos(linhas, campo) {
  return [...new Set(linhas.map((linha) => linha[campo]).filter(Boolean))];
}

async function montarPacoteProfissional(profissionalId) {
  const profissional = await consultaSegura(
    `SELECT id, nome, email, telefone, cpf, cns, cnes, cbo, cnpj, tipo,
            registro_profissional, conselho_classe, uf_conselho, especialidades, plano
     FROM usuarios
     WHERE id = $1`,
    [profissionalId]
  );

  const agendamentos = await consultaSegura(
    `SELECT *
     FROM agendamentos
     WHERE profissional_id = $1
     ORDER BY data_agendamento DESC, horario_inicio DESC`,
    [profissionalId]
  );
  const pacienteIds = idsUnicos(agendamentos, 'paciente_id');

  const pacientes = pacienteIds.length > 0
    ? await consultaSegura(
      `SELECT id, nome, email, telefone, cpf, cns, data_nascimento, genero, cidade, estado, tipo, ativo
       FROM usuarios
       WHERE id = ANY($1::int[])`,
      [pacienteIds]
    )
    : [];

  const prescricoes = await consultaSegura(
    `SELECT *
     FROM prescricoes
     WHERE profissional_id = $1
     ORDER BY data_prescricao DESC`,
    [profissionalId]
  );

  const pagamentos = await consultaSegura(
    `SELECT pg.*
     FROM pagamentos pg
     JOIN agendamentos ag ON ag.id = pg.agendamento_id
     WHERE ag.profissional_id = $1
     ORDER BY pg.criado_em DESC`,
    [profissionalId]
  );

  const tiss = await consultaSegura(
    `SELECT *
     FROM tiss_guias
     WHERE usuario_id = $1
     ORDER BY created_at DESC`,
    [profissionalId]
  );

  const fhir = await consultaSegura(
    `SELECT *
     FROM fhir_exports
     WHERE usuario_id = $1
     ORDER BY criado_em DESC`,
    [profissionalId]
  );

  const totais = {
    pacientes: pacientes.length,
    agendamentos: agendamentos.length,
    prescricoes: prescricoes.length,
    pagamentos: pagamentos.length,
    tiss: tiss.length,
    fhir: fhir.length
  };

  return {
    sistema: 'Integrativo.App',
    tipo: 'arquivo-central-profissional',
    versao: '1.0',
    gerado_em: new Date().toISOString(),
    profissional: profissional[0] || { id: profissionalId },
    totais,
    dados: {
      pacientes,
      agendamentos,
      prescricoes,
      pagamentos,
      tiss_guias: tiss,
      fhir_exports: fhir
    }
  };
}

router.post('/snapshot', autenticar, exigirTipo('profissional', 'admin'), async (req, res) => {
  try {
    await garantirTabelaArquivo();
    const pacote = await montarPacoteProfissional(req.usuario.id);
    const result = await db.query(
      `INSERT INTO arquivos_profissionais
         (profissional_id, tipo, status, pacote_json, totais_json, criado_em)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW())
       RETURNING id, profissional_id, tipo, status, totais_json, criado_em`,
      [
        req.usuario.id,
        'snapshot-assistencial',
        'arquivado',
        JSON.stringify(pacote),
        JSON.stringify(pacote.totais)
      ]
    );

    res.status(201).json({
      mensagem: 'Dados do profissional arquivados no servidor central.',
      arquivo: result.rows[0]
    });
  } catch (error) {
    console.error('[arquivo-profissional/snapshot]', error);
    res.status(500).json({ erro: 'Erro ao arquivar dados do profissional' });
  }
});

router.get('/status', autenticar, exigirTipo('profissional', 'admin'), async (req, res) => {
  try {
    await garantirTabelaArquivo();
    const result = await db.query(
      `SELECT id, tipo, status, totais_json, criado_em
       FROM arquivos_profissionais
       WHERE profissional_id = $1
       ORDER BY criado_em DESC
       LIMIT 1`,
      [req.usuario.id]
    );
    res.json({
      obrigatorio: true,
      ultimo_arquivo: result.rows[0] || null
    });
  } catch (error) {
    console.error('[arquivo-profissional/status]', error);
    res.status(500).json({ erro: 'Erro ao consultar arquivo profissional' });
  }
});

module.exports = router;
