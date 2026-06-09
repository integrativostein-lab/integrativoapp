const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticarAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const uResult = await db.query(\'SELECT tipo FROM usuarios WHERE id = $1\', [d.id]);
    const u = uResult.rows[0];
    if (![\'admin\', \'super_admin\'].includes(u.tipo)) return res.status(403).json({ erro: \'Acesso restrito\' });
    req.usuario = d;
    next();
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/dashboard', autenticarAdmin, async (req, res) => {
  const pac = await db.query("SELECT COUNT(*) as t FROM usuarios WHERE tipo = 'paciente'");
  const ter = await db.query("SELECT COUNT(*) as t FROM usuarios WHERE tipo IN ('profissional','admin')");
  const fat = await db.query("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'");
  res.json({ pacientes: pac.rows[0].t, profissionais: ter.rows[0].t, faturamento_total: fat.rows[0].t });
});

router.get('/usuarios', autenticarAdmin, async (req, res) => {
  const r = await db.query('SELECT id, nome, email, tipo, plano, ativo FROM usuarios LIMIT 100');
  res.json(r.rows);
});

router.put('/usuarios/:id/status', autenticarAdmin, async (req, res) => {
  await db.query('UPDATE usuarios SET ativo = $1 WHERE id = $2', [req.body.ativo, req.params.id]);
  res.json({ mensagem: 'Status atualizado!' });
});

router.put('/usuarios/:id/plano', autenticarAdmin, async (req, res) => {
  await db.query('UPDATE usuarios SET plano = $1 WHERE id = $2', [req.body.plano, req.params.id]);
  res.json({ mensagem: 'Plano atualizado!' });
});

router.get('/logs', autenticarAdmin, async (req, res) => {
  const r = await db.query('SELECT l.*, u.nome FROM logs_auditoria l LEFT JOIN usuarios u ON l.usuario_id = u.id ORDER BY l.criado_em DESC LIMIT 200');
  res.json(r.rows);
});

module.exports = router;