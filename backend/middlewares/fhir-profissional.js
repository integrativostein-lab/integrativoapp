/** FHIR clínico — somente profissionais e administradores. */
function apenasProfissionalFhir(req, res, next) {
  const tipos = ['profissional', 'admin', 'super_admin'];
  if (!req.usuario || !tipos.includes(req.usuario.tipo)) {
    return res.status(403).json({
      erro: 'Exportação FHIR disponível apenas na área do profissional.',
      codigo: 'FHIR_PROFISSIONAL_APENAS'
    });
  }
  next();
}

module.exports = { apenasProfissionalFhir };
