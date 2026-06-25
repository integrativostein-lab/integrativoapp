const express = require('express');
const router = express.Router();
const { provedoresOAuth, listarProvedoresPublicos } = require('../config/oauth-social');
const oauth = require('../servicos/oauth-social');

router.get('/provedores', (req, res) => {
  res.json({ provedores: listarProvedoresPublicos() });
});

router.get('/:provedor/iniciar', (req, res) => {
  try {
    const provedorId = req.params.provedor;
    const todos = provedoresOAuth();
    const provedor = todos[provedorId];
    if (!provedor?.habilitado) {
      const retorno = req.query.retorno || '';
      const destino = oauth.montarRedirectFrontend(
        { retorno },
        null,
        `Entrar com ${provedor?.nome || provedorId} ainda não está configurado no servidor.`
      );
      return res.redirect(destino);
    }

    const estado = oauth.criarEstadoOAuth({
      provedor: provedorId,
      acao: req.query.acao || 'login',
      tipo: req.query.tipo || 'paciente',
      plano: req.query.plano || 'freemium',
      retorno: req.query.retorno || ''
    });

    res.redirect(oauth.montarUrlAutorizacao(provedor, estado));
  } catch (e) {
    console.error('[oauth/iniciar]', e.message);
    res.status(500).json({ erro: 'Não foi possível iniciar login social.' });
  }
});

async function processarCallback(provedorId, code, state, res) {
  if (!code || !state) {
    const destino = oauth.montarRedirectFrontend({ retorno: '' }, null, 'Autorização cancelada ou incompleta.');
    return res.redirect(destino);
  }

  try {
    const estado = oauth.lerEstadoOAuth(state);
    if (estado.provedor !== provedorId) throw new Error('Estado OAuth inválido.');

    const perfil = await oauth.trocarCodigo(provedorId, code);
    const resultado = await oauth.loginOuCadastrarOAuth(perfil, {
      tipo: estado.tipo,
      plano: estado.plano
    });

    return res.redirect(oauth.montarRedirectFrontend(estado, resultado));
  } catch (e) {
    console.error(`[oauth/callback ${provedorId}]`, e.message);
    let estado = { retorno: '' };
    try { estado = oauth.lerEstadoOAuth(state); } catch (_) { /* ignore */ }
    return res.redirect(oauth.montarRedirectFrontend(estado, null, e.message || 'Falha no login social.'));
  }
}

router.get('/:provedor/callback', (req, res) => {
  processarCallback(req.params.provedor, req.query.code, req.query.state, res);
});

router.post('/apple/callback', express.urlencoded({ extended: true }), (req, res) => {
  processarCallback('apple', req.body.code, req.body.state, res);
});

module.exports = router;
