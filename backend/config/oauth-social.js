function baseUrlBackend() {
  const url = (process.env.RENDER_URL || process.env.BACKEND_URL || '').replace(/\/$/, '');
  if (url) return url;
  return `http://localhost:${process.env.PORT || 3000}`;
}

function urlCallback(provider) {
  return `${baseUrlBackend()}/api/auth/oauth/${provider}/callback`;
}

function urlFrontendPadrao() {
  return (process.env.FRONTEND_URL || process.env.VERCEL_URL || 'https://integrativo.app').replace(/\/$/, '');
}

function provedoresOAuth() {
  const googleId = (process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim();
  const googleSecret = (process.env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim();
  const msId = (process.env.MICROSOFT_OAUTH_CLIENT_ID || '').trim();
  const msSecret = (process.env.MICROSOFT_OAUTH_CLIENT_SECRET || '').trim();
  const appleId = (process.env.APPLE_OAUTH_CLIENT_ID || '').trim();
  const appleTeam = (process.env.APPLE_OAUTH_TEAM_ID || '').trim();
  const appleKey = (process.env.APPLE_OAUTH_KEY_ID || '').trim();
  const applePrivate = (process.env.APPLE_OAUTH_PRIVATE_KEY || '').trim();

  return {
    google: {
      id: 'google',
      nome: 'Google',
      habilitado: !!(googleId && googleSecret),
      clientId: googleId,
      clientSecret: googleSecret,
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'openid email profile',
      extraAuthorize: { access_type: 'online', prompt: 'select_account' }
    },
    microsoft: {
      id: 'microsoft',
      nome: 'Microsoft',
      habilitado: !!(msId && msSecret),
      clientId: msId,
      clientSecret: msSecret,
      authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scope: 'openid profile email User.Read',
      extraAuthorize: { response_mode: 'query' }
    },
    apple: {
      id: 'apple',
      nome: 'Apple',
      habilitado: !!(appleId && appleTeam && appleKey && applePrivate),
      clientId: appleId,
      teamId: appleTeam,
      keyId: appleKey,
      privateKey: applePrivate.replace(/\\n/g, '\n'),
      authorizeUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      scope: 'name email',
      extraAuthorize: { response_mode: 'form_post' }
    }
  };
}

function listarProvedoresPublicos() {
  const todos = provedoresOAuth();
  return Object.values(todos).map((p) => ({
    id: p.id,
    nome: p.nome,
    habilitado: p.habilitado,
    clientId: p.habilitado ? p.clientId : null
  }));
}

module.exports = {
  baseUrlBackend,
  urlCallback,
  urlFrontendPadrao,
  provedoresOAuth,
  listarProvedoresPublicos
};
