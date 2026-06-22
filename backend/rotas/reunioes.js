const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const { autenticar } = require('../middlewares/autenticar');

const router = express.Router();

function normalizarSala(valor) {
  return String(valor || 'sala-teste')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

router.post('/livekit-token', autenticar, async (req, res) => {
  const salaRaw = req.body.sala || '';
  const agendamentoId = req.body.agendamento_id;
  if (agendamentoId || String(salaRaw).startsWith('teleconsulta-')) {
    return res.status(400).json({
      erro: 'Teleconsultas clínicas exigem TCLE e validação de agendamento. Use POST /api/teleconsultas/livekit-token.',
      endpoint: '/api/teleconsultas/livekit-token'
    });
  }

  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return res.status(500).json({ erro: 'LiveKit não configurado no ambiente.' });
  }

  const sala = normalizarSala(req.body.sala || req.body.agendamento_id || 'teleconsulta-alfa');
  const nome = req.body.nome || req.usuario.nome || req.usuario.email || 'Participante';
  const identity = String(req.usuario.id || req.usuario.email || Date.now());

  try {
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name: nome,
      ttl: '2h'
    });

    token.addGrant({
      room: sala,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    res.json({
      url: LIVEKIT_URL,
      token: await token.toJwt(),
      sala
    });
  } catch (e) {
    console.error('[reunioes/livekit-token]', e.message);
    res.status(500).json({ erro: 'Erro ao gerar token LiveKit.' });
  }
});

module.exports = router;
