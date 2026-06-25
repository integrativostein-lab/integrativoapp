const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database');
const auditoria = require('./auditoria-lgpd');
const { tipoInicialProfissional } = require('../utils/acesso-roles');
const ambiente = require('../config/ambiente');
const { urlFrontendPadrao } = require('../config/oauth-social');

function criarEstadoOAuth(payload) {
  return jwt.sign(
    { ...payload, nonce: crypto.randomBytes(8).toString('hex') },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function lerEstadoOAuth(state) {
  return jwt.verify(state, process.env.JWT_SECRET);
}

function montarUrlAutorizacao(provedor, state) {
  const redirectUri = require('../config/oauth-social').urlCallback(provedor.id);
  const params = new URLSearchParams({
    client_id: provedor.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provedor.scope,
    state
  });
  Object.entries(provedor.extraAuthorize || {}).forEach(([k, v]) => params.set(k, v));
  return `${provedor.authorizeUrl}?${params.toString()}`;
}

async function trocarCodigoGoogle(provedor, code) {
  const redirectUri = require('../config/oauth-social').urlCallback('google');
  const { data } = await axios.post(provedor.tokenUrl, new URLSearchParams({
    code,
    client_id: provedor.clientId,
    client_secret: provedor.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  const perfil = jwt.decode(data.id_token);
  if (!perfil?.email) throw new Error('Google não retornou email verificado.');
  return {
    email: String(perfil.email).toLowerCase(),
    nome: perfil.name || perfil.email.split('@')[0],
    provedor: 'google',
    provedor_id: perfil.sub
  };
}

async function trocarCodigoMicrosoft(provedor, code) {
  const redirectUri = require('../config/oauth-social').urlCallback('microsoft');
  const { data } = await axios.post(provedor.tokenUrl, new URLSearchParams({
    code,
    client_id: provedor.clientId,
    client_secret: provedor.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  const { data: me } = await axios.get('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${data.access_token}` }
  });
  const email = (me.mail || me.userPrincipalName || '').toLowerCase();
  if (!email) throw new Error('Microsoft não retornou email.');
  return {
    email,
    nome: me.displayName || email.split('@')[0],
    provedor: 'microsoft',
    provedor_id: me.id
  };
}

async function trocarCodigoApple(provedor, code) {
  const redirectUri = require('../config/oauth-social').urlCallback('apple');
  const clientSecret = gerarClientSecretApple(provedor);
  const { data } = await axios.post(provedor.tokenUrl, new URLSearchParams({
    code,
    client_id: provedor.clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  const perfil = jwt.decode(data.id_token);
  if (!perfil?.email) throw new Error('Apple não retornou email. Use ocultar email desativado ou tente outro provedor.');
  return {
    email: String(perfil.email).toLowerCase(),
    nome: perfil.email.split('@')[0],
    provedor: 'apple',
    provedor_id: perfil.sub
  };
}

function gerarClientSecretApple(provedor) {
  const agora = Math.floor(Date.now() / 1000);
  return jwt.sign({
    iss: provedor.teamId,
    iat: agora,
    exp: agora + 86400 * 180,
    aud: 'https://appleid.apple.com',
    sub: provedor.clientId
  }, provedor.privateKey, {
    algorithm: 'ES256',
    keyid: provedor.keyId
  });
}

async function trocarCodigo(provedorId, code) {
  const { provedoresOAuth } = require('../config/oauth-social');
  const provedor = provedoresOAuth()[provedorId];
  if (!provedor?.habilitado) throw new Error('Provedor não configurado.');

  if (provedorId === 'google') return trocarCodigoGoogle(provedor, code);
  if (provedorId === 'microsoft') return trocarCodigoMicrosoft(provedor, code);
  if (provedorId === 'apple') return trocarCodigoApple(provedor, code);
  throw new Error('Provedor inválido.');
}

async function loginOuCadastrarOAuth(perfilOAuth, opcoes) {
  const tipoDesejado = ['paciente', 'profissional'].includes(opcoes.tipo) ? opcoes.tipo : 'paciente';
  const plano = opcoes.plano || 'freemium';

  const existente = await db.query('SELECT * FROM usuarios WHERE email = $1', [perfilOAuth.email]);
  let usuario;

  if (existente.rows.length) {
    usuario = existente.rows[0];
    if (!usuario.ativo) throw new Error('Conta desativada. Fale com o suporte.');
  } else {
    const senhaAleatoria = crypto.randomBytes(24).toString('hex');
    const hash = await bcrypt.hash(senhaAleatoria, 12);
    const tipoConta = tipoDesejado === 'profissional'
      ? tipoInicialProfissional(plano)
      : 'paciente';
    const planoInicial = tipoDesejado === 'profissional' ? plano : 'freemium';

    const ins = await db.query(
      `INSERT INTO usuarios (nome, email, senha, tipo, lgpd_consentimento, lgpd_data_consentimento, plano, ativo)
       VALUES ($1, $2, $3, $4, 1, NOW(), $5, 1) RETURNING *`,
      [perfilOAuth.nome, perfilOAuth.email, hash, tipoConta, planoInicial]
    );
    usuario = ins.rows[0];

    if (tipoDesejado === 'paciente') {
      await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [usuario.id]).catch(() => {});
    }

    auditoria.registrar({
      categoria: auditoria.CATEGORIAS.AUTENTICACAO,
      acao: 'cadastro_oauth',
      usuario_id: usuario.id,
      usuario_tipo: usuario.tipo,
      email: usuario.email,
      detalhes: { provedor: perfilOAuth.provedor, tipo: tipoConta }
    });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  auditoria.registrar({
    categoria: auditoria.CATEGORIAS.AUTENTICACAO,
    acao: 'login_oauth',
    usuario_id: usuario.id,
    usuario_tipo: usuario.tipo,
    email: usuario.email,
    detalhes: { provedor: perfilOAuth.provedor }
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      plano: usuario.plano
    },
    novo_usuario: !existente.rows.length,
    completar_cadastro_profissional:
      !existente.rows.length && tipoDesejado === 'profissional' && usuario.tipo === 'profissional'
  };
}

function montarRedirectFrontend(estado, resultado, erro) {
  const base = (estado.retorno || `${urlFrontendPadrao()}/oauth-callback.html`).split('?')[0];
  const params = new URLSearchParams();
  if (erro) {
    params.set('erro', erro);
    return `${base}?${params.toString()}`;
  }
  params.set('token', resultado.token);
  params.set('usuario', Buffer.from(JSON.stringify(resultado.usuario)).toString('base64'));
  if (resultado.novo_usuario) params.set('novo', '1');
  if (resultado.completar_cadastro_profissional) params.set('completar_prof', '1');
  if (estado.plano) params.set('plano', estado.plano);
  return `${base}?${params.toString()}`;
}

module.exports = {
  criarEstadoOAuth,
  lerEstadoOAuth,
  montarUrlAutorizacao,
  trocarCodigo,
  loginOuCadastrarOAuth,
  montarRedirectFrontend
};
