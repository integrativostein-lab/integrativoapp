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

router.post('/emitir-guia', autenticar, async (req, res) => {
  const { tipo, valor, data_vencimento } = req.body;
  if (!['DAS','GPS','FGTS','INSS_COMPLEMENTAR','ISS'].includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' });
  const r = await db.query('INSERT INTO guias_emitidas (empresa_id, tipo, valor, data_vencimento) VALUES ($1,$2,$3,$4) RETURNING id', [req.usuario.id, tipo, valor, data_vencimento]);
  res.status(201).json({ mensagem: 'Guia emitida!', id: r.rows[0].id, tipo, valor });
});

router.get('/guias', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM guias_emitidas WHERE empresa_id = $1 ORDER BY data_vencimento DESC', [req.usuario.id]);
  res.json(r.rows);
});

router.get('/calcular-das', autenticar, async (req, res) => {
  const fat = await db.query("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE usuario_id = $1 AND status = 'aprovado' AND criado_em >= date_trunc('month', NOW())", [req.usuario.id]);
  const dasMEI = 75.00;
  const vencimento = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 20).toISOString().split('T')[0];
  res.json({ das_mei: dasMEI, faturamento_mes: fat.rows[0].t, vencimento });
});

router.get('/alerta-limite-mei', autenticar, async (req, res) => {
  const fatAno = await db.query("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE usuario_id = $1 AND status = 'aprovado' AND criado_em >= date_trunc('year', NOW())", [req.usuario.id]);
  const limite = 81000;
  const percentual = ((fatAno.rows[0].t / limite) * 100).toFixed(1);
  res.json({ faturamento_ano: fatAno.rows[0].t, limite, percentual, alerta: percentual >= 80 });
});

router.get('/resumo-mensal', autenticar, async (req, res) => {
  const mes = new Date().toISOString().substring(0, 7);
  const guias = await db.query("SELECT tipo, SUM(valor) as total FROM guias_emitidas WHERE empresa_id = $1 AND data_vencimento LIKE $2 GROUP BY tipo", [req.usuario.id, mes + '%']);
  const folha = await db.query("SELECT SUM(salario_bruto) as total FROM folha_pagamento fp JOIN funcionarios f ON fp.funcionario_id = f.id WHERE f.empresa_id = $1 AND fp.mes_referencia = $2", [req.usuario.id, mes]);
  res.json({ mes, guias: guias.rows, total_folha: folha.rows[0]?.total || 0 });
});

module.exports = router;