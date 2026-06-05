const PAISES_HOMOLOGADOS = {
  'BR': { nome: 'Brasil', revenda_dominio: true, revenda_certificado: true }
};

async function verificarDominio(dominio, extensao) {
  return { sucesso: true, dominio: dominio + extensao, disponivel: true, fornecedor: 'simulacao' };
}

async function registrarDominio(dadosCliente, dominio, extensao) {
  return { sucesso: true, dominio: dominio + extensao, fornecedor: 'simulacao', transacao_id: 'sim_' + Date.now(), status: 'registrado' };
}

async function emitirCertificado(dadosCliente, tipo, validadeMeses) {
  return { sucesso: true, tipo, fornecedor: 'simulacao', transacao_id: 'sim_' + Date.now(), status: 'pendente_validacao' };
}

module.exports = { verificarDominio, registrarDominio, emitirCertificado, PAISES_HOMOLOGADOS };