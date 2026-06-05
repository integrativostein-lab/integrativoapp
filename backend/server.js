require('dotenv').config();
const formulariosRoutes = require('./rotas/formularios');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Segurança
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }));

// Rate Limiting
const limiter = rateLimit({ windowMs: 60000, max: 100, message: { erro: 'Muitas requisições.' } });
app.use('/api/', limiter);

// Logs e parsing
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// Rota de teste
app.get('/', (req, res) => {
  res.json({ sistema: 'Integrativo.App - Saúde Integrativa', versao: '2.0.0', status: 'online' });
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

console.log('✅ Todas as rotas carregadas');

// Tratamento de erros
app.use((err, req, res, next) => { res.status(500).json({ erro: 'Erro interno' }); });
app.use('*', (req, res) => { res.status(404).json({ erro: 'Rota não encontrada' }); });

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🌿 Integrativo.App - Rodando na porta ' + PORT);
  console.log('📧 Admin: admin@integra.com / admin123');
});

module.exports = app;