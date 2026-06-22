const express = require('express');
const router = express.Router();

const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');

router.post('/criar-email', autenticar, async (req, res) => {
  const { dominio, email } = req.body;
  await db.query("INSERT INTO configuracoes (chave, valor, usuario_id) VALUES ('zoho_email_' || $1, $2, $3)", [Date.now(), JSON.stringify({ dominio, email }), req.usuario.id]);
  res.json({ mensagem: `Email ${email}@${dominio} seria criado (modo teste)`, simulacao: true });
});

router.get('/meus-emails', autenticar, async (req, res) => {
  const r = await db.query("SELECT * FROM configuracoes WHERE chave LIKE 'zoho_email_%' AND usuario_id = $1", [req.usuario.id]);
  res.json(r.rows);
});

module.exports = router;