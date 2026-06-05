const PADROES_CERTIFICACAO = {
  'BR': { nome: 'ICP-Brasil', tipo: 'e-CNPJ', validade_padrao: '1 ano', orgao: 'ITI' },
  'DE': { nome: 'eIDAS', tipo: 'QES', validade_padrao: '2 anos', orgao: 'Bundesnetzagentur' },
  'FR': { nome: 'eIDAS', tipo: 'QES', validade_padrao: '2 anos', orgao: 'ANSSI' },
  'ES': { nome: 'eIDAS', tipo: 'QES', validade_padrao: '2 anos', orgao: 'MINETUR' },
  'PT': { nome: 'eIDAS', tipo: 'QES', validade_padrao: '2 anos', orgao: 'SCEE' },
  'IT': { nome: 'eIDAS', tipo: 'QES', validade_padrao: '2 anos', orgao: 'AgID' },
  'US': { nome: 'Federal PKI', tipo: 'PIV-I', validade_padrao: '3 anos', orgao: 'GSA' },
  'CA': { nome: 'Government PKI', tipo: 'GC PKI', validade_padrao: '3 anos', orgao: 'SSC' },
  'IN': { nome: 'CCA India', tipo: 'Class 3', validade_padrao: '2 anos', orgao: 'CCA' },
  'CN': { nome: 'CFCA', tipo: 'OV/IV', validade_padrao: '2 anos', orgao: 'MIIT' },
  'JP': { nome: 'GPKI', tipo: 'Government', validade_padrao: '3 anos', orgao: 'MIC' },
  'MX': { nome: 'SAT e.firma', tipo: 'FIEL', validade_padrao: '4 anos', orgao: 'SAT' },
  'AR': { nome: 'AFIP', tipo: 'Fiscal', validade_padrao: '2 anos', orgao: 'AFIP' },
  'ZA': { nome: 'SAPKI', tipo: 'Government', validade_padrao: '3 anos', orgao: 'SITA' },
  'NG': { nome: 'NITDA PKI', tipo: 'Class 3', validade_padrao: '2 anos', orgao: 'NITDA' },
  'EG': { nome: 'Egypt PKI', tipo: 'Government', validade_padrao: '3 anos', orgao: 'ITIDA' },
  'MA': { nome: 'DGSSI', tipo: 'Government', validade_padrao: '2 anos', orgao: 'DGSSI' }
};

function obterPadraoCertificacao(pais) {
  return PADROES_CERTIFICACAO[pais] || null;
}

function paisPossuiPKI(pais) {
  return !!PADROES_CERTIFICACAO[pais];
}

function obterInstrucoesFallback() {
  return {
    metodo: 'firma_cartorio',
    passos: [
      'Baixe o Termo de Cessão Gratuita',
      'Imprima e reconheça firma em cartório local',
      'Digitalize o documento assinado',
      'Faça upload no painel de administração',
      'Aguarde a validação (até 48h)'
    ],
    mensagem: 'Seu país não possui infraestrutura de certificação digital. Aceitamos firma reconhecida em cartório como alternativa.'
  };
}

module.exports = { PADROES_CERTIFICACAO, obterPadraoCertificacao, paisPossuiPKI, obterInstrucoesFallback };