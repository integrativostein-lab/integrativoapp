const modoLancamento = require('../config/modo-lancamento');

function bloquearRecursosClinicos(req, res, next) {
  if (modoLancamento.recursosClinicosAtivos) return next();
  return res.status(503).json({
    erro: modoLancamento.mensagemBloqueio,
    codigo: 'RECURSO_CLINICO_DORMENTE',
    modo_lancamento: true
  });
}

module.exports = { bloquearRecursosClinicos };
