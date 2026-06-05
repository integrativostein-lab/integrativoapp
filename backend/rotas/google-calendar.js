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

router.post('/conectar', autenticar, async (req, res) => {
  const { google_token } = req.body;
  await db.query("INSERT INTO configuracoes (chave, valor, usuario_id) VALUES ('google_calendar_token', $1, $2) ON CONFLICT (chave, usuario_id) DO UPDATE SET valor = $1", [google_token, req.usuario.id]);
  res.json({ mensagem: 'Google Calendar conectado!' });
});

router.get('/status', autenticar, async (req, res) => {
  const r = await db.query("SELECT valor FROM configuracoes WHERE chave = 'google_calendar_token' AND usuario_id = $1", [req.usuario.id]);
  res.json({ conectado: r.rows.length > 0 });
});

module.exports = router;