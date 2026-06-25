/**
 * Hipóteses clínicas prováveis — motor determinístico (não é diagnóstico).
 * Apresenta possibilidades para orientar busca de profissional ou emergência.
 */
const { normalizarSexo } = require('../config/auto-diagnostico-publico');

function semAcentos(v) {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function textoCompleto(respostas) {
  return semAcentos(Object.values(respostas || {}).join(' '));
}

const SINAIS_EMERGENCIA = [
  'dor toracica', 'falta de ar', 'dispneia', 'sincope', 'desmaio',
  'sangramento intenso', 'ideacao suicida', 'suicidio', 'deficit neurologico',
  'perda de consciencia', 'dor abdominal intensa', 'rigidez de nuca com febre'
];

const HIPOTESES = [
  {
    id: 'H_CEFALEIA_TENSIONAL',
    nome: 'Cefaleia do tipo tensional',
    descricao: 'Dor de cabeça frequentemente associada a tensão muscular, estresse e postura.',
    termos: ['cefaleia tensional', 'dor de cabeca', 'dor de cabeça leve', 'tensional', 'nuca', 'pressao nos olhos'],
    sistemas: ['Neurológico'],
    confianca: 'moderada',
    cid_referencia: 'G44.2'
  },
  {
    id: 'H_ENXAQUECA',
    nome: 'Enxaqueca (migrânea)',
    descricao: 'Cefaleia que pode cursar com náusea, fotofobia ou aura.',
    termos: ['enxaqueca', 'migranea', 'aura visual', 'fotofobia'],
    sistemas: ['Neurológico'],
    confianca: 'moderada',
    cid_referencia: 'G43'
  },
  {
    id: 'H_LOMBALGIA',
    nome: 'Lombalgia mecânica',
    descricao: 'Dor na região lombar, comum em sedentarismo e sobrecarga postural.',
    termos: ['dor lombar', 'dor nas costas', 'lombalgia', 'costas'],
    sistemas: ['Musculoesquelético'],
    confianca: 'moderada',
    cid_referencia: 'M54.5'
  },
  {
    id: 'H_DISPEPSIA',
    nome: 'Dispepsia funcional / refluxo',
    descricao: 'Desconforto digestivo alto com azia, refluxo ou gastrite funcional.',
    termos: ['azia', 'refluxo', 'gastrite', 'dispepsia', 'epigastrica', 'estufamento'],
    sistemas: ['Digestivo'],
    confianca: 'moderada',
    cid_referencia: 'K30'
  },
  {
    id: 'H_SII',
    nome: 'Síndrome do intestino irritável (hipótese)',
    descricao: 'Alteração do hábito intestinal com dor abdominal e distensão.',
    termos: ['intestino irritavel', 'prisao de ventre', 'diarreia', 'gases', 'colica'],
    sistemas: ['Digestivo'],
    confianca: 'baixa',
    cid_referencia: 'K58'
  },
  {
    id: 'H_ANSIEDADE',
    nome: 'Transtorno de ansiedade (hipótese)',
    descricao: 'Ansiedade persistente com impacto no sono, humor e qualidade de vida.',
    termos: ['ansiedade', 'estresse constante', 'estresse cronico', 'palpitacoes', 'coracao acelerado', 'insonia', 'dificuldade para dormir', 'irritabilidade'],
    sistemas: ['Emocional'],
    confianca: 'moderada',
    cid_referencia: 'F41'
  },
  {
    id: 'H_DEPRESSAO',
    nome: 'Episódio depressivo (hipótese)',
    descricao: 'Desânimo, tristeza persistente ou perda de interesse merecem avaliação.',
    termos: ['desanimo', 'tristeza', 'anedonia', 'humor deprimido'],
    sistemas: ['Emocional'],
    confianca: 'baixa',
    cid_referencia: 'F32'
  },
  {
    id: 'H_INSONIA',
    nome: 'Insônia / distúrbio do sono',
    descricao: 'Dificuldade para iniciar ou manter o sono, com repercussão diurna.',
    termos: ['insonia', 'dificuldade para dormir', 'disturbios do sono', 'sono ruim', 'despertares'],
    sistemas: ['Sono'],
    confianca: 'moderada',
    cid_referencia: 'G47.0'
  },
  {
    id: 'H_HAS_SUSPEITA',
    nome: 'Hipertensão arterial (suspeita clínica)',
    descricao: 'Palpitações, cefaleia matinal ou tontura podem sugerir elevação pressórica.',
    termos: ['palpitacoes', 'coracao acelerado', 'pressao alta', 'hipertensao', 'cefaleia matinal'],
    sistemas: ['Cardiovascular'],
    confianca: 'baixa',
    cid_referencia: 'I10'
  },
  {
    id: 'H_DISMENORREIA',
    nome: 'Dismenorreia / alteração menstrual',
    descricao: 'Cólica menstrual intensa ou ciclo irregular merece avaliação ginecológica.',
    termos: ['colica menstrual', 'ciclo menstrual irregular', 'tpm', 'ciclo menstrual'],
    sexo: 'feminino',
    sistemas: ['Ginecológico'],
    confianca: 'moderada',
    cid_referencia: 'N94.6'
  },
  {
    id: 'H_HP_BENIGNA',
    nome: 'Hiperplasia prostática benigna (hipótese)',
    descricao: 'Jato urinário fraco, noctúria ou hesitação miccional em homens.',
    termos: ['jato fraco', 'jato urinario fraco', 'nocturia', 'prostata', 'acordar a noite para urinar'],
    sexo: 'masculino',
    sistemas: ['Urológico'],
    confianca: 'baixa',
    cid_referencia: 'N40'
  },
  {
    id: 'H_ITU',
    nome: 'Infecção urinária (hipótese)',
    descricao: 'Disúria, urgência ou frequência urinária aumentada.',
    termos: ['dor ao urinar', 'disuria', 'urgencia miccional', 'infeccao urinaria', 'vontade de urinar'],
    sistemas: ['Geniturinário'],
    confianca: 'moderada',
    cid_referencia: 'N39.0'
  }
];

function pontuarHipoteses(respostas) {
  const t = textoCompleto(respostas);
  const sexo = normalizarSexo(respostas.sexo_biologico);
  const encontradas = [];

  HIPOTESES.forEach((h) => {
    if (h.sexo && h.sexo !== sexo) return;
    const hits = h.termos.filter((termo) => t.includes(semAcentos(termo)));
    if (!hits.length) return;
    encontradas.push({
      hipotese_id: h.id,
      nome: h.nome_publico || h.nome,
      descricao: h.descricao_publica || h.descricao,
      confianca: h.confianca,
      cid_referencia: h.cid_referencia,
      sistemas: h.sistemas,
      termos_correspondentes: hits,
      aviso: 'Possibilidade orientativa — confirme com profissional de saúde.'
    });
  });

  return encontradas.sort((a, b) => {
    const peso = { alta: 3, moderada: 2, baixa: 1 };
    return (peso[b.confianca] || 0) - (peso[a.confianca] || 0);
  });
}

function determinarDestino(respostas, hipoteses, alertas) {
  const t = textoCompleto(respostas);
  const emergencia = SINAIS_EMERGENCIA.some((s) => t.includes(s));
  const alertaAlto = (alertas?.alertas || []).some((a) =>
    /urgente|emerg|pronto|samu|psiquiatr/i.test(String(a.mensagem || a.titulo || ''))
  );

  if (emergencia || alertaAlto) {
    return {
      tipo: 'emergencia',
      titulo: 'Procure atendimento de urgência',
      mensagem:
        'Pelos sinais que você marcou, o mais seguro é ir a um pronto-socorro, ligar para o SAMU (192) ' +
        'ou buscar emergência agora. Esta avaliação não substitui um médico na hora.',
      prioridade: 1
    };
  }

  if (hipoteses.length) {
    return {
      tipo: 'profissional',
      titulo: 'Vale marcar uma consulta',
      mensagem:
        'O que você relatou combina com situações que um médico ou terapeuta pode avaliar melhor. ' +
        'Leve este resumo na consulta.',
      prioridade: 2
    };
  }

  return {
    tipo: 'autocuidado',
    titulo: 'Cuide de você e observe',
    mensagem:
      'Por enquanto, mantenha hábitos saudáveis e fique atento. Se piorar ou não melhorar em alguns dias, ' +
      'marque consulta com um profissional.',
    prioridade: 3
  };
}

function analisar(respostas = {}, alertas = null) {
  const hipoteses = pontuarHipoteses(respostas);
  const destino = determinarDestino(respostas, hipoteses, alertas);

  return {
    motor: 'deterministico_hipoteses',
    usa_ia: false,
    total: hipoteses.length,
    hipoteses: hipoteses.slice(0, 8),
    destino,
    aviso_legal:
      'HIPÓTESES PROVÁVEIS são sugestões educativas baseadas no relato, não diagnóstico definitivo. ' +
      'O objetivo é orientar sua busca por profissional de saúde de confiança ou, quando indicado, emergência.'
  };
}

module.exports = { HIPOTESES, analisar, determinarDestino, pontuarHipoteses };
