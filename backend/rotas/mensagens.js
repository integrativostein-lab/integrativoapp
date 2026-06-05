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

router.get('/', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM templates_mensagens WHERE usuario_id = $1 ORDER BY criado_em DESC', [req.usuario.id]);
  res.json(r.rows);
});

router.post('/', autenticar, async (req, res) => {
  const { tipo, canal, assunto, mensagem, variaveis } = req.body;
  const r = await db.query('INSERT INTO templates_mensagens (usuario_id, tipo, canal, assunto, mensagem, variaveis) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [req.usuario.id, tipo, canal || 'whatsapp', assunto, mensagem, variaveis || '{nome_paciente},{data},{horario},{profissional},{link_sala}']);
  res.status(201).json({ mensagem: 'Template criado!', id: r.rows[0].id });
});

router.put('/:id', autenticar, async (req, res) => {
  const { tipo, assunto, mensagem } = req.body;
  await db.query('UPDATE templates_mensagens SET tipo=$1, assunto=$2, mensagem=$3 WHERE id=$4 AND usuario_id=$5', [tipo, assunto, mensagem, req.params.id, req.usuario.id]);
  res.json({ mensagem: 'Template atualizado!' });
});

router.delete('/:id', autenticar, async (req, res) => {
  await db.query('DELETE FROM templates_mensagens WHERE id=$1 AND usuario_id=$2', [req.params.id, req.usuario.id]);
  res.json({ mensagem: 'Template removido!' });
});

module.exports = router;