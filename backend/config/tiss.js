/**
 * Configuração TISS — Troca de Informações na Saúde Suplementar.
 *
 * A integração real com operadoras costuma variar por WSDL, certificado,
 * credenciais e versão homologada. Estes defaults permitem gerar a primeira
 * Guia de Consulta e manter a versão ajustável por ambiente.
 */
module.exports = {
  VERSAO: process.env.TISS_VERSAO || '4.01.00',
  NAMESPACE: process.env.TISS_NAMESPACE || 'http://www.ans.gov.br/padroes/tiss/schemas',
  BASE_URL: process.env.TISS_BASE_URL || 'http://localhost:3000/api/tiss',

  OPERADORA: {
    registroANS: process.env.TISS_REGISTRO_ANS || null,
    codigoPrestador: process.env.TISS_CODIGO_PRESTADOR || null,
    cnpjPrestador: process.env.TISS_CNPJ_PRESTADOR || null,
    nomeContratado: process.env.TISS_NOME_CONTRATADO || null
  },

  DEFAULTS: {
    codigoProcedimentoConsulta: process.env.TISS_CODIGO_PROCEDIMENTO_CONSULTA || '10101012',
    tabelaProcedimento: process.env.TISS_TABELA_PROCEDIMENTO || '22',
    codigoTipoConsulta: process.env.TISS_TIPO_CONSULTA || '1',
    indicadorAcidente: process.env.TISS_INDICADOR_ACIDENTE || '9',
    tipoAtendimento: process.env.TISS_TIPO_ATENDIMENTO || '05',
    regimeAtendimento: process.env.TISS_REGIME_ATENDIMENTO || '01'
  },

  TIPOS_GUIA: {
    CONSULTA: 'guiaConsulta'
  }
};
