require('dotenv').config();

// ============================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE CRÍTICAS
// ============================================
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET não configurado. Defina em .env antes de iniciar.');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn('[AVISO] JWT_SECRET tem menos de 32 caracteres. Use uma chave forte em produção.');
}

const formulariosRoutes = require('./rotas/formularios');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const ambiente = require('./config/ambiente');

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Segurança
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS — origens controladas via env CORS_ORIGINS (lista separada por vírgula)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8000,http://localhost:3000')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server / curl
    if (allowedOrigins.includes('*')) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting global
const limiter = rateLimit({ windowMs: 60000, max: 100, message: { erro: 'Muitas requisições.' } });
app.use('/api/', limiter);

// Rate Limiting agressivo em endpoints sensíveis
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { erro: 'Muitas tentativas. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/cadastro', authLimiter);
app.use('/api/auth/cadastro-profissional', authLimiter);

// Logs e parsing
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
const uploadsDir = ambiente.garantirDiretorio('uploads');
app.use('/uploads', express.static(uploadsDir));

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    sistema: 'Integrativo.App - Saúde Integrativa',
    versao: '2.1.0',
    status: 'online',
    ambiente: process.env.NODE_ENV || 'development',
    modo_teste: ambiente.modoTeste,
    pasta_teste: ambiente.testeDir
  });
});

// ============================================
// IMPORTAÇÃO DAS ROTAS
// ============================================

const authRoutes = require('./rotas/auth');
const usuarioRoutes = require('./rotas/usuarios');
const agendamentoRoutes = require('./rotas/agendamentos');
const profissionalRoutes = require('./rotas/profissionais');
const financeiroRoutes = require('./rotas/financeiro');
const lojaRoutes = require('./rotas/loja');
const yogaRoutes = require('./rotas/yoga');
const prescricaoRoutes = require('./rotas/prescricoes');
const adminRoutes = require('./rotas/admin');
const revendaRoutes = require('./rotas/revenda');
const criadorRoutes = require('./rotas/criador');
const zohoRoutes = require('./rotas/zoho');
const whiteLabelRoutes = require('./rotas/white-label');
const massagemRoutes = require('./rotas/massagens');
const rhRoutes = require('./rotas/rh');
const fiscalRoutes = require('./rotas/fiscal');
const blogRoutes = require('./rotas/blog');
const mensagensRoutes = require('./rotas/mensagens');
const migracaoRoutes = require('./rotas/migracao');
const googleCalendarRoutes = require('./rotas/google-calendar');
const gatewaysRoutes = require('./rotas/gateways');
const conciliacaoRoutes = require('./rotas/conciliacao');
const entidadesRoutes = require('./rotas/entidades');
const acsRoutes = require('./rotas/acs');
const equipeRoutes = require('./rotas/equipe');
const pagamentoRoutes = require('./rotas/pagamento');
const susRoutes = require('./rotas/sus');
const tissRoutes = require('./rotas/tiss');
const { router: fhirRoutes, atualizarProtocolosFiocruz } = require('./rotas/fhir');
const { router: validacaoRoutes, atualizarStatusValidacoes } = require('./rotas/validacao-conselhos');

// ============================================
// ATIVAÇÃO DAS ROTAS
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/formularios', formulariosRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/profissionais', profissionalRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/loja', lojaRoutes);
app.use('/api/yoga', yogaRoutes);
app.use('/api/prescricoes', prescricaoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/revenda', revendaRoutes);
app.use('/api/criador', criadorRoutes);
app.use('/api/zoho', zohoRoutes);
app.use('/api/white-label', whiteLabelRoutes);
app.use('/api/massagens', massagemRoutes);
app.use('/api/rh', rhRoutes);
app.use('/api/fiscal', fiscalRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api/migracao', migracaoRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/gateways', gatewaysRoutes);
app.use('/api/conciliacao', conciliacaoRoutes);
app.use('/api/entidades', entidadesRoutes);
app.use('/api/acs', acsRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/pagamento', pagamentoRoutes);
app.use('/api/sus', susRoutes);
app.use('/api/tiss', tissRoutes);
app.use('/api/fhir', fhirRoutes);
app.use('/api/validacao', validacaoRoutes);

console.log('✅ Todas as rotas carregadas');

// ============================================
// JOBS AGENDADOS (CRON)
// ============================================

// Atualizar protocolos Fiocruz diariamente às 2h da manhã
cron.schedule('0 2 * * *', () => {
  console.log('🔄 Iniciando atualização de protocolos Fiocruz...');
  atualizarProtocolosFiocruz();
});

// Atualizar status de validações diariamente às 3h da manhã
cron.schedule('0 3 * * *', () => {
  console.log('🔄 Iniciando atualização de status de validações...');
  atualizarStatusValidacoes();
});

console.log('⏰ Jobs agendados configurados');

// Tratamento de erros
app.use((err, req, res, next) => {
  const errId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  console.error(`[ERR ${errId}] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno', id: errId });
});
app.use('*', (req, res) => { res.status(404).json({ erro: 'Rota não encontrada' }); });

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🌿 Integrativo.App v2.1 - Rodando na porta ' + PORT);
  console.log('🔐 FHIR Brasil: /api/fhir');
  console.log('✓ Validação de Conselhos: /api/validacao');
  console.log('✓ CORS permitido para: ' + allowedOrigins.join(', '));
  if (ambiente.modoTeste) {
    console.log('✓ Ambiente de teste ativo: ' + (ambiente.testeDir || 'sem pasta TESTE configurada'));
  }
});

module.exports = app;
