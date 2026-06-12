const express = require('express');
const router = express.Router();
const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');
const { usuarioParaOrganization, profissionalParaPractitioner } = require('../servicos/fhir-brasil');

router.get('/', (req, res) => {
  res.json({
    mensagem: 'Entidades FHIR Brasil — Organization e Practitioner',
    endpoints: {
      organizacao: 'GET /api/entidades/organization/:usuarioId',
      profissional: 'GET /api/entidades/practitioner/:profissionalId'
    }
  });
});

router.get('/organization/:usuarioId', autenticar, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nome, email, telefone, cnes, cnpj, cidade, estado
       FROM usuarios WHERE id = $1`,
      [req.params.usuarioId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    res.json(usuarioParaOrganization(result.rows[0]));
  } catch (error) {
    console.error('[entidades/organization]', error);
    res.status(500).json({ erro: 'Erro ao gerar Organization FHIR' });
  }
});

router.get('/practitioner/:profissionalId', autenticar, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nome, email, telefone, cpf, cns, cns_profissional, cnes, cbo,
              registro_profissional, conselho_classe, uf_conselho, cidade, estado,
              especialidades, ativo, tipo
       FROM usuarios
       WHERE id = $1 AND tipo IN ('profissional', 'admin')`,
      [req.params.profissionalId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Profissional não encontrado' });
    }
    res.json(profissionalParaPractitioner(result.rows[0]));
  } catch (error) {
    console.error('[entidades/practitioner]', error);
    res.status(500).json({ erro: 'Erro ao gerar Practitioner FHIR' });
  }
});

module.exports = router;
