const express = require('express');
const router = express.Router();

const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');

router.post('/upload', autenticar, async (req, res) => {
  res.json({ mensagem: 'Conciliação bancária — em breve.' });
});

module.exports = router;