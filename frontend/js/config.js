const CONFIG = {
  // ═══════════════════════════════════════════
  // MODO DE OPERAÇÃO
  // ═══════════════════════════════════════════
  MODO: 'teste', // 'teste' ou 'producao'

  // ═══════════════════════════════════════════
  // URLs
  // ═══════════════════════════════════════════
  API_URL: 'https://integra-backend-ynrd.onrender.com/api',
  FRONTEND_URL: 'https://integra-saude-psi.vercel.app',
  NOME_SISTEMA: 'Integrativo.App',
  VERSAO: '2.0.0',

  // ═══════════════════════════════════════════
  // 30 ESPECIALIDADES
  // ═══════════════════════════════════════════
  ESPECIALIDADES: [
    'Fitoterapia', 'Ayurveda', 'MTC', 'Yoga', 'Massoterapia', 'Aromaterapia',
    'Fisioterapia', 'Xamanismo', 'Florais de Bach', 'Reiki', 'Reflexologia',
    'Medicina Integrativa', 'Jyotish', 'Vastu Shastra', 'Quiropraxia',
    'Osteopatia', 'Cromoterapia', 'Musicoterapia', 'Equoterapia', 'Apiterapia',
    'Hidroterapia', 'Acupuntura', 'Medicina Tradicional', 'Farmacologia',
    'Pediatria', 'Ginecologia', 'Geriatria', 'Saúde Mental',
    'Medicina de Família', 'Emergência'
  ],

  // ═══════════════════════════════════════════
  // PLANOS E PREÇOS
  // ═══════════════════════════════════════════
  PLANOS: {
    freemium: {
      nome: 'Freemium', valor_mensal: 0,
      max_teleconsultas: 30, max_agendamentos: 70, max_whatsapp: 30,
      max_pacientes: 50, recepcao: 0, blog: 0, rh: false,
      white_label: false, api_white_label: false, migracao: false,
      conciliacao: false, especialidades_inclusas: 1
    },
    pro: {
      nome: 'Pro', valor_mensal: 89.90, valor_semestral: 485.46, valor_anual: 863.04,
      max_teleconsultas: 150, max_agendamentos: 500, max_whatsapp: 1000,
      max_pacientes: 300, recepcao: 1, blog: 10, rh: 'basico',
      white_label: true, api_white_label: false, migracao: true,
      conciliacao: false, especialidades_inclusas: 30
    },
    premium: {
      nome: 'Premium', valor_mensal: 479.90, valor_semestral: 2591.46, valor_anual: 4607.04,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: 1000, recepcao: 3, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 30
    },
    enterprise: {
      nome: 'Enterprise', valor_mensal: 999.90, valor_semestral: 5399.46, valor_anual: 9599.04,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: Infinity, recepcao: Infinity, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 30, certificado_a1_gratis: true
    },
    coworking: {
      nome: 'Coworking', valor_mensal: 1599.90,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: Infinity, recepcao: Infinity, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 30, certificado_a1_gratis: true
    }
  },

  // ═══════════════════════════════════════════
  // PARCELAMENTO
  // ═══════════════════════════════════════════
  PARCELAMENTO: { 
    max_semestral: 3, 
    max_anual: 4, 
    sem_juros: true 
  },

  PAGAMENTOS: {
    pix_desconto: 5, // 5% de desconto para pagamentos via PIX
    parcelamento: {
      mensal: { max: 1, sem_juros: true },
      semestral: { max: 3, sem_juros: true },
      anual: { max: 4, sem_juros: true }
    }
  },
  
   // ═══════════════════════════════════════════
  // PRAZOS E MULTAS
  // ═══════════════════════════════════════════
  PRAZOS: { arrependimento_dias: 10, reposicao_yoga_dias: 30, notificacao_renovacao_dias: 15 },
  MULTAS: { cancelamento_consulta: 20, desmarcar_consulta: 10 },

  // ═══════════════════════════════════════════
  // GATEWAYS
  // ═══════════════════════════════════════════
  GATEWAYS: [
    { id: 'pagseguro', nome: 'PagSeguro', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'pagbank', nome: 'PagBank', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'asaas', nome: 'Asaas', taxa_cartao: '2,99%', taxa_pix: '1,99%' },
    { id: 'ton', nome: 'Ton', taxa_cartao: '1,99%', taxa_pix: '0,99%' },
    { id: 'mercadopago', nome: 'Mercado Pago', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'efi', nome: 'Efi Bank', taxa_cartao: '1,99%', taxa_pix: '1,99%' },
    { id: 'cielo', nome: 'Cielo', taxa_cartao: 'Variável', taxa_pix: '1,99%' },
    { id: 'stone', nome: 'Stone', taxa_cartao: 'Variável', taxa_pix: '1,99%' }
  ],

  // ═══════════════════════════════════════════
  // SUPORTE
  // ═══════════════════════════════════════════
  SUPORTE: {
    segunda: '10h - 19h', terca: '10h - 19h', quarta: '13h - 17h',
    quinta: '10h - 19h', sexta: '13h - 17h', sabado: 'Fechado', domingo: 'Fechado'
  },

  // ═══════════════════════════════════════════
  // IDIOMAS
  // ═══════════════════════════════════════════
  IDIOMAS: ['pt-BR', 'en', 'es', 'fr', 'ru', 'hi', 'zh', 'af', 'zu'],
  IDIOMAS_BANDEIRAS: { 'pt-BR': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'ru': '🇷🇺', 'hi': '🇮🇳', 'zh': '🇨🇳', 'af': '🇿🇦', 'zu': '🇿🇦' }
};
window.CONFIG = CONFIG;