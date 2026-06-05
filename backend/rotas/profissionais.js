const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const axios = require('axios');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/buscar', async (req, res) => {
  try {
    const { especialidade, modalidade, cep } = req.query;
    let q = "SELECT u.id, u.nome, u.registro_profissional, u.cidade, u.estado, u.atende_online, u.atende_presencial, u.especialidades FROM usuarios u WHERE u.ativo = 1 AND u.tipo IN ('profissional','admin')";
    const params = [];
    let paramCount = 0;

    if (especialidade) { paramCount++; q += ` AND u.especialidades LIKE $${paramCount}`; params.push('%' + especialidade + '%'); }
    if (modalidade === 'online') q += ' AND u.atende_online = 1';
    else if (modalidade === 'presencial') {
      q += ' AND u.atende_presencial = 1';
      if (cep) {
        try {
          const response = await axios.get(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
          if (response.data && !response.data.erro) {
            paramCount++; q += ` AND u.cidade LIKE $${paramCount}`; params.push('%' + response.data.localidade + '%');
            paramCount++; q += ` AND u.estado LIKE $${paramCount}`; params.push('%' + response.data.uf + '%');
          }
        } catch (cepErro) {}
      }
    }
    q += ' LIMIT 50';

    const result = await db.query(q, params);
    const profissionais = result.rows;

    const resu = await Promise.all(profissionais.map(async (prof) => {
      const vals = await db.query('SELECT pv.*, e.nome as espec_nome FROM profissional_valores pv JOIN especialidades e ON pv.especialidade_id = e.id WHERE pv.usuario_id = $1', [prof.id]);
      return { ...prof, especialidades_lista: prof.especialidades ? JSON.parse(prof.especialidades) : [], valores: vals.rows };
    }));

    res.json(resu);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar profissionais' });
  }
});

router.post('/valores', autenticar, async (req, res) => {
  const { especialidade_id, valor_online, valor_presencial, valor_domicilio } = req.body;
  const ex = await db.query('SELECT id FROM profissional_valores WHERE usuario_id = $1 AND especialidade_id = $2', [req.usuario.id, especialidade_id]);
  if (ex.rows.length > 0) {
    await db.query('UPDATE profissional_valores SET valor_online=$1, valor_presencial=$2, valor_domicilio=$4 WHERE id=$3', [valor_online, valor_presencial, valor_domicilio, ex.rows[0].id]);
  } else {
    await db.query('INSERT INTO profissional_valores (usuario_id, especialidade_id, valor_online, valor_presencial, valor_domicilio) VALUES ($1,$2,$3,$4)', [req.usuario.id, especialidade_id, valor_online, valor_presencial, valor_domicilio]);
  }
  res.json({ mensagem: 'Valores salvos!' });
});

module.exports = router;