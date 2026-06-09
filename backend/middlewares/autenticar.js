const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT centralizado.
 * Substitui as cópias espalhadas em cada rota.
 */
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

/**
 * Middleware que exige um dos tipos informados.
 * Uso: exigirTipo('admin') ou exigirTipo('admin', 'profissional')
 */
function exigirTipo(...tipos) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ erro: 'Não autorizado' });
    if (!tipos.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    return next();
  };
}

module.exports = { autenticar, exigirTipo };
