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

router.post('/planos', autenticar, async (req, res) => {
  const { nome_plano, sessoes_por_mes, valor_online, valor_presencial } = req.body;
  const r = await db.query('INSERT INTO massagem_planos (usuario_id, nome_plano, sessoes_por_mes, valor_online, valor_presencial) VALUES ($1,$2,$3,$4,$5) RETURNING id', [req.usuario.id, nome_plano, sessoes_por_mes, valor_online, valor_presencial]);
  res.status(201).json({ mensagem: 'Plano criado!', id: r.rows[0].id });
});

router.get('/planos', async (req, res) => {
  const r = await db.query('SELECT * FROM massagem_planos WHERE ativo = 1');
  res.json(r.rows);
});

router.post('/assinar', autenticar, async (req, res) => {
  const { plano_id, modalidade, tipo_pagamento, parcelas } = req.body;
  const plano = await db.query('SELECT * FROM massagem_planos WHERE id = $1', [plano_id]);
  if (plano.rows.length === 0) return res.status(404).json({ erro: 'Plano não encontrado' });
  const p = plano.rows[0];
  const valor = modalidade === 'online' ? p.valor_online : p.valor_presencial;
  const exp = new Date(); exp.setMonth(exp.getMonth() + 1);
  const r = await db.query("INSERT INTO massagem_assinaturas (paciente_id, plano_id, data_inicio, data_expiracao, sessoes_restantes, valor_total, tipo_pagamento, parcelas) VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7) RETURNING id", [req.usuario.id, plano_id, exp.toISOString().split('T')[0], p.sessoes_por_mes, valor, tipo_pagamento || 'a_vista', parcelas || 1]);
  res.status(201).json({ mensagem: 'Assinatura realizada!', id: r.rows[0].id });
});

router.get('/minhas-assinaturas', autenticar, async (req, res) => {
  const r = await db.query("SELECT ma.*, mp.nome_plano FROM massagem_assinaturas ma JOIN massagem_planos mp ON ma.plano_id = mp.id WHERE ma.paciente_id = $1 AND ma.status = 'ativa'", [req.usuario.id]);
  res.json(r.rows);
});

router.post('/checkin', autenticar, async (req, res) => {
  const { agendamento_id } = req.body;
  await db.query("UPDATE agendamentos SET status = 'em_andamento', checkin_metodo = 'manual', checkin_horario = NOW() WHERE id = $1", [agendamento_id]);
  res.json({ mensagem: 'Check-in realizado!' });
});

module.exports = router;