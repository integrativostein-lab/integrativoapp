// ============================================
// CONFIGURAÇÃO GLOBAL DO INTEGRATIVO.APP v2.1
// ============================================

const HOSTNAME_ATUAL = typeof window !== 'undefined' ? window.location.hostname : '';

function resolverApiUrl() {
  if (typeof window !== 'undefined' && window.INTEGRATIVO_API_URL) {
    return window.INTEGRATIVO_API_URL;
  }
  if (['localhost', '127.0.0.1'].includes(HOSTNAME_ATUAL)) {
    return 'http://localhost:3001/api';
  }
  if (HOSTNAME_ATUAL.includes('alfa') || HOSTNAME_ATUAL.includes('alpha')) {
    // Temporario: enquanto o backend alfa `integrativoappespelho` nao responder 200,
    // o frontend alfa usa o backend existente. Trocar para o endpoint alfa
    // `https://integrativoappespelho.onrender.com/api` quando estiver online.
    return 'https://integra-backend-ynrd.onrender.com/api';
  }
  return 'https://integra-backend-ynrd.onrender.com/api';
}

const CONFIG = {
  // ═══════════════════════════════════════════
  // API
  // ═══════════════════════════════════════════
  API_URL: resolverApiUrl(),

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
      teleconsultas_mes: 20,
      max_pacientes: 30,
      whatsapp_mensagens_mes: 25,
      comissao_consulta_pct: 6.5,
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
      max_pacientes: 150,
      whatsapp_mensagens_mes: 500,
      comissao_consulta_pct: 3.5,
      parcelamento: 'Até 12x com juros (PIX 5% off)',
      desconto_pix: 5,
      desconto_abrath: true,
      blog: true,
      white_label: false,
      api_white_label: false,
      migracao: false,
      conciliacao: false,
      especialidades_inclusas: 10,
      ferramentas_gestao: true,
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
      comissao_consulta_pct: 3.5,
      parcelamento: 'Até 12x com juros (PIX 5% off)',
      desconto_pix: 5,
      desconto_abrath: true,
      blog: true,
      white_label: true,
      api_white_label: false,
      migracao: true,
      conciliacao: true,
      especialidades_inclusas: 20,
      max_profissionais: 10,
      cobranca_por_profissional: false,
      texto_profissionais: 'Até 10 profissionais no mesmo valor, sem cobrança extra por profissional',
      ferramentas_gestao: true,
      certificado_a1_gratis: true,
      destaque: false
    },
    guardioes_floresta: {
      nome: 'Guardiões da Floresta',
      valor_anual: 200,
      valor_mensal_equivalente: 16.67,
      descricao: 'Plano social para Guardiões da Floresta',
      teleconsultas_mes: 30,
      max_pacientes: 50,
      whatsapp_mensagens_mes: 150,
      comissao_consulta_pct: 3.5,
      parcelamento: 'Condição social anual',
      desconto_pix: 0,
      blog: true,
      white_label: false,
      api_white_label: false,
      migracao: false,
      conciliacao: false,
      especialidades_inclusas: 5,
      certificado_a1_gratis: false,
      plano_social: true,
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
      comissao_consulta_pct: 3.5,
      parcelamento: 'Até 12x com juros (PIX 5% off)',
      desconto_pix: 5,
      blog: true,
      white_label: true,
      api_white_label: true,
      migracao: true,
      conciliacao: true,
      especialidades_inclusas: 63,
      max_profissionais: 'ilimitados',
      cobranca_por_profissional: false,
      texto_profissionais: 'Profissionais ilimitados dentro do guarda-chuva institucional, sem cobrança por profissional',
      ferramentas_gestao: true,
      certificado_a1_gratis: true,
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
    desconto_abrath_pct: 8,
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
    mensagem: 'Cancelamento em até 15 dias. Certificado A1 incluído/emitido será cobrado. Após esse prazo, multa proporcional de 20% sobre os meses restantes.'
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
    { id: 'terapia-florais', nome: 'Terapia de Florais',              conselho: null,     categoria: 'PICS' },
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
  // BIBLIOTECAS TERAPÊUTICAS — PROTOCOLOS
  // ═══════════════════════════════════════════
  BIBLIOTECAS_TERAPEUTICAS: {
    total_bibliotecas: 63,
    total_especialidades: 47,
    total_registros: 1101,
    registros_base: 781,
    protocolos_criados: 320,
    fontes: ['OMS/WHO', 'PNPIC/MS', 'Ministério da Saúde', 'Fiocruz/ARCA', 'BIREME/OPAS/BVS', 'RedePICS Brasil', 'Cochrane', 'ANVISA', 'NICE', 'AYUSH', 'NCCIH', 'MSF Medical Guidelines', 'SciELO', 'PubMed/NCBI', 'Diretrizes profissionais', 'Textos clássicos: Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya, Bhavaprakasha Nighantu, Dhanvantari Nighantu, Kaiyadeva Nighantu, Bṛhat Parāśara Horā Śāstra, Bṛhat Jātaka, Saravali, Phaladeepika, Vastu Shastra, Mayamata e Manasara', 'Dr. Vasant Lad'],
    tipos: ['fontes confiáveis', 'protocolos de avaliação', 'tratamentos/intervenções', 'encaminhamentos', 'segurança clínica'],
    itens: [
      'Fitoterapia', 'Ayurveda', 'MTC', 'Yoga', 'Massoterapia', 'Aromaterapia',
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
      'Medicina de Família', 'Emergência',
      'Anamnese e Semiotécnica Integrativa', 'Sinais de Alarme e Encaminhamento',
      'Contraindicações e Segurança Clínica', 'Interações e Farmacovigilância',
      'Consentimento Informado e LGPD em Saúde', 'Escalas e Desfechos Clínicos',
      'Evolução, Prontuário e SOAP', 'Teleconsulta Segura', 'Ciclos de Vida',
      'Dor, Sono e Estresse', 'Educação do Paciente e Autocuidado',
      'Protocolos Transversais por Especialidade'
    ],
    matriz: [
      { especialidade: 'Fitoterapia', categoria: 'PICS / Integrativa', base: 'Oficial e científica', fontes: 'PNPIC/MS; RENISUS/MS; ANVISA; OMS/WHO Monographs; Fiocruz/ARCA' },
      { especialidade: 'Ayurveda', categoria: 'PICS / Saber tradicional', base: 'Tradicional com diretrizes internacionais', fontes: 'PNPIC/MS; WHO Benchmarks for Training in Ayurveda; Ministry of AYUSH; Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya' },
      { especialidade: 'Aushadha Dravya', categoria: 'Biblioteca clássica ayurvédica', base: 'Matéria médica ayurvédica: substâncias, ervas, formulações, rasa, guna, virya, vipaka, prabhava, segurança e uso tradicional', fontes: 'Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Bhavaprakasha Nighantu; Dhanvantari Nighantu; Kaiyadeva Nighantu; Ministry of AYUSH' },
      { especialidade: 'Ahara', categoria: 'Biblioteca clássica ayurvédica', base: 'Dietética ayurvédica: alimentação, compatibilidade alimentar, rotina, agni, ama, pathya-apathya e orientação alimentar individualizada', fontes: 'Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Kashyapa Samhita; Bhavaprakasha Nighantu; Ministry of AYUSH' },
      { especialidade: 'Dinacharya', categoria: 'Biblioteca clássica ayurvédica', base: 'Rotina diária ayurvédica: sono, higiene, oleação, movimento, respiração, alimentação, horários, autocuidado e adaptação ao biotipo/estação', fontes: 'Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Ministry of AYUSH; WHO Benchmarks for Training in Ayurveda' },
      { especialidade: 'Ayurveda Clássico: diagnóstico, tratamentos e protocolos', categoria: 'Biblioteca clássica ayurvédica', base: 'Avaliação e cuidado ayurvédico complementar: darshana, sparshana, prashna, prakriti, vikriti, agni, ama, dosha, dhatu, mala, nadi, jihva, nidana, chikitsa, shamana, shodhana, rasayana, dinacharya, ritucharya, ahara, aushadha, encaminhamentos e segurança clínica sem substituir diagnóstico médico', fontes: 'Charaka Samhita; Sushruta Samhita; Ashtanga Hridaya; Madhava Nidana; Bhavaprakasha Nighantu; Dr. Vasant Lad; Ministry of AYUSH; WHO Benchmarks for Training in Ayurveda' },
      { especialidade: 'MTC', categoria: 'PICS / Saber tradicional', base: 'Tradicional com diretrizes de formação e integração segura', fontes: 'PNPIC/MS; WHO Benchmarks for Training in Traditional Chinese Medicine; OMS/WHO TCIM' },
      { especialidade: 'Yoga', categoria: 'PICS / Movimento', base: 'Prática mente-corpo com revisões e diretrizes de segurança', fontes: 'PNPIC/MS; OMS/WHO atividade física; Cochrane; NCCIH' },
      { especialidade: 'Massoterapia', categoria: 'Terapia manual', base: 'Prática manual complementar com triagem de contraindicações', fontes: 'NCCIH; AMTA clinical resources; diretrizes de segurança em terapias manuais' },
      { especialidade: 'Apiterapia', categoria: 'PICS / Produtos naturais', base: 'Uso complementar com cautela alergênica', fontes: 'PNPIC/MS; ANVISA; literatura de alergia/anafilaxia; Apimondia' },
      { especialidade: 'Aromaterapia', categoria: 'PICS / Produtos naturais', base: 'Uso complementar com foco em segurança', fontes: 'PNPIC/MS; ANVISA; Tisserand & Young; IFPA safety guidance' },
      { especialidade: 'Fisioterapia', categoria: 'Reabilitação', base: 'Avaliação cinético-funcional, exercício terapêutico e reabilitação baseada em diretrizes', fontes: 'COFFITO; World Physiotherapy; NICE; diretrizes clínicas por condição' },
      { especialidade: 'Xamanismo', categoria: 'Saber ancestral', base: 'Prática cultural e simbólica com consentimento, segurança cultural e redução de danos', fontes: 'OMS/WHO Traditional Medicine Strategy; PNPIC/MS; literatura de segurança cultural' },
      { especialidade: 'Florais de Bach', categoria: 'Florais', base: 'Biblioteca específica de florais para apoio emocional complementar', fontes: 'Bach Centre; PNPIC/MS; BVS/BIREME' },
      { especialidade: 'Reiki', categoria: 'PICS / Energia', base: 'Prática complementar de relaxamento e cuidado subjetivo', fontes: 'PNPIC/MS; NCCIH; BVS/BIREME' },
      { especialidade: 'Arteterapia', categoria: 'PICS / Expressiva', base: 'Prática expressiva complementar', fontes: 'PNPIC/MS; BVS/BIREME; literatura de saúde mental e reabilitação psicossocial' },
      { especialidade: 'Biodança', categoria: 'PICS / Movimento', base: 'Prática corporal complementar', fontes: 'PNPIC/MS; BVS/BIREME; RedePICS Brasil' },
      { especialidade: 'Bioenergética', categoria: 'PICS / Corpo-mente', base: 'Prática corporal complementar', fontes: 'PNPIC/MS; BVS/BIREME; literatura de psicoterapia corporal' },
      { especialidade: 'Constelação Familiar', categoria: 'PICS / Psicossocial', base: 'Prática complementar com necessidade de consentimento e cautela ética', fontes: 'PNPIC/MS; BVS/BIREME; diretrizes de segurança em saúde mental' },
      { especialidade: 'Cromoterapia', categoria: 'PICS / Complementar', base: 'Prática complementar de baixo risco quando não invasiva', fontes: 'PNPIC/MS; BVS/BIREME; segurança ocular' },
      { especialidade: 'Dança Circular', categoria: 'PICS / Movimento comunitário', base: 'Prática corporal e comunitária complementar', fontes: 'PNPIC/MS; BVS/BIREME; promoção da saúde' },
      { especialidade: 'Geoterapia', categoria: 'PICS / Tradicional', base: 'Saber tradicional com cuidados sanitários', fontes: 'PNPIC/MS; BVS/BIREME; vigilância sanitária e segurança dermatológica' },
      { especialidade: 'Hipnoterapia', categoria: 'PICS / Mente-corpo', base: 'Prática complementar com literatura clínica', fontes: 'PNPIC/MS; BVS/BIREME; PubMed/NCBI; diretrizes de saúde mental' },
      { especialidade: 'Homeopatia', categoria: 'PICS / Racionalidade médica', base: 'Prática reconhecida na PNPIC; uso complementar com limites clínicos', fontes: 'PNPIC/MS; BVS Homeopatia; CFM/CFM especialidade médica quando aplicável' },
      { especialidade: 'Imposição de Mãos', categoria: 'PICS / Energia', base: 'Prática complementar de relaxamento, presença terapêutica e cuidado subjetivo', fontes: 'PNPIC/MS; NCCIH; BVS/BIREME' },
      { especialidade: 'Medicina Antroposófica', categoria: 'PICS / Racionalidade médica', base: 'Prática reconhecida na PNPIC; integração responsável', fontes: 'PNPIC/MS; BVS/BIREME; diretrizes profissionais da área' },
      { especialidade: 'Meditação', categoria: 'PICS / Mente-corpo', base: 'Prática com evidências em estresse, dor e saúde mental como complemento', fontes: 'PNPIC/MS; NCCIH; Cochrane; PubMed/NCBI' },
      { especialidade: 'Musicoterapia', categoria: 'PICS / Expressiva', base: 'Prática reconhecida com padrões profissionais', fontes: 'PNPIC/MS; World Federation of Music Therapy; AMTA; BVS/BIREME' },
      { especialidade: 'Naturopatia', categoria: 'PICS / Integrativa', base: 'Prática complementar com enfoque em autocuidado e prevenção', fontes: 'PNPIC/MS; OMS/WHO Traditional Medicine Strategy; BVS/BIREME' },
      { especialidade: 'Osteopatia', categoria: 'PICS / Terapia manual', base: 'Diretrizes internacionais de formação e segurança', fontes: 'PNPIC/MS; WHO Benchmarks for Training in Osteopathy' },
      { especialidade: 'Ozonioterapia', categoria: 'PICS / Procedimento complementar', base: 'Uso depende de regulação, habilitação e segurança', fontes: 'PNPIC/MS; ANVISA; diretrizes profissionais; literatura de segurança clínica' },
      { especialidade: 'Quiropraxia', categoria: 'PICS / Terapia manual', base: 'Diretrizes internacionais de formação e triagem de risco', fontes: 'PNPIC/MS; WHO Guidelines on Basic Training and Safety in Chiropractic' },
      { especialidade: 'Reflexologia', categoria: 'PICS / Terapia manual', base: 'Prática complementar com triagem de pele, circulação e neuropatia', fontes: 'PNPIC/MS; BVS/BIREME; International Council of Reflexologists' },
      { especialidade: 'Jyotish', categoria: 'Saber tradicional', base: 'Leitura simbólica e cultural para reflexão, sem uso diagnóstico ou determinista', fontes: 'Bṛhat Parāśara Horā Śāstra; Bṛhat Jātaka; Saravali; Phaladeepika; princípios éticos de aconselhamento; segurança em saúde mental' },
      { especialidade: 'Vastu Shastra', categoria: 'Saber tradicional', base: 'Organização ambiental não invasiva com foco em bem-estar e segurança do espaço', fontes: 'Vastu Shastra; Mayamata; Manasara; WHO healthy housing principles; ergonomia ambiental' },
      { especialidade: 'Equoterapia', categoria: 'Reabilitação assistida por animal', base: 'Prática interdisciplinar com equipe habilitada e critérios de segurança', fontes: 'ANDE-Brasil; diretrizes de terapia assistida por equinos; segurança em reabilitação' },
      { especialidade: 'Shantala', categoria: 'PICS / Materno-infantil', base: 'Prática de toque/massagem infantil com orientação segura', fontes: 'PNPIC/MS; Caderneta da Criança/MS; BVS/BIREME' },
      { especialidade: 'Terapia Comunitária Integrativa', categoria: 'PICS / Comunitária', base: 'Prática coletiva de promoção de saúde e rede de apoio', fontes: 'PNPIC/MS; BVS/BIREME; OPAS/OMS promoção da saúde' },
      { especialidade: 'Terapia de Florais', categoria: 'PICS / Complementar', base: 'Prática complementar emocional; não substitui cuidado de saúde mental', fontes: 'PNPIC/MS; Bach Centre; BVS/BIREME' },
      { especialidade: 'Termalismo Social / Crenoterapia', categoria: 'PICS / Ambiental', base: 'Uso terapêutico de águas minerais com critérios sanitários', fontes: 'PNPIC/MS; BVS/BIREME; vigilância sanitária' },
      { especialidade: 'Hidroterapia', categoria: 'Reabilitação aquática', base: 'Exercícios aquáticos supervisionados para mobilidade, dor, força e relaxamento', fontes: 'World Physiotherapy aquatic therapy resources; diretrizes de reabilitação aquática' },
      { especialidade: 'Acupuntura', categoria: 'PICS / MTC', base: 'Prática com diretrizes internacionais de formação e biossegurança', fontes: 'PNPIC/MS; WHO Benchmarks for Training in Acupuncture; diretrizes de biossegurança' },
      { especialidade: 'Medicina Tradicional', categoria: 'Clínica médica', base: 'Cuidado biomédico baseado em diretrizes, risco, diagnóstico e acompanhamento', fontes: 'Ministério da Saúde; OMS/WHO; protocolos clínicos oficiais; PCDT' },
      { especialidade: 'Farmacologia', categoria: 'Farmácia / segurança medicamentosa', base: 'Uso racional de medicamentos, interações, farmacovigilância e segurança', fontes: 'ANVISA; bulas profissionais; Micromedex/Lexicomp quando disponível; protocolos oficiais' },
      { especialidade: 'Medicina Integrativa', categoria: 'Clínica integrativa', base: 'Integração de cuidado baseado em evidências e preferências do paciente', fontes: 'NCCIH; Academic Consortium for Integrative Medicine; OMS/WHO; PNPIC/MS' },
      { especialidade: 'Medicina de Família', categoria: 'Clínica médica', base: 'Atenção primária e cuidado longitudinal', fontes: 'Ministério da Saúde APS; OPAS/OMS; WONCA; PCDT/linhas de cuidado' },
      { especialidade: 'Pediatria', categoria: 'Clínica médica', base: 'Diretrizes pediátricas e saúde da criança', fontes: 'Sociedade Brasileira de Pediatria; Ministério da Saúde; Caderneta da Criança; OPAS/OMS' },
      { especialidade: 'Ginecologia', categoria: 'Clínica médica', base: 'Saúde sexual e reprodutiva, rastreamento e cuidado integral', fontes: 'FEBRASGO; Ministério da Saúde; OPAS/OMS; PCDT/linhas de cuidado' },
      { especialidade: 'Geriatria', categoria: 'Clínica médica', base: 'Avaliação geriátrica ampla e envelhecimento saudável', fontes: 'SBGG; OMS ICOPE; Ministério da Saúde; Beers Criteria' },
      { especialidade: 'Saúde Mental', categoria: 'Clínica / Psicossocial', base: 'Rede de atenção psicossocial e diretrizes clínicas', fontes: 'Ministério da Saúde/RAPS; OPAS/OMS; NICE; DSM-5-TR; CID-11' },
      { especialidade: 'Emergência', categoria: 'Urgência e emergência', base: 'Triagem, suporte inicial e sinais de alarme', fontes: 'Ministério da Saúde; AHA Guidelines; Manchester Triage; MSF Medical Guidelines' },
      { especialidade: 'Anamnese e Semiotécnica Integrativa', categoria: 'Biblioteca transversal', base: 'Roteiros de entrevista, queixa principal, história clínica, hábitos, medicamentos, objetivos do paciente, contexto social e avaliação integrativa por especialidade', fontes: 'Ministério da Saúde; OPAS/OMS; diretrizes profissionais; boas práticas de prontuário' },
      { especialidade: 'Sinais de Alarme e Encaminhamento', categoria: 'Biblioteca transversal', base: 'Bandeiras vermelhas, critérios de urgência, quando interromper prática complementar, quando acionar rede médica, SAMU ou especialista', fontes: 'Ministério da Saúde; AHA Guidelines; Manchester Triage; MSF Medical Guidelines; NICE' },
      { especialidade: 'Contraindicações e Segurança Clínica', categoria: 'Biblioteca transversal', base: 'Contraindicações por idade, gestação, lactação, fragilidade, cardiopatias, anticoagulação, imunossupressão, risco psiquiátrico e condições agudas', fontes: 'NCCIH; NICE; ANVISA; diretrizes profissionais; literatura de segurança clínica' },
      { especialidade: 'Interações e Farmacovigilância', categoria: 'Biblioteca transversal', base: 'Rastreamento de medicamentos, suplementos, plantas medicinais, óleos essenciais, reações adversas, alergias e notificações de segurança', fontes: 'ANVISA; PubMed/NCBI; Micromedex/Lexicomp quando disponível; WHO pharmacovigilance' },
      { especialidade: 'Consentimento Informado e LGPD em Saúde', categoria: 'Biblioteca transversal', base: 'Consentimento para práticas, limites terapêuticos, privacidade, dados sensíveis, pesquisa anonimizada, revogação e registro de autorização', fontes: 'LGPD; Ministério da Saúde; CFM/CFP/COFFITO/COFEN e demais conselhos; boas práticas éticas' },
      { especialidade: 'Escalas e Desfechos Clínicos', categoria: 'Biblioteca transversal', base: 'Mensuração de dor, sono, ansiedade, funcionalidade, qualidade de vida, evolução subjetiva e resposta terapêutica por especialidade', fontes: 'NICE; PubMed/NCBI; Cochrane; diretrizes clínicas por condição' },
      { especialidade: 'Evolução, Prontuário e SOAP', categoria: 'Biblioteca transversal', base: 'Registro estruturado de evolução, plano terapêutico, metas, retorno, eventos adversos, orientações e comunicação entre profissionais', fontes: 'Ministério da Saúde; HL7 FHIR; boas práticas de prontuário; diretrizes profissionais' },
      { especialidade: 'Teleconsulta Segura', categoria: 'Biblioteca transversal', base: 'Identificação, consentimento, privacidade, limites de atendimento remoto, sinais para encaminhamento presencial e registro da sessão', fontes: 'CFM; CFP; Ministério da Saúde; LGPD; boas práticas de telessaúde' },
      { especialidade: 'Ciclos de Vida', categoria: 'Biblioteca transversal', base: 'Adaptações para crianças, adolescentes, gestantes, puérperas, adultos, idosos, pessoas frágeis e pacientes com deficiência', fontes: 'Ministério da Saúde; OPAS/OMS; SBP; FEBRASGO; SBGG; diretrizes clínicas' },
      { especialidade: 'Dor, Sono e Estresse', categoria: 'Biblioteca transversal', base: 'Condições frequentes em várias especialidades, com triagem, autocuidado, práticas integrativas, critérios de encaminhamento e acompanhamento', fontes: 'NICE; NCCIH; Cochrane; PubMed/NCBI; Ministério da Saúde' },
      { especialidade: 'Educação do Paciente e Autocuidado', categoria: 'Biblioteca transversal', base: 'Orientações compreensíveis, adesão, metas realistas, sinais de alerta, hábitos, prevenção, comunicação de riscos e corresponsabilidade', fontes: 'OPAS/OMS; Ministério da Saúde; diretrizes de promoção da saúde' },
      { especialidade: 'Protocolos Transversais por Especialidade', categoria: 'Biblioteca transversal', base: 'Modelos reutilizáveis de avaliação, tratamento, encaminhamento, segurança, evolução e revisão periódica para todas as bibliotecas do sistema', fontes: 'PNPIC/MS; OPAS/OMS; BVS/BIREME; diretrizes profissionais; literatura científica e clássica aplicável' }
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
