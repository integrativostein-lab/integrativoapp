const TISS = require('../config/tiss');

function limparNumeros(valor) {
  if (valor == null || valor === '') return null;
  const limpo = String(valor).replace(/\D/g, '');
  return limpo || null;
}

function primeiroValor(...valores) {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && valor !== '') return valor;
  }
  return null;
}

function escaparXml(valor) {
  if (valor == null) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function tag(nome, valor) {
  return `<ans:${nome}>${escaparXml(valor)}</ans:${nome}>`;
}

function bloco(nome, conteudo) {
  return `<ans:${nome}>${conteudo}</ans:${nome}>`;
}

function formatarData(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).split('T')[0];
}

function formatarHora(valor) {
  if (!valor) return null;
  return String(valor).slice(0, 5);
}

function formatarDecimal(valor) {
  const numero = Number(valor || 0);
  return numero.toFixed(2);
}

function normalizarComplementares(dadosComplementares = {}) {
  return {
    operadora: dadosComplementares.operadora || {},
    beneficiario: dadosComplementares.beneficiario || {},
    contratado: dadosComplementares.contratado || {},
    procedimento: dadosComplementares.procedimento || {},
    atendimento: dadosComplementares.atendimento || {},
    guia: dadosComplementares.guia || {}
  };
}

function montarDadosGuiaConsulta({ agendamento, paciente, profissional, dadosComplementares = {} }) {
  const comp = normalizarComplementares(dadosComplementares);
  const numeroGuia = primeiroValor(
    comp.guia.numeroGuiaPrestador,
    comp.guia.numeroGuia,
    `TISS-${Date.now()}-${agendamento.id}`
  );

  return {
    tipoGuia: TISS.TIPOS_GUIA.CONSULTA,
    versaoTiss: primeiroValor(comp.guia.versaoTiss, TISS.VERSAO),
    numeroGuia,
    registroANS: limparNumeros(primeiroValor(comp.operadora.registroANS, TISS.OPERADORA.registroANS)),
    dataEmissao: formatarData(primeiroValor(comp.guia.dataEmissao, new Date())),
    numeroCarteira: primeiroValor(comp.beneficiario.numeroCarteira, comp.beneficiario.carteirinha),
    atendimentoRN: primeiroValor(comp.beneficiario.atendimentoRN, 'N'),
    nomeBeneficiario: primeiroValor(comp.beneficiario.nome, paciente.nome, agendamento.paciente_nome),
    codigoPrestadorNaOperadora: primeiroValor(
      comp.contratado.codigoPrestadorNaOperadora,
      comp.contratado.codigoPrestador,
      TISS.OPERADORA.codigoPrestador,
      profissional.cnes
    ),
    cnpjContratado: limparNumeros(primeiroValor(
      comp.contratado.cnpj,
      TISS.OPERADORA.cnpjPrestador,
      profissional.cnpj
    )),
    nomeContratado: primeiroValor(
      comp.contratado.nome,
      TISS.OPERADORA.nomeContratado,
      profissional.nome
    ),
    cnes: limparNumeros(primeiroValor(comp.contratado.cnes, profissional.cnes)),
    nomeProfissional: primeiroValor(comp.contratado.nomeProfissional, profissional.nome),
    conselhoProfissional: primeiroValor(
      comp.contratado.conselhoProfissional,
      profissional.conselho_classe,
      profissional.conselho_profissional,
      '06'
    ),
    numeroConselho: primeiroValor(comp.contratado.numeroConselho, profissional.registro_profissional),
    ufConselho: primeiroValor(comp.contratado.ufConselho, profissional.uf_conselho),
    cbo: limparNumeros(primeiroValor(comp.contratado.cbo, profissional.cbo)),
    dataAtendimento: formatarData(primeiroValor(comp.atendimento.dataAtendimento, agendamento.data_agendamento)),
    horaInicial: formatarHora(primeiroValor(comp.atendimento.horaInicial, agendamento.horario_inicio)),
    horaFinal: formatarHora(primeiroValor(comp.atendimento.horaFinal, agendamento.horario_fim)),
    codigoTabela: primeiroValor(comp.procedimento.codigoTabela, TISS.DEFAULTS.tabelaProcedimento),
    codigoProcedimento: primeiroValor(
      comp.procedimento.codigoProcedimento,
      comp.procedimento.codigoTuss,
      TISS.DEFAULTS.codigoProcedimentoConsulta
    ),
    descricaoProcedimento: primeiroValor(comp.procedimento.descricao, agendamento.tipo_sessao, 'Consulta'),
    valorProcedimento: formatarDecimal(primeiroValor(comp.procedimento.valor, agendamento.valor)),
    tipoConsulta: primeiroValor(comp.atendimento.tipoConsulta, TISS.DEFAULTS.codigoTipoConsulta),
    indicacaoAcidente: primeiroValor(comp.atendimento.indicacaoAcidente, TISS.DEFAULTS.indicadorAcidente),
    tipoAtendimento: primeiroValor(comp.atendimento.tipoAtendimento, TISS.DEFAULTS.tipoAtendimento),
    regimeAtendimento: primeiroValor(comp.atendimento.regimeAtendimento, TISS.DEFAULTS.regimeAtendimento),
    observacao: primeiroValor(comp.guia.observacao, comp.atendimento.observacao)
  };
}

function validarGuiaConsulta(guia) {
  const regras = [
    ['registroANS', 'Registro ANS da operadora é obrigatório.'],
    ['numeroCarteira', 'Número da carteirinha do beneficiário é obrigatório.'],
    ['nomeBeneficiario', 'Nome do beneficiário é obrigatório.'],
    ['codigoPrestadorNaOperadora', 'Código do prestador na operadora é obrigatório.'],
    ['cnpjContratado', 'CNPJ do contratado/prestador é obrigatório.'],
    ['nomeContratado', 'Nome do contratado/prestador é obrigatório.'],
    ['cnes', 'CNES do prestador é obrigatório.'],
    ['nomeProfissional', 'Nome do profissional executante é obrigatório.'],
    ['conselhoProfissional', 'Conselho profissional é obrigatório.'],
    ['numeroConselho', 'Número do conselho profissional é obrigatório.'],
    ['ufConselho', 'UF do conselho profissional é obrigatória.'],
    ['cbo', 'CBO do profissional é obrigatório.'],
    ['dataAtendimento', 'Data do atendimento é obrigatória.'],
    ['codigoProcedimento', 'Código TUSS/procedimento é obrigatório.']
  ];

  return regras
    .filter(([campo]) => !guia[campo])
    .map(([campo, mensagem]) => ({ campo, mensagem }));
}

function gerarXmlGuiaConsulta(guia) {
  const cabecalho = bloco('cabecalho', [
    bloco('identificacaoTransacao', [
      tag('tipoTransacao', 'ENVIO_LOTE_GUIAS'),
      tag('sequencialTransacao', guia.numeroGuia),
      tag('dataRegistroTransacao', guia.dataEmissao),
      tag('horaRegistroTransacao', new Date().toISOString().slice(11, 19))
    ].join('')),
    bloco('origem', bloco('identificacaoPrestador', tag('codigoPrestadorNaOperadora', guia.codigoPrestadorNaOperadora))),
    bloco('destino', tag('registroANS', guia.registroANS)),
    tag('Padrao', guia.versaoTiss)
  ].join(''));

  const guiaConsulta = bloco('guiaConsulta', [
    bloco('cabecalhoConsulta', [
      tag('registroANS', guia.registroANS),
      tag('numeroGuiaPrestador', guia.numeroGuia)
    ].join('')),
    tag('numeroGuiaOperadora', guia.numeroGuiaOperadora || ''),
    bloco('dadosBeneficiario', [
      tag('numeroCarteira', guia.numeroCarteira),
      tag('atendimentoRN', guia.atendimentoRN),
      tag('nomeBeneficiario', guia.nomeBeneficiario)
    ].join('')),
    bloco('contratadoExecutante', [
      tag('codigoPrestadorNaOperadora', guia.codigoPrestadorNaOperadora),
      tag('cnpjContratado', guia.cnpjContratado),
      tag('nomeContratado', guia.nomeContratado),
      tag('CNES', guia.cnes)
    ].join('')),
    bloco('profissionalExecutante', [
      tag('nomeProfissional', guia.nomeProfissional),
      tag('conselhoProfissional', guia.conselhoProfissional),
      tag('numeroConselhoProfissional', guia.numeroConselho),
      tag('UF', guia.ufConselho),
      tag('CBOS', guia.cbo)
    ].join('')),
    tag('indicacaoAcidente', guia.indicacaoAcidente),
    bloco('dadosAtendimento', [
      tag('dataAtendimento', guia.dataAtendimento),
      tag('tipoConsulta', guia.tipoConsulta),
      bloco('procedimento', [
        tag('codigoTabela', guia.codigoTabela),
        tag('codigoProcedimento', guia.codigoProcedimento),
        tag('descricaoProcedimento', guia.descricaoProcedimento)
      ].join('')),
      tag('valorProcedimento', guia.valorProcedimento)
    ].join('')),
    tag('observacao', guia.observacao || '')
  ].join(''));

  const corpo = bloco('prestadorParaOperadora', bloco('loteGuias', [
    tag('numeroLote', guia.numeroGuia),
    bloco('guiasTISS', guiaConsulta)
  ].join('')));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<ans:mensagemTISS xmlns:ans="${escaparXml(TISS.NAMESPACE)}">`,
    cabecalho,
    corpo,
    '</ans:mensagemTISS>'
  ].join('');
}

async function garantirTabelaTiss(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tiss_guias (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL,
      agendamento_id INTEGER,
      tipo_guia VARCHAR(50) NOT NULL,
      versao_tiss VARCHAR(20) NOT NULL,
      status VARCHAR(40) NOT NULL,
      numero_guia VARCHAR(120) NOT NULL,
      protocolo_operadora VARCHAR(120),
      xml TEXT NOT NULL,
      dados_json JSONB,
      erros_validacao JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function salvarGuia(db, { usuarioId, agendamentoId, guia, xml, pendencias }) {
  const status = pendencias.length > 0 ? 'pendente_validacao' : 'gerada';
  const result = await db.query(
    `INSERT INTO tiss_guias
       (usuario_id, agendamento_id, tipo_guia, versao_tiss, status, numero_guia, xml, dados_json, erros_validacao, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, NOW(), NOW())
     RETURNING id, usuario_id, agendamento_id, tipo_guia, versao_tiss, status, numero_guia,
       protocolo_operadora, created_at, updated_at`,
    [
      usuarioId,
      agendamentoId,
      guia.tipoGuia,
      guia.versaoTiss,
      status,
      guia.numeroGuia,
      xml,
      JSON.stringify(guia),
      JSON.stringify(pendencias)
    ]
  );
  return result.rows[0];
}

function capabilityStatement() {
  return {
    sistema: 'Integrativo.App TISS',
    versaoTiss: TISS.VERSAO,
    namespace: TISS.NAMESPACE,
    formatos: ['xml', 'json'],
    tiposGuia: [TISS.TIPOS_GUIA.CONSULTA],
    endpoints: [
      'GET /api/tiss/metadata',
      'POST /api/tiss/guia-consulta',
      'GET /api/tiss/guias/:id',
      'GET /api/tiss/guias/:id/xml'
    ],
    camposComplementares: {
      operadora: ['registroANS'],
      beneficiario: ['numeroCarteira', 'nome'],
      contratado: ['codigoPrestadorNaOperadora', 'cnpj', 'cnes', 'cbo'],
      procedimento: ['codigoProcedimento', 'descricao', 'valor'],
      atendimento: ['tipoConsulta', 'indicacaoAcidente']
    }
  };
}

module.exports = {
  TISS,
  limparNumeros,
  montarDadosGuiaConsulta,
  validarGuiaConsulta,
  gerarXmlGuiaConsulta,
  garantirTabelaTiss,
  salvarGuia,
  capabilityStatement
};
