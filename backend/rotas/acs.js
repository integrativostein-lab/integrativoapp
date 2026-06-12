const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

// Registrar visita domiciliar
router.post('/visita', autenticar, async (req, res) => {
  try {
    const { paciente_id, data_visita, observacoes, condicoes, coordenadas } = req.body;
    
    if (!paciente_id) return res.status(400).json({ erro: 'Paciente é obrigatório' });

    const r = await db.query(
      `INSERT INTO acs_visitas (agente_id, paciente_id, data_visita, observacoes, condicoes, coordenadas) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.usuario.id, paciente_id, data_visita || new Date().toISOString().split('T')[0], 
       observacoes, condicoes ? JSON.stringify(condicoes) : null, coordenadas || null]
    );

    res.status(201).json({ mensagem: 'Visita registrada!', id: r.rows[0].id });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao registrar visita' });
  }
});

// Listar visitas do agente
router.get('/visitas', autenticar, async (req, res) => {
  const { data_inicio, data_fim } = req.query;
  let q = `SELECT v.*, u.nome as paciente_nome FROM acs_visitas v 
           JOIN usuarios u ON v.paciente_id = u.id WHERE v.agente_id = $1`;
  const params = [req.usuario.id];
  
  if (data_inicio) { q += ' AND v.data_visita >= $2'; params.push(data_inicio); }
  if (data_fim) { q += ' AND v.data_visita <= $' + (params.length + 1); params.push(data_fim); }
  
  q += ' ORDER BY v.data_visita DESC LIMIT 100';
  const r = await db.query(q, params);
  res.json(r.rows);
});

// Relatório de cobertura (para a organização social)
router.get('/relatorio-cobertura', autenticar, async (req, res) => {
  const { mes, ano } = req.query;
  const inicio = `${ano}-${mes}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const fim = `${ano}-${mes}-${ultimoDia}`;

  const r = await db.query(
    `SELECT COUNT(*) as total_visitas, COUNT(DISTINCT paciente_id) as familias_visitadas,
            agente_id, u.nome as agente_nome
     FROM acs_visitas v JOIN usuarios u ON v.agente_id = u.id
     WHERE v.data_visita BETWEEN $1 AND $2
     GROUP BY agente_id, u.nome`,
    [inicio, fim]
  );

  res.json(r.rows);
});

// Notificar condição de risco (aparece para o profissional de saúde)
router.post('/notificar-risco', autenticar, async (req, res) => {
  try {
    const { paciente_id, tipo_risco, descricao } = req.body;
    
    await db.query(
      `INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo) 
       VALUES ($1, $2, $3, 'risco_saude')`,
      [paciente_id, '⚠️ Risco identificado pelo ACS', descricao]
    );

    res.json({ mensagem: 'Notificação enviada para a equipe de saúde!' });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao notificar' });
  }
});

module.exports = router;