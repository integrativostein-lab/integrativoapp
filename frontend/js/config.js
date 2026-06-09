// ============================================
// CONFIGURAÇÃO GLOBAL DO INTEGRATIVO.APP v2.1
// ============================================

const CONFIG = {
  // ═══════════════════════════════════════════
  // API
  // ═══════════════════════════════════════════
  API_URL: 'https://integra-backend-ynrd.onrender.com/api',

  // ═══════════════════════════════════════════
  // PLANOS (MODELO 100% ANUAL — 2026)
  // Pagamento à vista (PIX, 5% off) ou em até 12x com juros do parcelamento.
  // ═══════════════════════════════════════════
  PLANOS: {
    freemium: {
      nome: 'Freemium',
      valor_anual: 0,
      valor_mensal_equivalente: 0,
      descricao: 'Para começar a explorar a plataforma',
      teleconsultas_mes: 7,
      max_pacientes: 0,
      whatsapp_mensagens_mes: 10,
      blog: false,
      white_label: false,
      api_white_label: false,
      migracao: false,
      conciliacao: false,
      especialidades_inclusas: 1,
      certificado_a1_gratis: false,
      destaque: false
    },
    pro: {
      nome: 'Pro',
      valor_anual: 899,
      valor_mensal_equivalente: 74.92,
      descricao: 'Para profissionais independentes',
      teleconsultas_mes: 100,
      max_pacientes: 100,
      whatsapp_mensagens_mes: 500,
      parcelamento: 'Até 12x com juros (PIX 5% off)',
      desconto_pix: 5,
      blog: true,
      white_label: false,
      api_white_label: false,
      migracao: false,
      conciliacao: false,
      especialidades_inclusas: 5,
      certificado_a1_gratis: false,
      destaque: true
    },
    premium: {
      nome: 'Premium',
      valor_anual: 4799,
      valor_mensal_equivalente: 399.92,
      descricao: 'Para clínicas e equipes pequenas',
      teleconsultas_mes: 500,
      max_pacientes: 500,
      whatsapp_mensagens_mes: 2500,
      parcelamento: 'Até 12x com juros (PIX 5% off)',
      desconto_pix: 5,
      blog: true,
      white_label: true,
      api_white_label: false,
      migracao: true,
      conciliacao: true,
      especialidades_inclusas: 15,
      certificado_a1_gratis: true,
      destaque: false
    },
    enterprise: {
      nome: 'Enterprise',
      valor_anual: 9990,
      valor_mensal_equivalente: 832.50,
      descricao: 'Para grandes redes e instituições',
      teleconsultas_mes: 'ilimitadas',
      max_pacientes: 'ilimitados',
      whatsapp_mensagens_mes: 10000,
      parcelamento: 'Até 12x com juros (PIX 5% off)',
      desconto_pix: 5,
      blog: true,
      white_label: true,
      api_white_label: true,
      migracao: true,
      conciliacao: true,
      especialidades_inclusas: 30,
      certificado_a1_gratis: true,
      destaque: false
    },
    coworking: {
      nome: 'Coworking',
      valor_anual: 15990,
      valor_mensal_equivalente: 1332.50,
      descricao: 'Espaço compartilhado + plataforma',
      teleconsultas_mes: 'ilimitadas',
      max_pacientes: 'ilimitados',
      whatsapp_mensagens_mes: 'ilimitadas',
      parcelamento: 'Até 12x com juros (PIX 5% off)',
      desconto_pix: 5,
      blog: true,
      white_label: true,
      api_white_label: true,
      migracao: true,
      conciliacao: true,
      especialidades_inclusas: 30,
      certificado_a1_gratis: true,
      coworking_fisico: true,
      recepcao: true,
      rh: true,
      destaque: false
    }
  },

  // ═══════════════════════════════════════════
  // PARCELAMENTO (Tabela Price)
  // ═══════════════════════════════════════════
  PARCELAMENTO: {
    max_parcelas: 12,
    juros_mes: 0.0199, // 1,99% ao mês
    desconto_pix_pct: 5,
    /**
     * Tabela Price (juros compostos sobre saldo).
     * @param {number} valor Valor à vista
     * @param {number} n     Número de parcelas (1..12)
     */
    calcular(valor, n) {
      const parcelas = Math.max(1, Math.min(this.max_parcelas, parseInt(n, 10) || 1));
      if (parcelas === 1) {
        return { valorParcela: valor, valorTotal: valor, juros: 0, parcelas: 1 };
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
    reembolso_integral_dentro_prazo: true,
    multa_apos_prazo_pct: 20,
    mensagem: 'Cancelamento em até 15 dias com reembolso integral. Após esse prazo, multa de 20% sobre o saldo proporcional.'
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
    { id: 'fitoterapia',     nome: 'Fitoterapia',                     conselho: null,     categoria: 'Integrativa' },
    { id: 'ayurveda',        nome: 'Ayurveda',                        conselho: null,     categoria: 'Tradicional' },
    { id: 'mtc',             nome: 'Medicina Tradicional Chinesa',    conselho: null,     categoria: 'Tradicional' },
    { id: 'yoga',            nome: 'Yoga (instrutor)',                conselho: null,     categoria: 'Movimento' },
    { id: 'jyotish',         nome: 'Jyotish (Astrologia Védica)',     conselho: null,     categoria: 'Tradicional' },
    { id: 'vastu',           nome: 'Vastu Shastra',                   conselho: null,     categoria: 'Tradicional' },
    { id: 'xamanismo',       nome: 'Xamanismo',                       conselho: null,     categoria: 'Espiritual' },
    { id: 'florais-bach',    nome: 'Florais de Bach',                 conselho: null,     categoria: 'Florais' },
    { id: 'apiterapia',      nome: 'Apiterapia',                      conselho: null,     categoria: 'Produtos Naturais' },

    { id: 'massoterapia',    nome: 'Massoterapia',                    conselho: 'ABRATH', categoria: 'Terapia Manual' },
    { id: 'reflexologia',    nome: 'Reflexologia',                    conselho: 'ABRATH', categoria: 'Terapia Manual' },
    { id: 'reiki',           nome: 'Reiki',                           conselho: 'ABRATH', categoria: 'Energia' },
    { id: 'aromaterapia',    nome: 'Aromaterapia',                    conselho: 'ABRATH', categoria: 'Óleos Essenciais' },
    { id: 'cromoterapia',    nome: 'Cromoterapia',                    conselho: 'ABRATH', categoria: 'Energia' },
    { id: 'musicoterapia',   nome: 'Musicoterapia',                   conselho: 'ABRATH', categoria: 'Terapia' },
    { id: 'quiropraxia',     nome: 'Quiropraxia',                     conselho: 'ABRATH', categoria: 'Terapia Manual' },
    { id: 'osteopatia',      nome: 'Osteopatia',                      conselho: 'ABRATH', categoria: 'Terapia Manual' },
    { id: 'acupuntura',      nome: 'Acupuntura',                      conselho: 'ABRATH', categoria: 'MTC' },

    { id: 'medico',                nome: 'Médico (clínico geral)',          conselho: 'CRM', categoria: 'Médica' },
    { id: 'medicina-integrativa',  nome: 'Medicina Integrativa',            conselho: 'CRM', categoria: 'Médica' },
    { id: 'medicina-de-familia',   nome: 'Medicina de Família',             conselho: 'CRM', categoria: 'Médica' },
    { id: 'pediatria',             nome: 'Pediatria',                       conselho: 'CRM', categoria: 'Médica' },
    { id: 'ginecologia',           nome: 'Ginecologia',                     conselho: 'CRM', categoria: 'Médica' },
    { id: 'geriatria',             nome: 'Geriatria',                       conselho: 'CRM', categoria: 'Médica' },
    { id: 'psiquiatria',           nome: 'Psiquiatria',                     conselho: 'CRM', categoria: 'Médica' },
    { id: 'emergencia',            nome: 'Emergência',                      conselho: 'CRM', categoria: 'Médica' },

    { id: 'psicologo',         nome: 'Psicólogo(a)',                  conselho: 'CRP',     categoria: 'Psicologia' },
    { id: 'neuropsicologia',   nome: 'Neuropsicologia',               conselho: 'CRP',     categoria: 'Psicologia' },

    { id: 'fisioterapia',        nome: 'Fisioterapia',                conselho: 'CREFITO', categoria: 'Reabilitação' },
    { id: 'hidroterapia',        nome: 'Hidroterapia',                conselho: 'CREFITO', categoria: 'Reabilitação' },
    { id: 'equoterapia',         nome: 'Equoterapia',                 conselho: 'CREFITO', categoria: 'Reabilitação' },
    { id: 'terapia-ocupacional', nome: 'Terapia Ocupacional',         conselho: 'CREFITO', categoria: 'Reabilitação' },

    { id: 'enfermeiro',         nome: 'Enfermeiro(a)',                conselho: 'COREN',   categoria: 'Enfermagem' },
    { id: 'tecnico-enfermagem', nome: 'Técnico de Enfermagem',        conselho: 'COREN',   categoria: 'Enfermagem' },
    { id: 'obstetrica',         nome: 'Enfermeiro(a) Obstetra',       conselho: 'COREN',   categoria: 'Enfermagem' },

    { id: 'nutricionista',       nome: 'Nutricionista',               conselho: 'CRN',     categoria: 'Nutrição' },
    { id: 'nutricao-funcional',  nome: 'Nutrição Funcional',          conselho: 'CRN',     categoria: 'Nutrição' },
    { id: 'nutricao-esportiva',  nome: 'Nutrição Esportiva',          conselho: 'CRN',     categoria: 'Nutrição' },

    { id: 'odontologo',     nome: 'Odontólogo(a)',                    conselho: 'CRO',     categoria: 'Odontologia' },
    { id: 'farmaceutico',   nome: 'Farmacêutico(a)',                  conselho: 'CRF',     categoria: 'Farmácia' },
    { id: 'biomedico',      nome: 'Biomédico(a)',                     conselho: 'CRBM',    categoria: 'Biomedicina' },
    { id: 'biologo',        nome: 'Biólogo(a)',                       conselho: 'CRBIO',   categoria: 'Biologia' },
    { id: 'educador-fisico',  nome: 'Educador Físico',                conselho: 'CREF',    categoria: 'Atividade Física' },
    { id: 'personal-trainer', nome: 'Personal Trainer',               conselho: 'CREF',    categoria: 'Atividade Física' }
  ],

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
  // INTEGRAÇÕES CIENTÍFICAS
  // ═══════════════════════════════════════════
  BIBLIOTECAS_CIENTIFICAS: {
    fiocruz:  { nome: 'Biblioteca Fiocruz (ARCA)',  url: 'https://arca.fiocruz.br',          descricao: 'Repositório institucional de pesquisas em saúde pública' },
    redepics: { nome: 'RedePICS Brasil',            url: 'https://redepicsbrasil.org.br',    descricao: 'Rede de pesquisa em Práticas Integrativas e Complementares' },
    bireme:   { nome: 'BIREME / OPAS (BVS)',        url: 'https://www.bireme.org.br',        descricao: 'Centro Latino-Americano e do Caribe de Informação em Ciências da Saúde' },
    pubmed:   { nome: 'PubMed / NCBI',              url: 'https://pubmed.ncbi.nlm.nih.gov',  descricao: 'Base internacional de literatura biomédica' },
    scielo:   { nome: 'SciELO',                     url: 'https://scielo.org',               descricao: 'Scientific Electronic Library Online' }
  },

  // ═══════════════════════════════════════════
  // TEXTOS CANÔNICOS DE JYOTISH (Astrologia Védica Clássica)
  // Traduções e edições em domínio público / repositórios abertos
  // ═══════════════════════════════════════════
  JYOTISH_CANONICOS: [
    {
      titulo: 'Bṛhat Parāśara Horā Śāstra',
      autor: 'Maharishi Parāśara',
      epoca: 'Antiguidade védica (compilação posterior)',
      descricao: 'Tratado raiz do Jyotish — base do sistema Parāśari, com Dashā Vimśottarī, Yogas e cálculo de Bhāvas.',
      fontes: [
        'https://archive.org/details/BrihatParasharaHoraShastraEnglishTranslation',
        'https://www.wisdomlib.org/hinduism/book/brihat-parashara-hora-shastra'
      ]
    },
    {
      titulo: 'Bṛhat Jātaka',
      autor: 'Varāhamihira',
      epoca: 'Séc. VI d.C.',
      descricao: 'Clássico conciso e fundacional sobre interpretação natal; referência obrigatória.',
      fontes: [
        'https://archive.org/details/BrihatJatakaOfVarahamihira',
        'https://www.wisdomlib.org/hinduism/book/brihat-jataka'
      ]
    },
    {
      titulo: 'Sārāvalī',
      autor: 'Kalyāṇa Varma',
      epoca: 'Séc. VIII–X',
      descricao: 'Compêndio de yogas, dignidades planetárias e técnicas preditivas detalhadas.',
      fontes: [
        'https://archive.org/details/saravali',
        'https://www.wisdomlib.org/hinduism/book/saravali'
      ]
    },
    {
      titulo: 'Phaladīpikā',
      autor: 'Mantreśvara',
      epoca: 'Séc. XIII–XIV',
      descricao: 'Manual prático de astrologia natal, abrangendo yogas e dashās com exemplos.',
      fontes: [
        'https://archive.org/details/phaladeepika-of-mantreswara',
        'https://www.wisdomlib.org/hinduism/book/phaladeepika'
      ]
    },
    {
      titulo: 'Jātaka Pārijāta',
      autor: 'Vaidyanātha Dīkṣita',
      epoca: 'Séc. XV–XVI',
      descricao: 'Obra enciclopédica sobre astrologia natal, frequentemente usada em estudos avançados.',
      fontes: [
        'https://archive.org/details/JatakaParijata',
        'https://www.wisdomlib.org/hinduism/book/jataka-parijata'
      ]
    },
    {
      titulo: 'Uttara Kālāmṛta',
      autor: 'Atribuído a Kālidāsa',
      epoca: 'Tradicional',
      descricao: 'Tratado clássico sobre yogas, casas, kārakas e técnicas de interpretação.',
      fontes: [
        'https://archive.org/details/UttaraKalamritaOfKalidasa',
        'https://www.wisdomlib.org/hinduism/book/uttara-kalamrita'
      ]
    },
    {
      titulo: 'Horā Sāra',
      autor: 'Pṛthuyaśas (filho de Varāhamihira)',
      epoca: 'Séc. VI–VII',
      descricao: 'Continuação direta do Bṛhat Jātaka, expandindo regras práticas.',
      fontes: [
        'https://archive.org/details/HoraSara',
        'https://www.wisdomlib.org/hinduism/book/hora-sara'
      ]
    },
    {
      titulo: 'Jaimini Sūtras',
      autor: 'Maharishi Jaimini',
      epoca: 'Antiguidade védica',
      descricao: 'Sistema alternativo (Jaimini), com Chara Kārakas, Argalas e Rāśi Dashās.',
      fontes: [
        'https://archive.org/details/JaiminiSutrasInEnglish',
        'https://www.wisdomlib.org/hinduism/book/jaimini-sutras'
      ]
    },
    {
      titulo: 'Garga Saṃhitā / Garga Horā',
      autor: 'Maharishi Garga',
      epoca: 'Tradicional',
      descricao: 'Coletânea de aforismos preditivos clássicos atribuída a Garga.',
      fontes: ['https://www.wisdomlib.org/hinduism/book/garga-samhita']
    }
  ],

  // ═══════════════════════════════════════════
  // FHIR BRASIL
  // ═══════════════════════════════════════════
  FHIR: {
    enabled: true,
    version: 'R4',
    padraoFHIRBrasil: true,
    url_hapi: 'https://hapi.fhir.org.br/fhir',
    url_validacao: 'https://hapi.fhir.org.br/fhir/metadata'
  },

  // ═══════════════════════════════════════════
  // SUPORTE
  // ═══════════════════════════════════════════
  SUPORTE: {
    segunda: '10h - 19h', terca: '10h - 19h', quarta: '13h - 17h',
    quinta: '10h - 19h',  sexta: '13h - 17h', sabado: 'Fechado',  domingo: 'Fechado'
  },

  // ═══════════════════════════════════════════
  // IDIOMAS
  // ═══════════════════════════════════════════
  IDIOMAS: ['pt-BR', 'en', 'es', 'fr', 'ru', 'hi', 'zh', 'af', 'zu'],
  IDIOMAS_BANDEIRAS: {
    'pt-BR': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'ru': '🇷🇺',
    'hi': '🇮🇳', 'zh': '🇨🇳', 'af': '🇿🇦', 'zu': '🇿🇦'
  }
};

if (typeof window !== 'undefined') window.CONFIG = CONFIG;
if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
