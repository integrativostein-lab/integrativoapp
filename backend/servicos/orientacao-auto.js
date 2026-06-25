/**
 * Sínteses orientativas por vertente — motor IF/THEN determinístico.
 * Não é diagnóstico; eixos para conversa com profissional de saúde.
 */

function semAcentos(v) {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function texto(respostas) {
  return semAcentos(Object.values(respostas || {}).join(' '));
}

function num(respostas, id) {
  const n = Number(respostas[id]);
  return Number.isFinite(n) ? n : null;
}

function inclui(respostas, id, termos) {
  const t = semAcentos(respostas[id]);
  return termos.some((termo) => t.includes(semAcentos(termo)));
}

const REGRAS_VERTENTES = [
  {
    id: 'OCIDENTAL_SONO_001',
    vertente: 'Medicina ocidental (estilo de vida)',
    eixo: 'Sono e recuperação',
    condicao: (r) => inclui(r, 'qualidade_sono', ['ruim', 'muito ruim']) || (num(r, 'horas_sono') != null && num(r, 'horas_sono') < 6),
    orientacao: 'Padrão de sono reduzido ou de baixa qualidade merece revisão de rotina, higiene do sono e avaliação clínica se persistir.',
    conduta: 'Converse com seu médico ou profissional de referência antes de iniciar suplementos ou medicamentos para dormir.'
  },
  {
    id: 'OCIDENTAL_ESTRESSE_001',
    vertente: 'Medicina ocidental (estilo de vida)',
    eixo: 'Estresse e regulação',
    condicao: (r) => (num(r, 'estresse') != null && num(r, 'estresse') >= 7) || (num(r, 'ansiedade') != null && num(r, 'ansiedade') >= 7),
    orientacao: 'Níveis elevados de estresse ou ansiedade percebida pedem estratégias de regulação e, quando necessário, suporte especializado.',
    conduta: 'Práticas integrativas podem complementar, mas não substituem avaliação em saúde mental quando o sofrimento é intenso ou persistente.'
  },
  {
    id: 'OCIDENTAL_ATIVIDADE_001',
    vertente: 'Medicina ocidental (estilo de vida)',
    eixo: 'Movimento e metabolismo',
    condicao: (r) => {
      const af = semAcentos(r.atividade_fisica);
      return !af || af.includes('sedent') || af.includes('nao pratic') || af.includes('nenhum');
    },
    orientacao: 'Aumento gradual de movimento, conforme tolerância, costuma favorecer energia, humor e marcadores metabólicos.',
    conduta: 'Se houver doença cardiovascular, dor torácica ou limitação importante, peça liberação médica antes de intensificar exercícios.'
  },
  {
    id: 'AYURVEDA_AGNI_001',
    vertente: 'Ayurveda (leitura orientativa)',
    eixo: 'Digestão / agni',
    condicao: (r) => inclui(r, 'agni_ayurveda', ['vishama', 'tikshna', 'manda']) || inclui(r, 'digestao', ['fragil', 'irritavel', 'regular']),
    orientacao: 'Em Ayurveda, agni (fogo digestivo) desequilibrado sugere atenção a horários, combinações alimentares e ritmo das refeições.',
    conduta: 'Use esta leitura como roteiro de conversa com terapeuta ayurvédico ou nutricionista — não como diagnóstico constitucional fechado.'
  },
  {
    id: 'AYURVEDA_DOSHA_001',
    vertente: 'Ayurveda (leitura orientativa)',
    eixo: 'Constituição percebida',
    condicao: (r) => inclui(r, 'temperamento_ayurveda', ['vata', 'pitta', 'kapha']),
    orientacao: 'Constituições Vata, Pitta ou Kapha orientam estilo de vida, alimentação e rotina de forma preventiva na tradição ayurvédica.',
    conduta: 'Confirme padrões com profissional habilitado; autopercepção não substitui avaliação clínica ayurvédica completa.'
  },
  {
    id: 'MTC_CONST_001',
    vertente: 'Medicina tradicional chinesa (leitura orientativa)',
    eixo: 'Equilíbrio energético',
    condicao: (r) => {
      const c = semAcentos(r.constituicao_tcim);
      return c && !c.includes('nao avaliado') && !c.includes('misto');
    },
    orientacao: 'Padrões como Yin/Yang, Qi ou Umidade na MTC indicam eixos de cuidado (alimentação térmica, ritmo, repouso) a explorar com profissional.',
    conduta: 'Acupuntura, fitoterapia chinesa e dietoterapia exigem diagnóstico diferencial clínico — não se automedique com fórmulas.'
  },
  {
    id: 'AYURVEDA_RECOM_001',
    vertente: 'Ayurveda (recomendações orientativas)',
    eixo: 'Dinacharya e equilíbrio do agni',
    condicao: (r) => !!semAcentos(r.queixa_principal),
    orientacao: 'Priorize horários regulares para refeições, mastigação lenta e pausas de descanso. Observe como sono, digestão e humor respondem à rotina — eixos centrais na Ayurveda.',
    conduta: 'Evite automedicação com fórmulas ayurvédicas sem orientação. Consulte terapeuta ayurvédico para personalizar ahara (alimentação) e dinacharya conforme sua constituição.'
  },
  {
    id: 'NATURO_RECOM_001',
    vertente: 'Naturopatia (recomendações orientativas)',
    eixo: 'Terreno, hábitos e autocuidado',
    condicao: (r) => !!semAcentos(r.queixa_principal),
    orientacao: 'A naturopatia enfatiza hidratação adequada, alimentação in natura, exposição solar moderada e redução de ultraprocessados como base de reequilíbrio do terreno.',
    conduta: 'Registre sono, energia e digestão por alguns dias antes de mudanças intensas. Suplementos e desintoxicações exigem avaliação profissional individualizada.'
  },
  {
    id: 'AROMA_RECOM_001',
    vertente: 'Aromaterapia (recomendações orientativas)',
    eixo: 'Bem-estar olfativo e regulação',
    condicao: (r) => !!semAcentos(r.queixa_principal),
    orientacao: 'Inalação ou difusão suave de óleos essenciais (ex.: lavanda para relaxamento, limão-siciliano para ambiente energizante) pode complementar rotinas de descanso — sempre diluídos e com ventilação.',
    conduta: 'Não ingira óleos essenciais sem prescrição. Evite uso tópico ou inalatório em gestantes, lactantes, crianças e alérgicos sem orientação especializada.'
  },
  {
    id: 'MTC_RECOM_001',
    vertente: 'Medicina tradicional chinesa (recomendações orientativas)',
    eixo: 'Ritmo, alimentação térmica e repouso',
    condicao: (r) => !!semAcentos(r.queixa_principal),
    orientacao: 'Na MTC, regularidade de horários, proteção contra frio/calor extremos e alimentação adequada ao padrão energético percebido favorecem o equilíbrio de Qi, Yin e Yang.',
    conduta: 'Acupuntura, moxabustão e fitoterapia chinesa requerem diagnóstico diferencial por profissional habilitado — não substituem avaliação médica convencional.'
  },
  {
    id: 'YOGA_RECOM_001',
    vertente: 'Yoga (recomendações orientativas)',
    eixo: 'Movimento consciente e respiração',
    condicao: (r) => !!semAcentos(r.queixa_principal),
    orientacao: 'Práticas suaves de ásana, alongamento e pranayama (respiração) podem apoiar flexibilidade, sono e regulação do estresse quando adaptadas ao seu nível atual.',
    conduta: 'Evite inversões ou retenções intensas se houver hipertensão, glaucoma, gestação ou dor aguda sem liberação. Prefira aulas ou orientação de instrutor qualificado.'
  },
  {
    id: 'INTEGRATIVA_HABITOS_001',
    vertente: 'Visão integrativa transversal',
    eixo: 'Hábitos e continuidade do cuidado',
    condicao: (r) => texto(r).length > 80,
    orientacao: 'Seu relato combina queixa, hábitos e contexto — base útil para um plano integrativo compartilhado com profissionais de confiança.',
    conduta: 'Priorize continuidade, registros simples (sono, energia, digestão) e retorno programado em vez de mudanças bruscas isoladas.'
  },
  {
    id: 'INTEGRATIVA_GERAL_001',
    vertente: 'Visão integrativa transversal',
    eixo: 'Autocuidado e acompanhamento',
    condicao: (r) => !!semAcentos(r.queixa_principal),
    orientacao: 'Seu relato inicial já orienta uma conversa franca com profissionais de confiança sobre hábitos, sintomas e expectativas de cuidado.',
    conduta: 'Leve esta síntese a uma consulta presencial ou teleconsulta; evite mudanças bruscas de tratamento com base apenas neste resumo.'
  },
  {
    id: 'INTEGRATIVA_URGENCIA_001',
    vertente: 'Visão integrativa transversal',
    eixo: 'Sinais de alerta',
    condicao: (r) => {
      const t = texto(r);
      return ['dor toracica', 'falta de ar', 'dispneia', 'sincope', 'sangramento intenso', 'ideacao suicida', 'deficit neurologico']
        .some((s) => t.includes(s));
    },
    orientacao: 'Alguns sinais descritos exigem avaliação presencial urgente, independentemente de abordagens integrativas.',
    conduta: 'Procure pronto-socorro, SAMU ou serviço de urgência. Autoavaliação não substitui emergência médica.'
  }
];

function analisar(respostas = {}) {
  const vertentes = REGRAS_VERTENTES
    .filter((regra) => {
      try { return regra.condicao(respostas); } catch { return false; }
    })
    .map((regra) => ({
      regra_id: regra.id,
      vertente: regra.vertente,
      eixo: regra.eixo,
      orientacao: regra.orientacao,
      conduta: regra.conduta
    }));

  return {
    motor: 'deterministico_if_then',
    usa_ia: false,
    total_regras: REGRAS_VERTENTES.length,
    total_eixos: vertentes.length,
    vertentes
  };
}

module.exports = { REGRAS_VERTENTES, analisar };
