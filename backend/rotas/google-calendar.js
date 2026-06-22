const express = require('express');
const router = express.Router();

const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');

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