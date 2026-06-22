const motorAlertas = require('./alertas-seguranca');
const motorVertentes = require('./orientacao-auto');
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
    ['queixa_principal', 'Queixa principal'],
    ['hda_resumo', 'História resumida'],
    ['medicamentos_uso', 'Medicamentos'],
    ['alergias_medicamentos', 'Alergias medicamentosas'],
    ['qualidade_sono', 'Sono'],
    ['nivel_energia', 'Energia (0–10)'],
    ['tipo_dieta', 'Alimentação'],
    ['objetivos_paciente', 'Objetivos']
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
  const resumo = montarResumo(limpo);

  return {
    motor: 'deterministico_if_then',
    usa_ia: false,
    aviso_legal:
      'Esta síntese é orientativa e educativa. Não constitui diagnóstico, prescrição ou laudo médico. ' +
      'Consulte sempre um profissional de saúde habilitado para decisões clínicas.',
    privacidade:
      'Nenhum dado é armazenado em nossos servidores neste fluxo. O Integrativo.App não comercializa dados de visitantes.',
    resumo,
    seguranca: alertas,
    vertentes: vertentes.vertentes,
    gerado_em: new Date().toISOString()
  };
}

module.exports = { analisar, anamneseParaContextoAlertas };
