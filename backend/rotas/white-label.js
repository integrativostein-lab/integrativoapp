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

router.get('/config', autenticar, async (req, res) => {
  const r = await db.query("SELECT valor FROM configuracoes WHERE chave = 'white_label' AND usuario_id = $1", [req.usuario.id]);
  res.json(r.rows.length > 0 ? JSON.parse(r.rows[0].valor) : { logo: null, cor_primaria: '#1A365D', nome_clinica: '' });
});

router.put('/config', autenticar, async (req, res) => {
  const { logo, cor_primaria, nome_clinica } = req.body;
  const config = JSON.stringify({ logo: logo || null, cor_primaria: cor_primaria || '#1A365D', nome_clinica: nome_clinica || '' });
  const ex = await db.query("SELECT id FROM configuracoes WHERE chave = 'white_label' AND usuario_id = $1", [req.usuario.id]);
  if (ex.rows.length > 0) {
    await db.query('UPDATE configuracoes SET valor = $1 WHERE id = $2', [config, ex.rows[0].id]);
  } else {
    await db.query("INSERT INTO configuracoes (chave, valor, usuario_id) VALUES ('white_label', $1, $2)", [config, req.usuario.id]);
  }
  res.json({ mensagem: 'White Label atualizado!' });
});

module.exports = router;