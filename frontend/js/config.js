// ============================================
// CONFIGURAÇÃO GLOBAL DO INTEGRATIVO.APP v2.1
// Versão canônica: shared/versao.js · backend/package.json · /api/config/publica
// ============================================

const VERSAO_APP = '2.1.0';

const HOSTNAME_ATUAL = typeof window !== 'undefined' ? window.location.hostname : '';

/** Sobrescrito temporariamente pelo deploy Vercel (scripts/lib/deploy-flag.js). */
const INTEGRATIVO_DEPLOY = 'producao';

/** Hostnames que sempre usam backend alfa + banner de teste. */
const HOSTNAMES_TESTE = [
  'alfa.integrativoapp.com',
  'www.alfa.integrativoapp.com',
  'teste.integrativoapp.com',
  'www.teste.integrativoapp.com',
  'integrativoapp-alfa.vercel.app'
];

function hostEhAmbienteTeste(hostname) {
  const h = (hostname || '').toLowerCase();
  if (!h) return false;
  if (INTEGRATIVO_DEPLOY === 'alfa') return true;
  if (HOSTNAMES_TESTE.some((d) => h === d || h.endsWith('.' + d))) return true;
  if (h.includes('integrativoapp-alfa')) return true;
  if (h.includes('alfa') || h.includes('alpha')) return true;
  return false;
}

/** URL canônica de produção — demais domínios redirecionam para ela na Vercel. */
const SITE_CANONICO = 'https://integrativo.app';

function resolverApiUrl() {
  if (typeof window !== 'undefined' && window.INTEGRATIVO_API_URL) {
    return window.INTEGRATIVO_API_URL;
  }
  if (['localhost', '127.0.0.1'].includes(HOSTNAME_ATUAL)) {
    return 'http://localhost:3001/api';
  }
  if (hostEhAmbienteTeste(HOSTNAME_ATUAL)) {
    return 'https://integrativoappespelho.onrender.com/api';
  }
  return 'https://integra-backend-ynrd.onrender.com/api';
}

/** Até certificações: recursos clínicos regulados ficam dormentes. Defina window.INTEGRATIVO_RECURSOS_CLINICOS = true para liberar. */
function resolverModoLancamento() {
  if (typeof window !== 'undefined' && window.INTEGRATIVO_RECURSOS_CLINICOS === true) return false;
  if (typeof window !== 'undefined' && window.INTEGRATIVO_RECURSOS_CLINICOS === false) return true;
  return true;
}

const CONFIG = {
  VERSAO: VERSAO_APP,
  // ═══════════════════════════════════════════
  // SITE
  // ═══════════════════════════════════════════
  SITE_URL: SITE_CANONICO,

  // ═══════════════════════════════════════════
  // API
  // ═══════════════════════════════════════════
  API_URL: resolverApiUrl(),

  /** true no hostname/subdomínio de teste ou bundle deployado como alfa */
  AMBIENTE_TESTE: hostEhAmbienteTeste(HOSTNAME_ATUAL),
  INTEGRATIVO_DEPLOY,
  HOSTNAMES_TESTE,

  // ═══════════════════════════════════════════
  // MODO LANÇAMENTO — terapeutas integrativos (sem conselho regulado)
  // ═══════════════════════════════════════════
  MODO_LANCAMENTO: {
    ativo: resolverModoLancamento(),
    marcaAguaAlfa: true,
    publico: 'terapeutas integrativos sem conselho profissional regulado',
    aviso:
      'Bibliotecas terapêuticas, agenda, anamnese, teleconsulta e emissão de recomendações permanecem ativas.'
  },

  // ═══════════════════════════════════════════
  // PLANOS (MODELO MENSAL — 2026)
  // Comissão paga: 5% (menor do mercado). Freemium: sem comissão.
  // ═══════════════════════════════════════════
  PLANOS: {
    freemium: {
      nome: 'Freemium',
      valor_mensal: 0,
      valor_anual: 0,
      descricao: 'Para começar sem custo fixo',
      max_profissionais: 1,
      teleconsultas_mes: 15,
      max_pacientes: 30,
      whatsapp_mensagens_mes: 0,
      comissao_consulta_pct: 0,
      blog: false,
      loja: false,
      prescricao: true,
      anamnese: true,
      prontuario: true,
      ferramentas_gestao: false,
      fhir_tiss: false,
      especialidades_inclusas: 1,
      destaque: false,
      recursos: [
        '1 profissional',
        '15 teleconsultas/mês',
        '30 pacientes',
        '1 especialidade',
        'Anamnese, prontuário e prescrição eletrônica',
        'Sem comissão sobre consultas'
      ]
    },
    guardioes_floresta: {
      nome: 'Guardiões da Floresta',
      valor_mensal: 10,
      valor_anual: 120,
      descricao: 'Reconhecimento público · condição social',
      max_profissionais: 1,
      teleconsultas_mes: 30,
      max_pacientes: 50,
      whatsapp_mensagens_mes: 0,
      comissao_consulta_pct: 0,
      blog: false,
      loja: false,
      anamnese: true,
      prontuario: true,
      prescricao: false,
      recomendacao: true,
      ferramentas_gestao: false,
      fhir_tiss: false,
      especialidades_inclusas: 3,
      plano_social: true,
      destaque: false,
      recursos: [
        '1 profissional',
        '30 teleconsultas/mês',
        '50 pacientes',
        '3 especialidades',
        'Anamnese e prontuário',
        'Recomendações clínicas auxiliares (bibliotecas terapêuticas)',
        'Sem comissão sobre consultas',
        'Sem prescrição eletrônica',
        'Mediante reconhecimento público Guardiões da Floresta'
      ]
    },
    pro: {
      nome: 'Pro',
      valor_mensal: 99.9,
      valor_anual: 1198.8,
      descricao: 'Para profissionais independentes',
      max_profissionais: 1,
      max_recepcionistas: 1,
      teleconsultas_mes: 100,
      max_pacientes: 300,
      whatsapp_mensagens_mes: 200,
      comissao_consulta_pct: 5,
      blog: true,
      loja: true,
      prescricao: true,
      ferramentas_gestao: true,
      fhir_tiss: true,
      especialidades_inclusas: 10,
      destaque: true,
      recursos: [
        '1 profissional · 1 recepcionista',
        '100 teleconsultas/mês',
        '200 mensagens/mês',
        '300 pacientes · 10 especialidades',
        'Blog, loja e prescrição eletrônica',
        'Ferramentas administrativas: financeiro, RH, contábil e NF',
        'Comissão de 5% sobre consultas'
      ]
    },
    clinic: {
      nome: 'Clinic',
      valor_mensal: 799,
      valor_anual: 9588,
      descricao: 'Para clínicas com até 15 profissionais',
      max_profissionais: 15,
      max_recepcionistas: 3,
      teleconsultas_mes: 1200,
      max_pacientes: 3000,
      whatsapp_mensagens_mes: 2400,
      comissao_consulta_pct: 5,
      blog: true,
      loja: true,
      prescricao: true,
      reuniao_interna: true,
      byos: true,
      ferramentas_gestao: true,
      fhir_tiss: true,
      especialidades_inclusas: 67,
      cobranca_por_profissional: false,
      destaque: false,
      recursos: [
        'Até 15 profissionais · 3 recepcionistas',
        '1.200 teleconsultas/mês',
        '2.400 mensagens/mês · 3.000 pacientes',
        'Blog, loja, prescrição eletrônica e reunião interna',
        'BYOS para gravações e streamings',
        'Ferramentas administrativas completas',
        'Comissão de 5% sobre consultas'
      ]
    },
    enterprise: {
      nome: 'Enterprise',
      valor_mensal: null,
      valor_anual: null,
      descricao: 'Solução institucional sob medida',
      max_profissionais: 'sob consulta',
      teleconsultas_mes: 'sob consulta',
      max_pacientes: 'sob consulta',
      whatsapp_mensagens_mes: 'sob consulta',
      comissao_consulta_pct: 5,
      blog: true,
      loja: true,
      prescricao: true,
      ferramentas_gestao: true,
      fhir_tiss: true,
      modo_aluno: true,
      teleaulas: true,
      especialidades_inclusas: 'sob consulta',
      sob_consulta: true,
      destaque: false,
      recursos: [
        'Profissionais, módulos e bibliotecas customizáveis',
        'Teleconsultas, teleaulas e mensagens sob medida',
        'Prescrição eletrônica',
        'Modo aluno (simulação de consultório profissional)',
        'Comissão de 5% sobre consultas',
        'Fale conosco para proposta personalizada'
      ]
    }
  },

  // ═══════════════════════════════════════════
  // PARCELAMENTO (Tabela Price)
  // ═══════════════════════════════════════════
  PARCELAMENTO: {
    max_parcelas: 1,
    juros_mes: 0.0199,
    desconto_pix_pct: 5,
    desconto_abrath_pct: 8,
    arredondarMoeda(valor) {
      return Math.round(Number(valor || 0) * 100) / 100;
    },
    aplicarDescontoPct(valor, pct) {
      return this.arredondarMoeda(Number(valor || 0) * (1 - pct / 100));
    },
    calcular(valor, n) {
      const parcelas = Math.max(1, Math.min(this.max_parcelas, parseInt(n, 10) || 1));
      const base = this.arredondarMoeda(valor);
      if (parcelas === 1) {
        return { valorParcela: base, valorTotal: base, juros: 0, parcelas: 1 };
      }
      const i = this.juros_mes;
      const fator = (i * Math.pow(1 + i, parcelas)) / (Math.pow(1 + i, parcelas) - 1);
      const valorParcela = valor * fator;
      const valorTotal = valorParcela * parcelas;
      return {
        parcelas,
        valorParcela: parseFloat(valorParcela.toFixed(2)),
        valorTotal: parseFloat(valorTotal.toFixed(2)),
        juros: parseFloat((valorTotal - valor).toFixed(2))
      };
    }
  },

  // ═══════════════════════════════════════════
  // CANCELAMENTO
  // ═══════════════════════════════════════════
  CANCELAMENTO: {
    prazo_arrependimento_dias: 15,
    arrependimento_apenas_primeira_assinatura: true,
    reembolso_integral_dentro_prazo: true,
    multa_apos_prazo_pct: 0,
    acesso_ate_fim_ciclo: true,
    mensagem: 'Cancelamento a qualquer momento, sem multa. Na primeira assinatura, até 15 dias: reembolso integral. Renovações: sem reembolso — o acesso continua até o fim do ciclo mensal pago e a renovação não é cobrada. Certificado digital não está incluído nos planos; compra opcional à parte.'
  },

  // ═══════════════════════════════════════════
  // GATEWAYS DE PAGAMENTO
  // ═══════════════════════════════════════════
  GATEWAYS: [
    { id: 'pagseguro',   nome: 'PagSeguro',    taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'pagbank',     nome: 'PagBank',      taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'asaas',       nome: 'Asaas',        taxa_cartao: '2,99%', taxa_pix: '1,99%' },
    { id: 'ton',         nome: 'Ton',          taxa_cartao: '1,99%', taxa_pix: '0,99%' },
    { id: 'mercadopago', nome: 'Mercado Pago', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'efi',         nome: 'Efi Bank',     taxa_cartao: '1,99%', taxa_pix: '1,99%' },
    { id: 'cielo',       nome: 'Cielo',        taxa_cartao: 'Variável', taxa_pix: '1,99%' },
    { id: 'stone',       nome: 'Stone',        taxa_cartao: 'Variável', taxa_pix: '1,99%' }
  ],

  // ═══════════════════════════════════════════
  // ESPECIALIDADES — INTEGRATIVAS + REGULAMENTADAS
  // ═══════════════════════════════════════════
  ESPECIALIDADES: [
    // === SABERES TRADICIONAIS E PICS (SEM CONSELHO) ===
    { id: 'fitoterapia',     nome: 'Fitoterapia',                     conselho: null,     categoria: 'PICS / Integrativa' },
    { id: 'ayurveda',        nome: 'Ayurveda',                        conselho: null,     categoria: 'Tradicional' },
    { id: 'mtc',             nome: 'Medicina Tradicional Chinesa',    conselho: null,     categoria: 'Tradicional' },
    { id: 'yoga',            nome: 'Yoga (instrutor)',                conselho: null,     categoria: 'Movimento' },
    { id: 'jyotish',         nome: 'Jyotish (Astrologia Védica)',     conselho: null,     categoria: 'Tradicional' },
    { id: 'vastu',           nome: 'Vastu Shastra',                   conselho: null,     categoria: 'Tradicional' },
    { id: 'xamanismo',       nome: 'Xamanismo',                       conselho: null,     categoria: 'Espiritual' },

    // === MEDICINAS TRADICIONAIS REGIONAIS (i18n / BRICS+ / Ásia / LATAM / África / Europa) ===
    { id: 'kampo',                      nome: 'Kampo (Medicina Tradicional Japonesa)',              conselho: null, categoria: 'Tradicional' },
    { id: 'hanbang',                    nome: 'Hanbang (Medicina Tradicional Coreana)',             conselho: null, categoria: 'Tradicional' },
    { id: 'jamu',                       nome: 'Jamu (Medicina Tradicional Indonésia)',              conselho: null, categoria: 'Tradicional' },
    { id: 'unani-tibb',                 nome: 'Unani / Tibb (Medicina Tradicional Persa-Islâmica)', conselho: null, categoria: 'Tradicional' },
    { id: 'siddha',                     nome: 'Siddha (Medicina Tradicional do Sul da Índia)',      conselho: null, categoria: 'Tradicional' },
    { id: 'medicina-tradicional-russa', nome: 'Medicina Tradicional Russa / Fitoterapia Eslava',    conselho: null, categoria: 'Tradicional' },
    { id: 'medicina-tradicional-africana', nome: 'Medicina Tradicional Africana (Inyanga / Ubuntu)', conselho: null, categoria: 'Tradicional' },
    { id: 'herbolaria-latinoamericana', nome: 'Herbolaria Latino-Americana',                        conselho: null, categoria: 'Tradicional' },
    { id: 'phytotherapie',              nome: 'Phytothérapie (Medicina Tradicional Europeia)',      conselho: null, categoria: 'Tradicional' },

    { id: 'florais-bach',    nome: 'Florais de Bach',                 conselho: null,     categoria: 'Florais' },
    { id: 'terapia-florais', nome: 'Terapia de Florais',              conselho: null,     categoria: 'Florais' },
    { id: 'apiterapia',      nome: 'Apiterapia',                      conselho: null,     categoria: 'Produtos Naturais' },
    { id: 'arteterapia',     nome: 'Arteterapia',                     conselho: null,     categoria: 'PICS' },
    { id: 'biodanca',        nome: 'Biodança',                        conselho: null,     categoria: 'PICS' },
    { id: 'bioenergetica',   nome: 'Bioenergética',                   conselho: null,     categoria: 'PICS' },
    { id: 'constelacao-familiar', nome: 'Constelação Familiar',        conselho: null,     categoria: 'PICS' },
    { id: 'danca-circular',  nome: 'Dança Circular',                  conselho: null,     categoria: 'PICS' },
    { id: 'geoterapia',      nome: 'Geoterapia',                      conselho: null,     categoria: 'PICS' },
    { id: 'hipnoterapia',    nome: 'Hipnoterapia',                    conselho: null,     categoria: 'PICS' },
    { id: 'homeopatia',      nome: 'Homeopatia',                      conselho: null,     categoria: 'PICS' },
    { id: 'imposicao-maos',  nome: 'Imposição de Mãos',               conselho: null,     categoria: 'PICS' },
    { id: 'medicina-antroposofica', nome: 'Medicina Antroposófica',    conselho: null,     categoria: 'PICS' },
    { id: 'meditacao',       nome: 'Meditação',                       conselho: null,     categoria: 'PICS' },
    { id: 'naturopatia',     nome: 'Naturopatia',                     conselho: null,     categoria: 'PICS' },
    { id: 'ozonioterapia',   nome: 'Ozonioterapia',                   conselho: null,     categoria: 'PICS' },
    { id: 'shantala',        nome: 'Shantala',                        conselho: null,     categoria: 'PICS' },
    { id: 'terapia-comunitaria-integrativa', nome: 'Terapia Comunitária Integrativa', conselho: null, categoria: 'PICS' },
    { id: 'termalismo-crenoterapia', nome: 'Termalismo Social / Crenoterapia', conselho: null, categoria: 'PICS' },

    // === COM CONSELHO ABRATH (NÃO É CONSELHO OFICIAL - VAI PARA SABERES) ===
    { id: 'massoterapia',    nome: 'Massoterapia',                    conselho: 'ABRATH', categoria: 'Terapia Manual' },
    { id: 'reflexologia',    nome: 'Reflexologia',                    conselho: 'ABRATH', categoria: 'Terapia Manual' },
    { id: 'reiki',           nome: 'Reiki',                           conselho: 'ABRATH', categoria: 'Energia' },
    { id: 'aromaterapia',    nome: 'Aromaterapia',                    conselho: 'ABRATH', categoria: 'Óleos Essenciais' },
    { id: 'cromoterapia',    nome: 'Cromoterapia',                    conselho: 'ABRATH', categoria: 'Energia' },
    { id: 'musicoterapia',   nome: 'Musicoterapia',                   conselho: 'ABRATH', categoria: 'Terapia' },
    { id: 'quiropraxia',     nome: 'Quiropraxia',                     conselho: 'ABRATH', categoria: 'Terapia Manual' },
    { id: 'osteopatia',      nome: 'Osteopatia',                      conselho: 'ABRATH', categoria: 'Terapia Manual' },
    { id: 'acupuntura',      nome: 'Acupuntura',                      conselho: 'ABRATH', categoria: 'MTC' },

    // === PROFISSÕES REGULAMENTADAS (COM CONSELHO OFICIAL) ===
    // CRM
    { id: 'medico',                nome: 'Médico (clínico geral)',          conselho: 'CRM', categoria: 'Médica' },
    { id: 'medicina-integrativa',  nome: 'Medicina Integrativa',            conselho: 'CRM', categoria: 'Médica' },
    { id: 'medicina-de-familia',   nome: 'Medicina de Família',             conselho: 'CRM', categoria: 'Médica' },
    { id: 'pediatria',             nome: 'Pediatria',                       conselho: 'CRM', categoria: 'Médica' },
    { id: 'ginecologia',           nome: 'Ginecologia',                     conselho: 'CRM', categoria: 'Médica' },
    { id: 'geriatria',             nome: 'Geriatria',                       conselho: 'CRM', categoria: 'Médica' },
    { id: 'psiquiatria',           nome: 'Psiquiatria',                     conselho: 'CRM', categoria: 'Médica' },
    { id: 'emergencia',            nome: 'Emergência',                      conselho: 'CRM', categoria: 'Médica' },

    // CRP
    { id: 'psicologo',         nome: 'Psicólogo(a)',                  conselho: 'CRP',     categoria: 'Psicologia' },
    { id: 'neuropsicologia',   nome: 'Neuropsicologia',               conselho: 'CRP',     categoria: 'Psicologia' },

    // CREFITO
    { id: 'fisioterapia',        nome: 'Fisioterapia',                conselho: 'CREFITO', categoria: 'Reabilitação' },
    { id: 'hidroterapia',        nome: 'Hidroterapia',                conselho: 'CREFITO', categoria: 'Reabilitação' },
    { id: 'equoterapia',         nome: 'Equoterapia',                 conselho: 'CREFITO', categoria: 'Reabilitação' },
    { id: 'terapia-ocupacional', nome: 'Terapia Ocupacional',         conselho: 'CREFITO', categoria: 'Reabilitação' },

    // COREN
    { id: 'enfermeiro',         nome: 'Enfermeiro(a)',                conselho: 'COREN',   categoria: 'Enfermagem' },
    { id: 'tecnico-enfermagem', nome: 'Técnico de Enfermagem',        conselho: 'COREN',   categoria: 'Enfermagem' },
    { id: 'obstetrica',         nome: 'Enfermeiro(a) Obstetra',       conselho: 'COREN',   categoria: 'Enfermagem' },

    // CRN
    { id: 'nutricionista',       nome: 'Nutricionista',               conselho: 'CRN',     categoria: 'Nutrição' },
    { id: 'nutricao-funcional',  nome: 'Nutrição Funcional',          conselho: 'CRN',     categoria: 'Nutrição' },
    { id: 'nutricao-esportiva',  nome: 'Nutrição Esportiva',          conselho: 'CRN',     categoria: 'Nutrição' },

    // CRO
    { id: 'odontologo',     nome: 'Odontólogo(a)',                    conselho: 'CRO',     categoria: 'Odontologia' },

    // CRF
    { id: 'farmaceutico',   nome: 'Farmacêutico(a)',                  conselho: 'CRF',     categoria: 'Farmácia' },

    // CRBM
    { id: 'biomedico',      nome: 'Biomédico(a)',                     conselho: 'CRBM',    categoria: 'Biomedicina' },

    // CRBIO
    { id: 'biologo',        nome: 'Biólogo(a)',                       conselho: 'CRBIO',   categoria: 'Biologia' },

    // CREF
    { id: 'educador-fisico',  nome: 'Educador Físico',                conselho: 'CREF',    categoria: 'Atividade Física' },
    { id: 'personal-trainer', nome: 'Personal Trainer',               conselho: 'CREF',    categoria: 'Atividade Física' }
  ],

  // ═══════════════════════════════════════════
  // BIBLIOTECAS TERAPÊUTICAS — PROTOCOLOS (ATUALIZADO)
  // ═══════════════════════════════════════════
  BIBLIOTECAS_TERAPEUTICAS: {
    // Totais preenchidos em runtime via shared/catalogo-terapeutico.json (npm run catalogo:sync)
    total_bibliotecas: 0,
    total_especialidades: 0,
    bibliotecas_transversais: 0,
    bibliotecas_por_pratica: 0,
    total_registros: 0,
    registros_base: 781,
    registros_blocos: 170,
    protocolos_criados: 240,
    especialidades_banco_seed: 30,
    especialidades_protocolos: 47,
    fontes: [
      'OMS/WHO', 
      'PNPIC/MS', 
      'Ministério da Saúde', 
      'Fiocruz/ARCA', 
      'BIREME/OPAS/BVS', 
      'RedePICS Brasil', 
      'Cochrane', 
      'ANVISA', 
      'NICE', 
      'AYUSH', 
      'NCCIH', 
      'MSF Medical Guidelines', 
      'SciELO', 
      'PubMed/NCBI', 
      'Diretrizes profissionais', 
      // === NOVAS FONTES ===
      'WHO Mental Health Guidance 2025',
      'mhGAP Guideline 2025',
      'mhGAP Intervention Guide 2.0',
      'WHO Mental Health Atlas 2024',
      'WHO Comprehensive Mental Health Action Plan 2013-2030',
      'WHO QualityRights',
      'WHO Cross-Sectoral Mental Health Guidance',
      'APA Guidelines',
      'APA Division of Psychotherapy',
      'APA Division 40 (Clinical Neuropsychology)',
      'BVS Psicologia',
      'SATEPSI',
      'CFP',
      'Ministério da Saúde/RAPS',
      'DSM-5-TR',
      'CID-11',
      'Textos clássicos: Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya, Bhavaprakasha Nighantu, Dhanvantari Nighantu, Kaiyadeva Nighantu, Bṛhat Parāśara Horā Śāstra, Bṛhat Jātaka, Saravali, Phaladeepika, Vastu Shastra, Mayamata e Manasara',
      'Dr. Vasant Lad',
      'MHLW Japan Kampo',
      'MFDS Korea Hanbang',
      'BPOM Indonesia',
      'Ministry of AYUSH Siddha/Unani',
      'WHO African Traditional Medicine Strategy',
      'ANSES / ESCOP / EMA Herbal Monographs'
    ],
    tipos: ['fontes confiáveis', 'protocolos de avaliação', 'tratamentos/intervenções', 'encaminhamentos', 'segurança clínica'],
    itens: [
      'Fitoterapia', 'Ayurveda', 'MTC', 'Yoga', 'Massoterapia', 'Aromaterapia',
      'Kampo', 'Hanbang', 'Jamu', 'Unani / Tibb', 'Siddha',
      'Medicina Tradicional Russa', 'Medicina Tradicional Africana',
      'Herbolaria Latino-Americana', 'Phytothérapie',
      'Aushadha Dravya (clássicos ayurvédicos)', 'Ahara (dietética ayurvédica clássica)', 'Dinacharya (rotina diária ayurvédica)', 'Ayurveda Clássico: diagnóstico, tratamentos e protocolos',
      'Fisioterapia', 'Xamanismo', 'Florais de Bach', 'Terapia de Florais', 'Reiki', 'Reflexologia',
      'Medicina Integrativa', 'Jyotish', 'Vastu Shastra', 'Quiropraxia',
      'Osteopatia', 'Cromoterapia', 'Musicoterapia', 'Equoterapia', 'Apiterapia',
      'Arteterapia', 'Biodança', 'Bioenergética', 'Constelação Familiar',
      'Dança Circular', 'Geoterapia', 'Hipnoterapia', 'Homeopatia',
      'Imposição de Mãos', 'Medicina Antroposófica', 'Meditação', 'Naturopatia',
      'Ozonioterapia', 'Shantala', 'Terapia Comunitária Integrativa',
      'Termalismo Social / Crenoterapia',
      'Hidroterapia', 'Acupuntura', 'Medicina Tradicional', 'Farmacologia',
      'Pediatria', 'Ginecologia', 'Geriatria', 'Saúde Mental',
      'Medicina de Família', 'Emergência', 'Psicologia', 'Neuropsicologia', 'Psicoterapia', 'Avaliação Psicológica',
      'Anamnese e Semiotécnica Integrativa', 'Sinais de Alarme e Encaminhamento',
      'Contraindicações e Segurança Clínica', 'Interações e Farmacovigilância',
      'Consentimento Informado e LGPD em Saúde', 'Escalas e Desfechos Clínicos',
      'Evolução, Prontuário e SOAP', 'Teleconsulta Segura', 'Ciclos de Vida',
      'Dor, Sono e Estresse', 'Educação do Paciente e Autocuidado',
      'Protocolos Transversais por Especialidade'
    ],
    matriz: [
      // ============================================
      // SABERES TRADICIONAIS E PICS
      // ============================================
      { especialidade: 'Fitoterapia', categoria: 'PICS / Integrativa', base: 'Oficial e científica', fontes: 'PNPIC/MS; RENISUS/MS; ANVISA; OMS/WHO Monographs; Farmacopeia Brasileira' },
      { especialidade: 'Ayurveda', categoria: 'PICS / Saber tradicional', base: 'Tradicional com diretrizes internacionais', fontes: 'PNPIC/MS; WHO Benchmarks for Training in Ayurveda; Ministry of AYUSH; Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Bhavaprakasha Nighantu; Dhanvantari Nighantu; Kaiyadeva Nighantu; Dr. Vasant Lad' },
      { especialidade: 'Aushadha Dravya', categoria: 'Biblioteca clássica ayurvédica', base: 'Matéria médica ayurvédica: substâncias, ervas, formulações, rasa, guna, virya, vipaka, prabhava, segurança e uso tradicional', fontes: 'Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Bhavaprakasha Nighantu; Dhanvantari Nighantu; Kaiyadeva Nighantu; Ministry of AYUSH' },
      { especialidade: 'Ahara', categoria: 'Biblioteca clássica ayurvédica', base: 'Dietética ayurvédica: alimentação, compatibilidade alimentar, rotina, agni, ama, pathya-apathya e orientação alimentar individualizada', fontes: 'Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Kashyapa Samhita; Bhavaprakasha Nighantu; Ministry of AYUSH' },
      { especialidade: 'Dinacharya', categoria: 'Biblioteca clássica ayurvédica', base: 'Rotina diária ayurvédica: sono, higiene, oleação, movimento, respiração, alimentação, horários, autocuidado e adaptação ao biotipo/estação', fontes: 'Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Ministry of AYUSH; WHO Benchmarks for Training in Ayurveda' },
      { especialidade: 'Ayurveda Clássico: diagnóstico, tratamentos e protocolos', categoria: 'Biblioteca clássica ayurvédica', base: 'Avaliação e cuidado ayurvédico complementar: darshana, sparshana, prashna, prakriti, vikriti, agni, ama, dosha, dhatu, mala, nadi, jihva, nidana, chikitsa, shamana, shodhana, rasayana, dinacharya, ritucharya, ahara, aushadha, encaminhamentos e segurança clínica sem substituir diagnóstico médico', fontes: 'Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Madhava Nidana; Bhavaprakasha Nighantu; Dr. Vasant Lad; Ministry of AYUSH; WHO Benchmarks for Training in Ayurveda' },
      { especialidade: 'Medicina Tradicional Chinesa', categoria: 'PICS / Saber tradicional', base: 'Tradicional com diretrizes de formação e integração segura', fontes: 'PNPIC/MS; WHO Benchmarks for Training in Traditional Chinese Medicine; OMS/WHO TCIM; Huangdi Neijing; Nan Jing; Shang Han Lun' },
      { especialidade: 'Yoga (instrutor)', categoria: 'PICS / Movimento', base: 'Prática mente-corpo com revisões e diretrizes de segurança', fontes: 'PNPIC/MS; OMS/WHO atividade física; Cochrane; NCCIH; Yoga Sutras de Patanjali; Hatha Yoga Pradipika; Bhagavad Gita' },
      { especialidade: 'Jyotish (Astrologia Védica)', categoria: 'Saber tradicional', base: 'Leitura simbólica e cultural para reflexão, sem uso diagnóstico ou determinista', fontes: 'Bṛhat Parāśara Horā Śāstra; Bṛhat Jātaka; Sārāvalī; Phaladīpikā; princípios éticos de aconselhamento; segurança em saúde mental' },
      { especialidade: 'Vastu Shastra', categoria: 'Saber tradicional', base: 'Organização ambiental não invasiva com foco em bem-estar e segurança do espaço', fontes: 'Vastu Shastra; Mayamata; Manasara; WHO healthy housing principles; ergonomia ambiental' },
      { especialidade: 'Xamanismo', categoria: 'Saber ancestral', base: 'Prática cultural e simbólica com consentimento, segurança cultural e redução de danos', fontes: 'OMS/WHO Traditional Medicine Strategy; PNPIC/MS; literatura de segurança cultural' },

      // === MEDICINAS TRADICIONAIS REGIONAIS (países referenciados no i18n) ===
      { especialidade: 'Kampo (Medicina Tradicional Japonesa)', categoria: 'PICS / Saber tradicional', base: 'Medicina tradicional japonesa com formulações clássicas adaptadas; uso complementar integrado ao cuidado biomédico', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; MHLW Japan Kampo; WHO Benchmarks for Training in Traditional Chinese Medicine; PNPIC/MS; Shang Han Lun; OMS/WHO TCIM' },
      { especialidade: 'Hanbang (Medicina Tradicional Coreana)', categoria: 'PICS / Saber tradicional', base: 'Medicina tradicional coreana: diagnóstico constitucional, herbal, acupuntura coreana e integração segura', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; MFDS Korea; Dongui Bogam; WHO Benchmarks for Training in Traditional Chinese Medicine; PNPIC/MS; OMS/WHO TCIM' },
      { especialidade: 'Jamu (Medicina Tradicional Indonésia)', categoria: 'PICS / Saber tradicional', base: 'Fitoterapia tradicional indonésia (jamu): preparações herbais, rotina, autocuidado e vigilância sanitária', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; BPOM Indonesia; Ministry of Health Indonesia; PNPIC/MS; BVS/BIREME; OMS/WHO Monographs' },
      { especialidade: 'Unani / Tibb (Medicina Tradicional Persa-Islâmica)', categoria: 'PICS / Saber tradicional', base: 'Medicina greco-árabe-persa: temperamentos, matéria médica, dietética, higiene e integração responsável', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; Ministry of AYUSH Unani; Avicenna Canon of Medicine; PNPIC/MS; OMS/WHO TCIM; diretrizes de segurança clínica' },
      { especialidade: 'Siddha (Medicina Tradicional do Sul da Índia)', categoria: 'PICS / Saber tradicional', base: 'Sistema tradicional tamil: constituição, matéria médica, alquimia vegetal/mineral com rigor de segurança', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; Ministry of AYUSH Siddha; literatura clássica tamil; PNPIC/MS; WHO Benchmarks for Training in Ayurveda' },
      { especialidade: 'Medicina Tradicional Russa / Fitoterapia Eslava', categoria: 'PICS / Saber tradicional', base: 'Fitoterapia e práticas tradicionais eslavas integradas a cuidado complementar e triagem clínica', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; Ministério da Saúde Rússia; OMS/WHO Monographs; PNPIC/MS; BVS/BIREME; PubMed/NCBI' },
      { especialidade: 'Medicina Tradicional Africana (Inyanga / Ubuntu)', categoria: 'PICS / Saber tradicional', base: 'Saberes tradicionais africanos com consentimento, segurança cultural, redução de danos e respeito comunitário', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; WHO African Traditional Medicine Strategy; Department of Health South Africa; SAHPRA; PNPIC/MS; princípios Ubuntu e segurança cultural' },
      { especialidade: 'Herbolaria Latino-Americana', categoria: 'PICS / Saber tradicional', base: 'Uso tradicional de plantas medicinais na América Latina com rastreabilidade, interações e respeito a saberes indígenas', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; BVS/BIREME; OPAS/OMS; PNPIC/MS; ANVISA; farmacopeias latino-americanas; SciELO' },
      { especialidade: 'Phytothérapie (Medicina Tradicional Europeia)', categoria: 'PICS / Saber tradicional', base: 'Fitoterapia europeia baseada em monografias oficiais, posologia, interações e farmacovigilância', fontes: 'WHO Global Traditional Medicine Strategy 2025-2034; ANSES France; ESCOP monographs; EMA herbal monographs; NICE; PNPIC/MS; Cochrane; PubMed/NCBI' },

      { especialidade: 'Florais de Bach', categoria: 'Florais', base: 'Biblioteca específica de florais para apoio emocional complementar', fontes: 'Bach Centre; PNPIC/MS; BVS/BIREME' },
      { especialidade: 'Terapia de Florais', categoria: 'PICS / Complementar', base: 'Prática complementar emocional; não substitui cuidado de saúde mental', fontes: 'PNPIC/MS; Bach Centre; BVS/BIREME' },
      { especialidade: 'Apiterapia', categoria: 'PICS / Produtos naturais', base: 'Uso complementar com cautela alergênica', fontes: 'PNPIC/MS; ANVISA; literatura de alergia/anafilaxia; Apimondia' },
      { especialidade: 'Arteterapia', categoria: 'PICS / Expressiva', base: 'Prática expressiva complementar', fontes: 'PNPIC/MS; BVS/BIREME; literatura de saúde mental e reabilitação psicossocial; WHO Mental Health Guidance 2025' },
      { especialidade: 'Biodança', categoria: 'PICS / Movimento', base: 'Prática corporal complementar', fontes: 'PNPIC/MS; BVS/BIREME; RedePICS Brasil' },
      { especialidade: 'Bioenergética', categoria: 'PICS / Corpo-mente', base: 'Prática corporal complementar', fontes: 'PNPIC/MS; BVS/BIREME; literatura de psicoterapia corporal' },
      { especialidade: 'Constelação Familiar', categoria: 'PICS / Psicossocial', base: 'Prática complementar com necessidade de consentimento e cautela ética', fontes: 'PNPIC/MS; BVS/BIREME; diretrizes de segurança em saúde mental; WHO QualityRights' },
      { especialidade: 'Dança Circular', categoria: 'PICS / Movimento comunitário', base: 'Prática corporal e comunitária complementar', fontes: 'PNPIC/MS; BVS/BIREME; promoção da saúde' },
      { especialidade: 'Geoterapia', categoria: 'PICS / Tradicional', base: 'Saber tradicional com cuidados sanitários', fontes: 'PNPIC/MS; BVS/BIREME; vigilância sanitária e segurança dermatológica' },
      { especialidade: 'Hipnoterapia', categoria: 'PICS / Mente-corpo', base: 'Prática complementar com literatura clínica', fontes: 'PNPIC/MS; BVS/BIREME; PubMed/NCBI; diretrizes de saúde mental; mhGAP Guideline 2025' },
      { especialidade: 'Homeopatia', categoria: 'PICS / Racionalidade médica', base: 'Prática reconhecida na PNPIC; uso complementar com limites clínicos', fontes: 'PNPIC/MS; BVS Homeopatia; CFM/CFM especialidade médica quando aplicável' },
      { especialidade: 'Imposição de Mãos', categoria: 'PICS / Energia', base: 'Prática complementar de relaxamento, presença terapêutica e cuidado subjetivo', fontes: 'PNPIC/MS; NCCIH; BVS/BIREME' },
      { especialidade: 'Medicina Antroposófica', categoria: 'PICS / Racionalidade médica', base: 'Prática reconhecida na PNPIC; integração responsável', fontes: 'PNPIC/MS; BVS/BIREME; diretrizes profissionais da área' },
      { especialidade: 'Meditação', categoria: 'PICS / Mente-corpo', base: 'Prática com evidências em estresse, dor e saúde mental como complemento', fontes: 'PNPIC/MS; NCCIH; Cochrane; PubMed/NCBI; WHO Mental Health Guidance 2025' },
      { especialidade: 'Musicoterapia', categoria: 'PICS / Expressiva', base: 'Prática reconhecida com padrões profissionais', fontes: 'PNPIC/MS; World Federation of Music Therapy; AMTA; BVS/BIREME; WHO Mental Health Guidance 2025' },
      { especialidade: 'Naturopatia', categoria: 'PICS / Integrativa', base: 'Prática complementar com enfoque em autocuidado e prevenção', fontes: 'PNPIC/MS; OMS/WHO Traditional Medicine Strategy; BVS/BIREME' },
      { especialidade: 'Osteopatia', categoria: 'PICS / Terapia manual', base: 'Diretrizes internacionais de formação e segurança', fontes: 'PNPIC/MS; WHO Benchmarks for Training in Osteopathy' },
      { especialidade: 'Ozonioterapia', categoria: 'PICS / Procedimento complementar', base: 'Uso depende de regulação, habilitação e segurança', fontes: 'PNPIC/MS; ANVISA; diretrizes profissionais; literatura de segurança clínica' },
      { especialidade: 'Quiropraxia', categoria: 'PICS / Terapia manual', base: 'Diretrizes internacionais de formação e triagem de risco', fontes: 'PNPIC/MS; WHO Guidelines on Basic Training and Safety in Chiropractic' },
      { especialidade: 'Reflexologia', categoria: 'PICS / Terapia manual', base: 'Prática complementar com triagem de pele, circulação e neuropatia', fontes: 'PNPIC/MS; BVS/BIREME; International Council of Reflexologists' },
      { especialidade: 'Shantala', categoria: 'PICS / Materno-infantil', base: 'Prática de toque/massagem infantil com orientação segura', fontes: 'PNPIC/MS; Caderneta da Criança/MS; BVS/BIREME' },
      { especialidade: 'Terapia Comunitária Integrativa', categoria: 'PICS / Comunitária', base: 'Prática coletiva de promoção de saúde e rede de apoio', fontes: 'PNPIC/MS; BVS/BIREME; OPAS/OMS promoção da saúde; WHO Cross-Sectoral Mental Health Guidance' },
      { especialidade: 'Termalismo Social / Crenoterapia', categoria: 'PICS / Ambiental', base: 'Uso terapêutico de águas minerais com critérios sanitários', fontes: 'PNPIC/MS; BVS/BIREME; vigilância sanitária' },

      // === ABRATH (VAI PARA SABERES) ===
      { especialidade: 'Massoterapia', categoria: 'Terapia manual', base: 'Prática manual complementar com triagem de contraindicações', fontes: 'NCCIH; AMTA clinical resources; diretrizes de segurança em terapias manuais' },
      { especialidade: 'Reiki', categoria: 'PICS / Energia', base: 'Prática complementar de relaxamento e cuidado subjetivo', fontes: 'PNPIC/MS; NCCIH; BVS/BIREME' },
      { especialidade: 'Aromaterapia', categoria: 'PICS / Produtos naturais', base: 'Uso complementar com foco em segurança', fontes: 'PNPIC/MS; ANVISA; Tisserand & Young; IFPA safety guidance' },
      { especialidade: 'Cromoterapia', categoria: 'PICS / Complementar', base: 'Prática complementar de baixo risco quando não invasiva', fontes: 'PNPIC/MS; BVS/BIREME; segurança ocular' },
      { especialidade: 'Acupuntura', categoria: 'PICS / MTC', base: 'Prática com diretrizes internacionais de formação e biossegurança', fontes: 'PNPIC/MS; WHO Benchmarks for Training in Acupuncture; diretrizes de biossegurança' },

      // ============================================
      // PROFISSÕES REGULAMENTADAS (COM CONSELHO)
      // ============================================
      // === CRM ===
      { especialidade: 'Médico (clínico geral)', categoria: 'Médica', base: 'Cuidado biomédico baseado em diretrizes, risco, diagnóstico e acompanhamento', fontes: 'Ministério da Saúde; OMS/WHO; protocolos clínicos oficiais; PCDT; PubMed/NCBI; NICE; OPAS/OMS; Cochrane; WHO Mental Health Guidance 2025' },
      { especialidade: 'Medicina Integrativa', categoria: 'Médica', base: 'Integração de cuidado baseado em evidências e preferências do paciente', fontes: 'NCCIH; Academic Consortium for Integrative Medicine; OMS/WHO; PNPIC/MS; PubMed/NCBI; Cochrane; WHO Mental Health Guidance 2025' },
      { especialidade: 'Medicina de Família', categoria: 'Médica', base: 'Atenção primária e cuidado longitudinal', fontes: 'Ministério da Saúde APS; OPAS/OMS; WONCA; PCDT/linhas de cuidado; WHO Cross-Sectoral Mental Health Guidance' },
      { especialidade: 'Pediatria', categoria: 'Médica', base: 'Diretrizes pediátricas e saúde da criança', fontes: 'Sociedade Brasileira de Pediatria; Ministério da Saúde; Caderneta da Criança; OPAS/OMS; PubMed/NCBI; NICE Pediatrics; WHO Mental Health Guidance 2025' },
      { especialidade: 'Ginecologia', categoria: 'Médica', base: 'Saúde sexual e reprodutiva, rastreamento e cuidado integral', fontes: 'FEBRASGO; Ministério da Saúde; OPAS/OMS; PCDT/linhas de cuidado; PubMed/NCBI; WHO Mental Health Guidance 2025' },
      { especialidade: 'Geriatria', categoria: 'Médica', base: 'Avaliação geriátrica ampla e envelhecimento saudável', fontes: 'SBGG; OMS ICOPE; Ministério da Saúde; Beers Criteria; PubMed/NCBI; WHO Mental Health Guidance 2025' },
      { especialidade: 'Psiquiatria', categoria: 'Médica', base: 'Avaliação e tratamento de transtornos mentais', fontes: 'Ministério da Saúde/RAPS; OPAS/OMS; NICE Mental Health; DSM-5-TR; CID-11; WHO Mental Health Guidance 2025; mhGAP Guideline 2025; WHO QualityRights; PubMed/NCBI; APA; Cochrane Mental Health' },
      { especialidade: 'Emergência', categoria: 'Médica', base: 'Triagem, suporte inicial e sinais de alarme', fontes: 'Ministério da Saúde; AHA Guidelines; Manchester Triage; MSF Medical Guidelines; mhGAP Intervention Guide 2.0; PubMed/NCBI' },

      // === CRP ===
      { especialidade: 'Psicólogo(a)', categoria: 'Psicologia', base: 'Avaliação psicológica, psicoterapia, RAPS, testes psicológicos, orientação, intervenção em crise, luto', fontes: 'CFP; Ministério da Saúde/RAPS; PubMed/NCBI; SciELO Psicologia; BVS Psicologia; APA Guidelines; APA Division of Psychotherapy; NICE Mental Health; WHO Mental Health Guidance 2025; mhGAP Guideline 2025; WHO QualityRights; WHO Mental Health Atlas 2024; Cochrane Mental Health' },
      { especialidade: 'Neuropsicologia', categoria: 'Psicologia', base: 'Avaliação neuropsicológica, reabilitação cognitiva, testes cognitivos, funções executivas', fontes: 'CFP; PubMed/NCBI; SciELO Psicologia; BVS Psicologia; APA Division 40 (Clinical Neuropsychology); NICE; WHO Mental Health Guidance 2025; mhGAP Guideline 2025' },

      // === CREFITO ===
      { especialidade: 'Fisioterapia', categoria: 'Reabilitação', base: 'Avaliação cinético-funcional, exercício terapêutico e reabilitação baseada em diretrizes', fontes: 'COFFITO; World Physiotherapy; NICE; diretrizes clínicas por condição' },
      { especialidade: 'Hidroterapia', categoria: 'Reabilitação aquática', base: 'Exercícios aquáticos supervisionados para mobilidade, dor, força e relaxamento', fontes: 'World Physiotherapy aquatic therapy resources; diretrizes de reabilitação aquática' },
      { especialidade: 'Equoterapia', categoria: 'Reabilitação assistida por animal', base: 'Prática interdisciplinar com equipe habilitada e critérios de segurança', fontes: 'ANDE-Brasil; diretrizes de terapia assistida por equinos; segurança em reabilitação' },
      { especialidade: 'Terapia Ocupacional', categoria: 'Reabilitação', base: 'Avaliação funcional, atividades de vida diária, reabilitação, orientação, adaptações', fontes: 'COFFITO; WFOT; PubMed/NCBI; diretrizes de reabilitação' },

      // === COREN ===
      { especialidade: 'Enfermeiro(a)', categoria: 'Enfermagem', base: 'Processo de enfermagem, educação em saúde, cuidado continuado, sinais vitais', fontes: 'COREN; Ministério da Saúde; OPAS/OMS; WHO Mental Health Guidance 2025' },
      { especialidade: 'Técnico de Enfermagem', categoria: 'Enfermagem', base: 'Cuidados básicos de enfermagem, sinais vitais, curativos, administração de medicamentos', fontes: 'COREN; Ministério da Saúde' },
      { especialidade: 'Enfermeiro(a) Obstetra', categoria: 'Enfermagem', base: 'Acompanhamento pré-natal, parto, puerpério, saúde da mulher', fontes: 'COREN; Ministério da Saúde; FEBRASGO; WHO Mental Health Guidance 2025' },

      // === CRN ===
      { especialidade: 'Nutricionista', categoria: 'Nutrição', base: 'Avaliação nutricional, plano alimentar, educação alimentar, antropometria, guia alimentar', fontes: 'CFN; Guia Alimentar para a População Brasileira; Ministério da Saúde; PubMed/NCBI' },
      { especialidade: 'Nutrição Funcional', categoria: 'Nutrição', base: 'Bioquímica nutricional, suplementação, avaliação, condutas, nutrição personalizada', fontes: 'CFN; PubMed/NCBI; literatura de nutrição funcional' },
      { especialidade: 'Nutrição Esportiva', categoria: 'Nutrição', base: 'Nutrição para performance, suplementação esportiva, avaliação corporal', fontes: 'CFN; PubMed/NCBI; Sociedade Brasileira de Nutrição Esportiva' },

      // === CRO ===
      { especialidade: 'Odontólogo(a)', categoria: 'Odontologia', base: 'Prevenção, restauração, saúde bucal, periodontia, endodontia, ortodontia, prótese', fontes: 'CFO; Ministério da Saúde; PubMed/NCBI' },

      // === CRF ===
      { especialidade: 'Farmacêutico(a)', categoria: 'Farmácia', base: 'Dispensação, farmacovigilância, cuidado farmacêutico, interações, aconselhamento', fontes: 'CFF; ANVISA; PubMed/NCBI' },

      // === CRBM ===
      { especialidade: 'Biomédico(a)', categoria: 'Biomedicina', base: 'Análises clínicas, diagnóstico laboratorial, coleta, interpretação, microbiologia, hematologia', fontes: 'CFBM; ANVISA; PubMed/NCBI' },

      // === CRBIO ===
      { especialidade: 'Biólogo(a)', categoria: 'Biologia', base: 'Estudos biológicos, análise ambiental, biotecnologia, educação', fontes: 'CRBIO; Ministério do Meio Ambiente; PubMed/NCBI' },

      // === CREF ===
      { especialidade: 'Educador Físico', categoria: 'Atividade Física', base: 'Avaliação física, prescrição de exercícios, treinamento, prevenção, atividade física, reabilitação', fontes: 'CONFEF; Ministério da Saúde; PubMed/NCBI; OMS/WHO atividade física' },
      { especialidade: 'Personal Trainer', categoria: 'Atividade Física', base: 'Prescrição de treinos, avaliação física, acompanhamento individualizado', fontes: 'CONFEF; Ministério da Saúde; PubMed/NCBI' },

      // ============================================
      // BIBLIOTECAS TRANSVERSAIS
      // ============================================
      { especialidade: 'Anamnese e Semiotécnica Integrativa', categoria: 'Biblioteca transversal', base: 'Roteiros de entrevista, queixa principal, história clínica, hábitos, medicamentos, objetivos do paciente, contexto social e avaliação integrativa por especialidade', fontes: 'Ministério da Saúde; OPAS/OMS; diretrizes profissionais; boas práticas de prontuário' },
      { especialidade: 'Sinais de Alarme e Encaminhamento', categoria: 'Biblioteca transversal', base: 'Bandeiras vermelhas, critérios de urgência, quando interromper prática complementar, quando acionar rede médica, SAMU ou especialista', fontes: 'Ministério da Saúde; AHA Guidelines; Manchester Triage; MSF Medical Guidelines; NICE' },
      { especialidade: 'Contraindicações e Segurança Clínica', categoria: 'Biblioteca transversal', base: 'Contraindicações por idade, gestação, lactação, fragilidade, cardiopatias, anticoagulação, imunossupressão, risco psiquiátrico e condições agudas', fontes: 'NCCIH; NICE; ANVISA; diretrizes profissionais; literatura de segurança clínica' },
      { especialidade: 'Interações e Farmacovigilância', categoria: 'Biblioteca transversal', base: 'Rastreamento de medicamentos, suplementos, plantas medicinais, óleos essenciais, reações adversas, alergias e notificações de segurança', fontes: 'ANVISA; PubMed/NCBI; Micromedex/Lexicomp quando disponível; WHO pharmacovigilance' },
      { especialidade: 'Consentimento Informado e LGPD em Saúde', categoria: 'Biblioteca transversal', base: 'Consentimento para práticas, limites terapêuticos, privacidade, dados sensíveis, pesquisa anonimizada, revogação e registro de autorização', fontes: 'LGPD; Ministério da Saúde; CFM/CFP/COFFITO/COFEN e demais conselhos; boas práticas éticas; WHO QualityRights' },
      { especialidade: 'Escalas e Desfechos Clínicos', categoria: 'Biblioteca transversal', base: 'Mensuração de dor, sono, ansiedade, funcionalidade, qualidade de vida, evolução subjetiva e resposta terapêutica por especialidade', fontes: 'NICE; PubMed/NCBI; Cochrane; diretrizes clínicas por condição' },
      { especialidade: 'Evolução, Prontuário e SOAP', categoria: 'Biblioteca transversal', base: 'Registro estruturado de evolução, plano terapêutico, metas, retorno, eventos adversos, orientações e comunicação entre profissionais', fontes: 'Ministério da Saúde; HL7 FHIR; boas práticas de prontuário; diretrizes profissionais' },
      { especialidade: 'Teleconsulta Segura', categoria: 'Biblioteca transversal', base: 'Identificação, consentimento, privacidade, limites de atendimento remoto, sinais para encaminhamento presencial e registro da sessão', fontes: 'CFM; CFP; Ministério da Saúde; LGPD; boas práticas de telessaúde' },
      { especialidade: 'Ciclos de Vida', categoria: 'Biblioteca transversal', base: 'Adaptações para crianças, adolescentes, gestantes, puérperas, adultos, idosos, pessoas frágeis e pacientes com deficiência', fontes: 'Ministério da Saúde; OPAS/OMS; SBP; FEBRASGO; SBGG; diretrizes clínicas' },
      { especialidade: 'Dor, Sono e Estresse', categoria: 'Biblioteca transversal', base: 'Condições frequentes em várias especialidades, com triagem, autocuidado, práticas integrativas, critérios de encaminhamento e acompanhamento', fontes: 'NICE; NCCIH; Cochrane; PubMed/NCBI; Ministério da Saúde; WHO Mental Health Guidance 2025' },
      { especialidade: 'Educação do Paciente e Autocuidado', categoria: 'Biblioteca transversal', base: 'Orientações compreensíveis, adesão, metas realistas, sinais de alerta, hábitos, prevenção, comunicação de riscos e corresponsabilidade', fontes: 'OPAS/OMS; Ministério da Saúde; diretrizes de promoção da saúde' },
      { especialidade: 'Protocolos Transversais por Especialidade', categoria: 'Biblioteca transversal', base: 'Modelos reutilizáveis de avaliação, tratamento, encaminhamento, segurança, evolução e revisão periódica para todas as bibliotecas do sistema', fontes: 'PNPIC/MS; OPAS/OMS; BVS/BIREME; diretrizes profissionais; literatura científica e clássica aplicável' },
      { especialidade: 'Psicoterapia', categoria: 'Psicologia', base: 'Abordagens terapêuticas: cognitivo-comportamental, psicodinâmica, humanista, sistêmica, EMDR', fontes: 'CFP; APA Division of Psychotherapy; NICE Mental Health; PubMed/NCBI; SciELO Psicologia; BVS Psicologia; WHO Mental Health Guidance 2025' },
      { especialidade: 'Avaliação Psicológica', categoria: 'Psicologia', base: 'Testes psicológicos, psicometria, entrevista, anamnese, laudos, relatórios', fontes: 'CFP; SATEPSI (Sistema de Avaliação de Testes Psicológicos); BVS Psicologia; PubMed/NCBI; SciELO Psicologia' }
    ]
  },

  // ═══════════════════════════════════════════
  // CONSELHOS PROFISSIONAIS
  // ═══════════════════════════════════════════
  CONSELHOS: {
    ABRATH:  { nome: 'Associação Brasileira de Terapeutas Holísticos', url: 'https://abrath.org.br',                    requerUF: false },
    CRM:     { nome: 'Conselho Regional de Medicina',                  url: 'https://portal.cfm.org.br/busca-medicos/', requerUF: true },
    CRP:     { nome: 'Conselho Regional de Psicologia',                url: 'https://cadastro.cfp.org.br/',             requerUF: true },
    CREFITO: { nome: 'Conselho Regional de Fisioterapia/T.O.',         url: 'https://www.coffito.gov.br',               requerUF: true },
    COREN:   { nome: 'Conselho Regional de Enfermagem',                url: 'http://servicos.cofen.gov.br',             requerUF: true },
    CRO:     { nome: 'Conselho Regional de Odontologia',               url: 'https://website.cfo.org.br',               requerUF: true },
    CRN:     { nome: 'Conselho Regional de Nutricionistas',            url: 'https://www.cfn.org.br',                   requerUF: true },
    CRF:     { nome: 'Conselho Regional de Farmácia',                  url: 'https://www.cff.org.br',                   requerUF: true },
    CRBM:    { nome: 'Conselho Regional de Biomedicina',               url: 'https://cfbm.gov.br',                      requerUF: true },
    CRBIO:   { nome: 'Conselho Regional de Biologia',                  url: 'https://www.cfbio.gov.br',                 requerUF: true },
    CREF:    { nome: 'Conselho Regional de Educação Física',           url: 'https://www.confef.org.br',                requerUF: true }
  },

  // ═══════════════════════════════════════════
  // INTEGRAÇÕES CIENTÍFICAS (ATUALIZADO)
  // ═══════════════════════════════════════════
  BIBLIOTECAS_CIENTIFICAS: {
    fiocruz:  { nome: 'Biblioteca Fiocruz (ARCA)',  url: 'https://arca.fiocruz.br',          descricao: 'Repositório institucional de pesquisas em saúde pública' },
    redepics: { nome: 'RedePICS Brasil',            url: 'https://redepicsbrasil.org.br',    descricao: 'Rede de pesquisa em Práticas Integrativas e Complementares' },
    bireme:   { nome: 'BIREME / OPAS (BVS)',        url: 'https://www.bireme.org.br',        descricao: 'Centro Latino-Americano e do Caribe de Informação em Ciências da Saúde' },
    pubmed:   { nome: 'PubMed / NCBI',              url: 'https://pubmed.ncbi.nlm.nih.gov',  descricao: 'Base internacional de literatura biomédica' },
    scielo:   { nome: 'SciELO',                     url: 'https://scielo.org',               descricao: 'Scientific Electronic Library Online' },
    // === NOVAS BIBLIOTECAS ===
    bvs_psicologia: { nome: 'BVS Psicologia', url: 'https://bvsalud.org/psi/', descricao: 'Base de dados especializada em psicologia da BVS/BIREME' },
    satepsi: { nome: 'SATEPSI', url: 'https://satepsi.cfp.org.br', descricao: 'Sistema de Avaliação de Testes Psicológicos do CFP' },
    who_mh_guidance: { nome: 'WHO Mental Health Guidance 2025', url: 'https://www.who.int/publications', descricao: 'Novo guia da OMS para políticas de saúde mental em todos os setores governamentais' },
    who_mhgap: { nome: 'mhGAP Guideline 2025', url: 'https://www.who.int/publications', descricao: 'Programa de Ação para Lacunas em Saúde Mental - 48 recomendações' },
    who_mhgap_guide: { nome: 'mhGAP Intervention Guide 2.0', url: 'https://www.who.int/publications', descricao: 'Guia prático para manejo de condições mentais, neurológicas e uso de substâncias' },
    who_mh_atlas: { nome: 'WHO Mental Health Atlas 2024', url: 'https://www.who.int/publications', descricao: 'Relatório global com dados de 144 países sobre saúde mental' },
    who_mh_action_plan: { nome: 'WHO Comprehensive Mental Health Action Plan 2013-2030', url: 'https://www.who.int/publications', descricao: 'Plano de ação atualizado para saúde mental' },
    who_qualityrights: { nome: 'WHO QualityRights', url: 'https://www.who.int/initiatives/qualityrights', descricao: 'Iniciativa de direitos humanos em saúde mental' },
    who_cross_sectoral: { nome: 'WHO Cross-Sectoral Mental Health Guidance', url: 'https://www.who.int/publications', descricao: 'Diretrizes para 10 setores governamentais (educação, emprego, justiça, etc.)' },
    apa: { nome: 'APA Guidelines', url: 'https://www.apa.org', descricao: 'Guias e diretrizes da American Psychological Association' },
    apa_psychotherapy: { nome: 'APA Division of Psychotherapy', url: 'https://www.apa.org', descricao: 'Divisão de Psicoterapia da APA' },
    apa_neuropsychology: { nome: 'APA Division 40 (Clinical Neuropsychology)', url: 'https://www.apa.org', descricao: 'Divisão de Neuropsicologia Clínica da APA' }
  },

  // ═══════════════════════════════════════════
  // TEXTOS CANÔNICOS DE JYOTISH
  // ═══════════════════════════════════════════
  JYOTISH_CANONICOS: [
    {
      titulo: 'Bṛhat Parāśara Horā Śāstra',
      autor: 'Maharishi Parāśara',
      epoca: 'Antiguidade védica (compilação posterior)',
      descricao: 'Tratado raiz do Jyotish — base do sistema Parāśari, com Dashā Vimśottarī, Yogas e cálculo de Bhāvas.',
      fontes: ['https://archive.org/details/BrihatParasharaHoraShastraEnglishTranslation', 'https://www.wisdomlib.org/hinduism/book/brihat-parashara-hora-shastra']
    },
    {
      titulo: 'Bṛhat Jātaka',
      autor: 'Varāhamihira',
      epoca: 'Séc. VI d.C.',
      descricao: 'Clássico conciso e fundacional sobre interpretação natal; referência obrigatória.',
      fontes: ['https://archive.org/details/BrihatJatakaOfVarahamihira', 'https://www.wisdomlib.org/hinduism/book/brihat-jataka']
    },
    {
      titulo: 'Sārāvalī',
      autor: 'Kalyāṇa Varma',
      epoca: 'Séc. VIII–X',
      descricao: 'Compêndio de yogas, dignidades planetárias e técnicas preditivas detalhadas.',
      fontes: ['https://archive.org/details/saravali', 'https://www.wisdomlib.org/hinduism/book/saravali']
    },
    {
      titulo: 'Phaladīpikā',
      autor: 'Mantreśvara',
      epoca: 'Séc. XIII–XIV',
      descricao: 'Manual prático de astrologia natal, abrangendo yogas e dashās com exemplos.',
      fontes: ['https://archive.org/details/phaladeepika-of-mantreswara', 'https://www.wisdomlib.org/hinduism/book/phaladeepika']
    }
  ],

  // ═══════════════════════════════════════════
  // FHIR BRASIL (HL7 Brasil / RNDS R4)
  // ═══════════════════════════════════════════
  FHIR: {
    enabled: true,
    version: 'R4',
    padraoFHIRBrasil: true,
    url_hapi: 'https://hapi.fhir.org.br/fhir',
    url_validacao: 'https://hapi.fhir.org.br/fhir/metadata',
    url_api: '/api/fhir',
    url_metadata: '/api/fhir/metadata',
    profiles: {
      Patient: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRIndividuo-1.0',
      Practitioner: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRProfissional-1.0',
      Organization: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BREstabelecimentoSaude-1.0',
      Encounter: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRAtendimentoRegistroAtendimentoClinico-1.0',
      Appointment: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRAgendamentoRegistroConsulta-1.0',
      MedicationRequest: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRMedicamentoPrescricaoMedicamento-1.0',
      Bundle: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRDocumentoBundle-1.0'
    },
    namingSystems: {
      CPF: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cpf',
      CNS: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cns',
      CNES: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cnes',
      CNPJ: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cnpj',
      CONSELHO: 'http://www.saude.gov.br/fhir/r4/NamingSystem/conselho-profissional'
    },
    endpoints: {
      exportPatient: '/api/fhir/export-patient',
      exportPractitioner: '/api/fhir/export-practitioner',
      exportOrganization: '/api/fhir/export-organization',
      exportAppointment: '/api/fhir/export-appointment',
      exportEncounter: '/api/fhir/export-encounter',
      exportMedicationRequest: '/api/fhir/export-medication-request',
      exportBundle: '/api/fhir/export-bundle',
      importPatient: '/api/fhir/import-patient'
    }
  },

  // ═══════════════════════════════════════════
  // SUPORTE
  // ═══════════════════════════════════════════
  SUPORTE: {
    segunda: '10h - 19h', terca: '10h - 19h', quarta: '13h - 17h',
    quinta: '10h - 19h',  sexta: '13h - 17h', sabado: 'Fechado',  domingo: 'Fechado'
  },

  // ═══════════════════════════════════════════
  // IDIOMAS — América Latina, BRICS e opções adicionais
  // ═══════════════════════════════════════════
  IDIOMAS: [
    'pt-BR', 'es',           // América Latina
    'zh', 'ru', 'hi', 'en',  // BRICS (China, Rússia, Índia, África do Sul/int.)
    'ar', 'fa', 'id',        // BRICS+ (Egito/Emirados, Irã, Indonésia)
    'ja', 'ko',              // Ásia Oriental (Japão, Coreia do Sul)
    'af', 'zu',              // África do Sul
    'fr'                     // Outros
  ],
  IDIOMAS_BANDEIRAS: {
    'pt-BR': '🇧🇷', es: '🇲🇽', en: '🇺🇸', zh: '🇨🇳', ru: '🇷🇺', hi: '🇮🇳',
    ar: '🇪🇬', fa: '🇮🇷', id: '🇮🇩', ja: '🇯🇵', ko: '🇰🇷',
    af: '🇿🇦', zu: '🇿🇦', fr: '🇫🇷'
  },
  IDIOMAS_ISO: {
    'pt-BR': 'br', es: 'mx', en: 'us', zh: 'cn', ru: 'ru', hi: 'in',
    ar: 'eg', fa: 'ir', id: 'id', ja: 'jp', ko: 'kr',
    af: 'za', zu: 'za', fr: 'fr'
  },
  IDIOMAS_ROTULOS: {
    'pt-BR': 'PT', es: 'ES', en: 'EN', zh: 'ZH', ru: 'RU', hi: 'HI',
    ar: 'AR', fa: 'FA', id: 'ID', ja: 'JA', ko: 'KO',
    af: 'AF', zu: 'ZU', fr: 'FR'
  },
  IDIOMAS_RTL: ['ar', 'fa'],

  // Bibliotecas tradicionais regionais vinculadas aos idiomas/países de referência
  IDIOMAS_MEDICINAS_REGIONAIS: {
    'pt-BR': ['Fitoterapia', 'PNPIC/MS'],
    es: ['Herbolaria Latino-Americana', 'BVS/BIREME'],
    zh: ['Medicina Tradicional Chinesa', 'Acupuntura'],
    ru: ['Medicina Tradicional Russa / Fitoterapia Eslava'],
    hi: ['Ayurveda', 'Siddha', 'Yoga (instrutor)'],
    en: ['Medicina Integrativa', 'NCCIH'],
    ar: ['Unani / Tibb (Medicina Tradicional Persa-Islâmica)'],
    fa: ['Unani / Tibb (Medicina Tradicional Persa-Islâmica)'],
    id: ['Jamu (Medicina Tradicional Indonésia)'],
    ja: ['Kampo (Medicina Tradicional Japonesa)'],
    ko: ['Hanbang (Medicina Tradicional Coreana)'],
    af: ['Medicina Tradicional Africana (Inyanga / Ubuntu)'],
    zu: ['Medicina Tradicional Africana (Inyanga / Ubuntu)'],
    fr: ['Phytothérapie (Medicina Tradicional Europeia)']
  }
};

// ============================================
// BOOTSTRAP DO CATÁLOGO TERAPÊUTICO
// ============================================
function sincronizarCatalogoFallback(cfg) {
  const bt = cfg.BIBLIOTECAS_TERAPEUTICAS;
  const categoriaTransversal = 'Biblioteca transversal';
  bt.total_bibliotecas = bt.matriz.length;
  bt.total_especialidades = cfg.ESPECIALIDADES.length;
  bt.bibliotecas_transversais = bt.matriz.filter((item) => item.categoria === categoriaTransversal).length;
  bt.bibliotecas_por_pratica = bt.total_bibliotecas - bt.bibliotecas_transversais;
  bt.total_itens_catalogo = bt.itens.length;
  bt.total_registros = bt.registros_base + bt.registros_blocos + bt.protocolos_criados;
  cfg.LIMITES_BIBLIOTECAS_PLANO = {
    freemium: 1,
    guardioes_floresta: 3,
    pro: 10,
    clinic: 67,
    enterprise: bt.bibliotecas_por_pratica
  };
  Object.entries(cfg.LIMITES_BIBLIOTECAS_PLANO).forEach(([plano, limite]) => {
    if (cfg.PLANOS[plano]) cfg.PLANOS[plano].especialidades_inclusas = limite;
  });
}

if (typeof CatalogoTerapeutico !== 'undefined') {
  CatalogoTerapeutico.sincronizar(CONFIG);
  CONFIG.Catalogo = CatalogoTerapeutico;
} else if (typeof require !== 'undefined') {
  try {
    const CatalogoTerapeuticoNode = require('./catalogo-terapeutico.js');
    CatalogoTerapeuticoNode.sincronizar(CONFIG);
    CONFIG.Catalogo = CatalogoTerapeuticoNode;
  } catch (error) {
    sincronizarCatalogoFallback(CONFIG);
  }
} else {
  sincronizarCatalogoFallback(CONFIG);
}

// Ajustes de planos e especialidades no modo lançamento
if (CONFIG.MODO_LANCAMENTO?.ativo) {
  Object.values(CONFIG.PLANOS).forEach((plano) => {
    plano.prescricao = false;
    plano.recomendacao = true;
    plano.fhir_tiss = false;
    if (Array.isArray(plano.recursos)) {
      plano.recursos = plano.recursos.map((r) =>
        r
          .replace(/prescrição eletrônica/gi, 'recomendações terapêuticas')
          .replace(/sem prescrição eletrônica/gi, 'recomendações terapêuticas')
          .replace(/prescrições?,? /gi, '')
          .replace(/FHIR[^,]*/gi, '')
          .replace(/TISS[^,]*/gi, '')
          .replace(/,\s*,/g, ',')
          .replace(/\s{2,}/g, ' ')
          .trim()
      ).filter(Boolean);
      if (!plano.recursos.some((r) => /recomenda/i.test(r))) {
        plano.recursos.push('Recomendações terapêuticas (receituário orientativo)');
      }
    }
  });
  CONFIG.ESPECIALIDADES = CONFIG.ESPECIALIDADES.filter((esp) => {
    if (!esp.conselho) return true;
    if (esp.conselho === 'ABRATH') return true;
    return false;
  });
}

// ============================================
// EXPORTAÇÃO — ESSENCIAL PARA O FRONTEND
// ============================================
if (typeof window !== 'undefined') window.CONFIG = CONFIG;
if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;

if (typeof window !== 'undefined' && CONFIG.Catalogo) {
  const iniciar = () => {
    if (CONFIG.Catalogo.atualizarPagina) {
      CONFIG.Catalogo.atualizarPagina(CONFIG);
    } else if (CONFIG.Catalogo.iniciarPagina) {
      CONFIG.Catalogo.iniciarPagina(CONFIG);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
}

if (typeof window !== 'undefined' && !document.getElementById('modo-lancamento-js')) {
  const ml = document.createElement('script');
  ml.id = 'modo-lancamento-js';
  ml.src = '/js/modo-lancamento.js';
  ml.defer = true;
  document.head.appendChild(ml);
}