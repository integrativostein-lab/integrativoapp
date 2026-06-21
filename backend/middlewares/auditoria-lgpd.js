const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auditoria = require('../servicos/auditoria-lgpd');

const PREFIXOS_Sensiveis = [
  '/api/auth',
  '/api/usuarios',
  '/api/prescricoes',
  '/api/admin',
  '/api/fhir',
  '/api/alertas-seguranca',
  '/api/agendamentos',
  '/api/mensagens',
  '/api/arquivo-profissional',
  '/api/sus'
];

function rotaSensiveis(pathname) {
  return PREFIXOS_Sensiveis.some((prefixo) => pathname.startsWith(prefixo));
}

function categoriaPorRota(pathname, metodo) {
  if (pathname.startsWith('/api/auth')) return auditoria.CATEGORIAS.AUTENTICACAO;
  if (pathname.startsWith('/api/prescricoes') || pathname.startsWith('/api/fhir') || pathname.startsWith('/api/sus')) {
    return auditoria.CATEGORIAS.DADOS_SENSIVEIS;
  }
  if (pathname.startsWith('/api/admin')) return auditoria.CATEGORIAS.ADMINISTRACAO;
  if (pathname.startsWith('/api/alertas-seguranca')) return auditoria.CATEGORIAS.SEGURANCA_CLINICA;
  return auditoria.CATEGORIAS.DADOS_PESSOAIS;
}

function acaoPorMetodo(metodo) {
  switch (metodo) {
    case 'GET': return 'consulta';
    case 'POST': return 'criacao';
    case 'PUT':
    case 'PATCH': return 'alteracao';
    case 'DELETE': return 'exclusao';
    default: return metodo.toLowerCase();
  }
}

function resultadoPorStatus(status) {
  if (status >= 500) return 'erro_servidor';
  if (status === 403) return 'negado';
  if (status === 401) return 'nao_autorizado';
  if (status >= 400) return 'falha';
  return 'sucesso';
}

function resolverUsuario(req) {
  if (req.usuario) return req.usuario;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function auditoriaHttpSensiveis(req, res, next) {
  const pathname = (req.originalUrl || req.url || '').split('?')[0];
  if (!pathname.startsWith('/api/') || !rotaSensiveis(pathname)) {
    return next();
  }

  req.auditoriaRequestId = req.auditoriaRequestId || crypto.randomUUID();
  const inicio = Date.now();

  res.on('finish', () => {
    const usuario = resolverUsuario(req);
    auditoria.registrar({
      request_id: req.auditoriaRequestId,
      categoria: categoriaPorRota(pathname, req.method),
      acao: acaoPorMetodo(req.method),
      base_legal: pathname.startsWith('/api/auth')
        ? auditoria.BASE_LEGAL.SEGURANCA
        : auditoria.BASE_LEGAL.EXECUCAO_CONTRATO,
      finalidade: 'rastreabilidade de acesso e tratamento de dados pessoais/sensíveis',
      usuario_id: usuario?.id ?? null,
      usuario_tipo: usuario?.tipo ?? null,
      email: usuario?.email ?? null,
      recurso: pathname.split('/')[2] || 'api',
      recurso_id: req.params?.id || null,
      rota: pathname,
      metodo: req.method,
      resultado: resultadoPorStatus(res.statusCode),
      ip: req.ip || req.headers['x-forwarded-for'] || null,
      user_agent: req.get('user-agent'),
      duracao_ms: Date.now() - inicio,
      detalhes: {
        status_http: res.statusCode,
        query: sanitizarQuery(req.query)
      }
    });
  });

  next();
}

function sanitizarQuery(query = {}) {
  const limpo = {};
  Object.entries(query).forEach(([chave, valor]) => {
    if (['senha', 'token', 'cpf'].includes(chave.toLowerCase())) {
      limpo[chave] = '[omitido]';
    } else if (typeof valor === 'string' && valor.length > 120) {
      limpo[chave] = `${valor.slice(0, 120)}…`;
    } else {
      limpo[chave] = valor;
    }
  });
  return limpo;
}

module.exports = {
  auditoriaHttpSensiveis
};
