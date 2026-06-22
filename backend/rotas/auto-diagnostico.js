const express = require('express');
const rateLimit = require('express-rate-limit');
const ambiente = require('../config/ambiente');
const { analisar } = require('../servicos/auto-diagnostico');

const router = express.Router();

const autoDiagnosticoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: ambiente.modoTeste ? 60 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos antes de gerar outra síntese.' }
});

function bloquearAlfa(req, res, next) {
  if (ambiente.modoTeste) {
    return res.status(404).json({ erro: 'Autoavaliação indisponível neste ambiente.' });
  }
  next();
}

router.post('/analisar', autoDiagnosticoLimiter, bloquearAlfa, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const respostas = req.body?.respostas || req.body || {};
  if (!respostas || typeof respostas !== 'object') {
    return res.status(400).json({ erro: 'Envie o objeto respostas da anamnese.' });
  }
  const resultado = analisar(respostas);
  res.json(resultado);
});

module.exports = router;
