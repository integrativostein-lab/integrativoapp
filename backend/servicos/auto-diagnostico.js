const motorAlertas = require('./alertas-seguranca');
const motorVertentes = require('./orientacao-auto');
const motorHipoteses = require('./hipoteses-provaveis');
const { montarQuestionnaireResponse } = require('./fhir-questionnaire');
const { campoPorId } = require('../config/anamnese-campos');

function anamneseParaContextoAlertas(respostas = {}) {
  return {
    pratica: 'integrativa orientacao autoavaliacao consulta',
    termo: respostas.queixa_principal,
    observacoes: [
      respostas.queixa_principal,
      respostas.hda_resumo,
      respostas.humor,
      respostas.observacoes_livres,
      respostas.sintomas_digestivos,
      respostas.disturbios_sono
    ].filter(Boolean).join(' '),
    condicoes: motorAlertas.normalizarEntrada([
      respostas.doencas_cronicas,
      respostas.historico_familiar,
      respostas.queixa_principal,
      respostas.hda_resumo
    ]),
    medicamentos: motorAlertas.normalizarEntrada(respostas.medicamentos_uso),
    alergias: motorAlertas.normalizarEntrada([
      respostas.alergias_medicamentos,
      respostas.alergias_alimentos,
      respostas.alergias_ambientais,
      respostas.reacoes_adversas
    ])
  };
}

function montarResumo(respostas = {}) {
  const linhas = [];
  const destaques = [
    ['sexo_biologico', 'Sexo'],
    ['idade_anos', 'Idade'],
    ['queixa_principal', 'Principal queixa'],
    ['sintomas_relatados', 'Sintomas marcados'],
    ['tabagismo', 'Cigarro'],
    ['etilismo', 'Álcool'],
    ['medicamentos_uso', 'Remédios'],
    ['alergias_medicamentos', 'Alergias a remédios'],
    ['qualidade_sono', 'Sono'],
    ['nivel_energia', 'Energia (0–10)'],
    ['tipo_dieta', 'Alimentação'],
    ['objetivos_paciente', 'O que quer melhorar']
  ];
  destaques.forEach(([id, rotulo]) => {
    if (respostas[id]) linhas.push({ id, rotulo, valor: String(respostas[id]).trim() });
  });
  return linhas;
}

function analisar(respostas = {}) {
  const limpo = {};
  Object.keys(respostas || {}).forEach((id) => {
    if (!campoPorId(id)) return;
    const v = respostas[id];
    if (v === undefined || v === null || String(v).trim() === '') return;
    limpo[id] = typeof v === 'string' ? v.trim().slice(0, 8000) : v;
  });

  const alertas = motorAlertas.verificar(anamneseParaContextoAlertas(limpo));
  const vertentes = motorVertentes.analisar(limpo);
  const hipoteses = motorHipoteses.analisar(limpo, alertas);
  const resumo = montarResumo(limpo);
  const geradoEm = new Date().toISOString();

  return {
    motor: 'deterministico_if_then',
    usa_ia: false,
    aviso_legal:
      'Esta síntese é orientativa e educativa. Não constitui diagnóstico, prescrição ou laudo médico. ' +
      'O objetivo é orientar sua busca por um profissional de saúde de confiança — ou emergência, quando indicado.',
    privacidade:
      'Nenhum dado é armazenado em nossos servidores neste fluxo. O Integrativo.App não comercializa dados de visitantes.',
    resumo,
    seguranca: alertas,
    vertentes: vertentes.vertentes,
    hipoteses: hipoteses.hipoteses,
    destino: hipoteses.destino,
    aviso_hipoteses: hipoteses.aviso_legal,
    fhir_questionnaire_response: montarQuestionnaireResponse(limpo, { gerado_em: geradoEm }),
    gerado_em: geradoEm
  };
}

module.exports = { analisar, anamneseParaContextoAlertas };
