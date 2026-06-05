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
  const { nome_plano, aulas_por_mes, valor_online, valor_presencial } = req.body;
  const r = await db.query('INSERT INTO yoga_planos (usuario_id, nome_plano, aulas_por_mes, valor_online, valor_presencial) VALUES ($1,$2,$3,$4,$5) RETURNING id', [req.usuario.id, nome_plano, aulas_por_mes, valor_online, valor_presencial]);
  res.status(201).json({ mensagem: 'Plano criado!', id: r.rows[0].id });
});

router.get('/planos', async (req, res) => {
  const r = await db.query('SELECT * FROM yoga_planos WHERE ativo = 1');
  res.json(r.rows);
});

router.post('/assinar', autenticar, async (req, res) => {
  const { plano_id, modalidade } = req.body;
  const plano = await db.query('SELECT * FROM yoga_planos WHERE id = $1', [plano_id]);
  if (plano.rows.length === 0) return res.status(404).json({ erro: 'Plano não encontrado' });
  const p = plano.rows[0];
  const valor = modalidade === 'online' ? p.valor_online : p.valor_presencial;
  const exp = new Date(); exp.setMonth(exp.getMonth() + 1);
  const r = await db.query("INSERT INTO yoga_assinaturas (paciente_id, plano_id, data_inicio, data_expiracao, aulas_restantes, valor_mensalidade) VALUES ($1,$2,NOW(),$3,$4,$5) RETURNING id", [req.usuario.id, plano_id, exp.toISOString().split('T')[0], p.aulas_por_mes, valor]);
  res.status(201).json({ mensagem: 'Assinatura realizada!', id: r.rows[0].id });
});

router.post('/checkin', autenticar, async (req, res) => {
  const { agendamento_id } = req.body;
  await db.query("UPDATE agendamentos SET status = 'em_andamento', checkin_metodo = 'manual', checkin_horario = NOW() WHERE id = $1", [agendamento_id]);
  res.json({ mensagem: 'Check-in realizado!' });
});

router.get('/minhas-reposicoes', autenticar, async (req, res) => {
  const r = await db.query("SELECT r.*, a.data_agendamento FROM yoga_reposicoes r JOIN agendamentos a ON r.aula_faltada_id = a.id JOIN yoga_assinaturas ya ON r.assinatura_id = ya.id WHERE ya.paciente_id = $1 AND r.status = 'pendente'", [req.usuario.id]);
  res.json(r.rows);
});

router.post('/presenca-video', autenticar, async (req, res) => {
  const { agendamento_id } = req.body;
  const ag = await db.query('SELECT * FROM agendamentos WHERE id = $1 AND paciente_id = $2 AND modalidade = $3', [agendamento_id, req.usuario.id, 'online']);
  if (ag.rows.length === 0) return res.status(404).json({ erro: 'Agendamento não encontrado' });
  if (['em_andamento', 'realizado'].includes(ag.rows[0].status)) return res.json({ mensagem: 'Presença já registrada' });
  await db.query("UPDATE agendamentos SET status = 'em_andamento', checkin_metodo = 'auto_video', checkin_horario = NOW() WHERE id = $1", [agendamento_id]);
  res.json({ mensagem: 'Presença detectada automaticamente!' });
});

module.exports = router;