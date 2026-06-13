// Motor determinístico de segurança clínica.
// Não usa IA: aplica regras explícitas, auditáveis e rastreáveis por fonte.

const GRAVIDADE_PESO = {
  informativa: 1,
  moderada: 2,
  alta: 3,
  critica: 4
};

const POSICAO_PESO = {
  permitido: 1,
  sem_mencao: 2,
  cautela: 3,
  contraindicado: 4
};

const REGRAS_SEGURANCA = [
  {
    id: 'FITOTERAPIA_ANTICOAGULANTE_001',
    area: 'Fitoterapia',
    tipo: 'interacao',
    gravidade: 'alta',
    pratica: ['fitoterapia', 'ginkgo', 'ginkgo biloba', 'alho', 'gengibre', 'hiperico', 'erva de sao joao'],
    medicamentos: ['anticoagulante', 'varfarina', 'marevan', 'rivaroxabana', 'xarelto', 'apixabana', 'eliquis', 'heparina', 'aas', 'aspirina', 'clopidogrel'],
    mensagem: 'Possível aumento de risco de sangramento ou interação medicamentosa com fitoterápicos.',
    conduta: 'Não recomendar sem validação médica ou farmacêutica; checar medicação, dose, indicação e sinais de sangramento.',
    fontes: [
      { nome: 'ANVISA', posicao: 'cautela' },
      { nome: 'WHO Monographs', posicao: 'cautela' },
      { nome: 'NCCIH', posicao: 'cautela' }
    ]
  },
  {
    id: 'AROMATERAPIA_EPILEPSIA_001',
    area: 'Aromaterapia',
    tipo: 'contraindicacao',
    gravidade: 'alta',
    pratica: ['aromaterapia', 'oleo essencial', 'oleos essenciais', 'alecrim', 'salvia', 'eucalipto', 'canfora'],
    condicoes: ['epilepsia', 'convulsao', 'crise convulsiva', 'historico convulsivo'],
    mensagem: 'Alguns óleos essenciais podem ser inadequados em pessoas com epilepsia ou histórico convulsivo.',
    conduta: 'Evitar uso sem avaliação profissional habilitada; preferir abordagem conservadora e registrar orientação.',
    fontes: [
      { nome: 'Tisserand & Young', posicao: 'contraindicado' },
      { nome: 'IFPA safety guidance', posicao: 'cautela' },
      { nome: 'NCCIH', posicao: 'sem_mencao' }
    ]
  },
  {
    id: 'APITERAPIA_ALERGIA_001',
    area: 'Apiterapia',
    tipo: 'contraindicacao',
    gravidade: 'critica',
    pratica: ['apiterapia', 'propolis', 'mel', 'veneno de abelha', 'apitoxina', 'produtos apicolas'],
    alergias: ['abelha', 'mel', 'propolis', 'picada de abelha', 'produtos apicolas', 'anafilaxia'],
    condicoes: ['anafilaxia', 'alergia grave'],
    mensagem: 'Risco de reação alérgica grave/anafilaxia com produtos apícolas.',
    conduta: 'Não utilizar; encaminhar para avaliação médica/alergológica e orientar sinais de urgência.',
    fontes: [
      { nome: 'ANVISA', posicao: 'contraindicado' },
      { nome: 'diretrizes de alergia/anafilaxia', posicao: 'contraindicado' },
      { nome: 'Apimondia', posicao: 'cautela' }
    ]
  },
  {
    id: 'MASSOTERAPIA_TROMBOSE_001',
    area: 'Massoterapia',
    tipo: 'contraindicacao',
    gravidade: 'critica',
    pratica: ['massoterapia', 'massagem', 'drenagem', 'liberacao miofascial'],
    condicoes: ['trombose', 'suspeita de trombose', 'edema unilateral', 'dor panturrilha', 'tromboflebite'],
    mensagem: 'Massagem/manipulação pode ser perigosa em suspeita de trombose ou tromboflebite.',
    conduta: 'Não manipular; encaminhar para avaliação médica/urgência conforme sinais clínicos.',
    fontes: [
      { nome: 'AMTA clinical resources', posicao: 'contraindicado' },
      { nome: 'diretrizes de terapias manuais', posicao: 'contraindicado' },
      { nome: 'NCCIH', posicao: 'cautela' }
    ]
  },
  {
    id: 'ACUPUNTURA_GESTACAO_001',
    area: 'Acupuntura',
    tipo: 'contraindicacao',
    gravidade: 'alta',
    pratica: ['acupuntura', 'moxabustao', 'auriculoterapia', 'agulhamento'],
    condicoes: ['gestacao', 'gravidez', 'gestante', 'gestacao de risco'],
    mensagem: 'Há pontos e técnicas contraindicados ou que exigem cautela durante a gestação.',
    conduta: 'Usar apenas por profissional habilitado, com triagem obstétrica e evitando pontos contraindicados.',
    fontes: [
      { nome: 'WHO Benchmarks for Training in Acupuncture', posicao: 'cautela' },
      { nome: 'PNPIC/MS', posicao: 'cautela' },
      { nome: 'diretrizes de biossegurança em acupuntura', posicao: 'contraindicado' }
    ]
  },
  {
    id: 'SAUDE_MENTAL_RISCO_001',
    area: 'Saúde Mental',
    tipo: 'sinal_alarme',
    gravidade: 'critica',
    pratica: ['florais', 'reiki', 'meditacao', 'hipnoterapia', 'constelacao familiar', 'xamanismo', 'jyotish'],
    condicoes: ['ideacao suicida', 'risco suicida', 'suicidio', 'psicose', 'mania', 'surto', 'violencia', 'autoagressao'],
    mensagem: 'Sinal de alarme em saúde mental; prática complementar não substitui cuidado de crise.',
    conduta: 'Interromper condução isolada, acionar rede de apoio e encaminhar para urgência/RAPS/serviço especializado.',
    fontes: [
      { nome: 'Ministério da Saúde/RAPS', posicao: 'contraindicado' },
      { nome: 'NICE mental health guidelines', posicao: 'contraindicado' },
      { nome: 'DSM-5-TR/CID-11', posicao: 'cautela' }
    ]
  },
  {
    id: 'YOGA_CARDIOVASCULAR_001',
    area: 'Yoga',
    tipo: 'contraindicacao',
    gravidade: 'alta',
    pratica: ['yoga', 'pranayama', 'inversao', 'retencao respiratoria', 'asanas avancados'],
    condicoes: ['hipertensao nao controlada', 'dor toracica', 'sincope', 'cardiopatia instavel', 'pos operatorio'],
    mensagem: 'Práticas intensas, inversões ou retenções respiratórias podem ser inadequadas em condições cardiovasculares instáveis.',
    conduta: 'Evitar prática intensa; encaminhar para avaliação médica e adaptar para prática leve apenas quando liberado.',
    fontes: [
      { nome: 'WHO Guidelines on Physical Activity', posicao: 'cautela' },
      { nome: 'NCCIH', posicao: 'cautela' },
      { nome: 'diretrizes clínicas cardiovasculares', posicao: 'contraindicado' }
    ]
  },
  {
    id: 'SINAIS_ALARME_URGENCIA_001',
    area: 'Biblioteca transversal',
    tipo: 'sinal_alarme',
    gravidade: 'critica',
    pratica: ['qualquer', 'integrativa', 'consulta', 'terapia', 'orientacao'],
    condicoes: ['dor toracica', 'dispneia', 'falta de ar', 'deficit neurologico', 'avc', 'febre alta', 'sangramento intenso', 'trauma', 'intoxicacao'],
    mensagem: 'Sinal de alarme clínico; não deve haver atraso de atendimento de urgência.',
    conduta: 'Encaminhar imediatamente para urgência/emergência, SAMU ou serviço médico conforme contexto.',
    fontes: [
      { nome: 'AHA Guidelines', posicao: 'contraindicado' },
      { nome: 'Manchester Triage', posicao: 'contraindicado' },
      { nome: 'MSF Medical Guidelines', posicao: 'contraindicado' },
      { nome: 'Ministério da Saúde', posicao: 'contraindicado' }
    ]
  }
];

function semAcentos(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizarEntrada(valor) {
  if (Array.isArray(valor)) return valor.map(semAcentos).filter(Boolean);
  return semAcentos(valor)
    .split(/[,\n;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function textoContexto(contexto = {}) {
  const partes = [
    contexto.termo,
    contexto.pratica,
    contexto.produto,
    contexto.observacoes,
    contexto.itens,
    ...(Array.isArray(contexto.condicoes) ? contexto.condicoes : []),
    ...(Array.isArray(contexto.medicamentos) ? contexto.medicamentos : []),
    ...(Array.isArray(contexto.alergias) ? contexto.alergias : [])
  ];
  if (contexto.paciente) {
    partes.push(
      contexto.paciente.condicoes,
      contexto.paciente.medicamentos,
      contexto.paciente.alergias
    );
  }
  return semAcentos(partes.flat().filter(Boolean).join(' '));
}

function contemQualquer(texto, termos = []) {
  if (!termos || termos.length === 0) return false;
  return termos.some((termo) => texto.includes(semAcentos(termo)));
}

function regraCombina(regra, contexto) {
  const texto = textoContexto(contexto);
  const praticaGenerica = regra.pratica?.includes('qualquer');
  const batePratica = praticaGenerica || contemQualquer(texto, regra.pratica);
  if (!batePratica) return false;

  const grupos = ['condicoes', 'medicamentos', 'alergias'];
  const temGrupo = grupos.some((grupo) => regra[grupo]?.length > 0);
  if (!temGrupo) return true;
  return grupos.some((grupo) => regra[grupo]?.length > 0 && contemQualquer(texto, regra[grupo]));
}

function avaliarDivergencia(fontes = []) {
  const posicoes = fontes.map((fonte) => fonte.posicao || 'sem_mencao');
  const maior = Math.max(...posicoes.map((posicao) => POSICAO_PESO[posicao] || 0), 0);
  const menor = Math.min(...posicoes.map((posicao) => POSICAO_PESO[posicao] || 0), maior);
  return {
    divergente: maior - menor >= 2,
    posicao_mais_restritiva: Object.keys(POSICAO_PESO).find((key) => POSICAO_PESO[key] === maior) || 'sem_mencao'
  };
}

function criarAlerta(regra) {
  const divergencia = avaliarDivergencia(regra.fontes);
  return {
    regra_id: regra.id,
    area: regra.area,
    tipo: regra.tipo,
    gravidade: regra.gravidade,
    peso: GRAVIDADE_PESO[regra.gravidade] || 0,
    mensagem: regra.mensagem,
    conduta: regra.conduta,
    fontes: regra.fontes,
    divergencia,
    decisao: divergencia.posicao_mais_restritiva === 'contraindicado'
      ? 'prevalece_conduta_mais_restritiva'
      : 'alertar_e_revisar'
  };
}

function verificar(contexto = {}) {
  const alertas = REGRAS_SEGURANCA
    .filter((regra) => regraCombina(regra, contexto))
    .map(criarAlerta)
    .sort((a, b) => b.peso - a.peso || a.regra_id.localeCompare(b.regra_id));

  const maiorGravidade = alertas[0]?.gravidade || 'sem_alerta_critico';
  return {
    motor: 'deterministico_if_then',
    usa_ia: false,
    total_regras: REGRAS_SEGURANCA.length,
    total_alertas: alertas.length,
    maior_gravidade: maiorGravidade,
    mensagem_geral: alertas.length
      ? 'Foram encontrados alertas rastreáveis. Use a conduta mais conservadora e revise as fontes.'
      : 'Nenhum alerta crítico encontrado nas regras cadastradas. Isso não significa liberação clínica automática.',
    alertas
  };
}

module.exports = {
  REGRAS_SEGURANCA,
  verificar,
  normalizarEntrada
};
