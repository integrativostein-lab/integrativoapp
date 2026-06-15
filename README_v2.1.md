# 🌿 Integrativo.App v2.1 — Saúde Integrativa

**Status:** ✅ Pronto para Implementação  
**Versão:** 2.1.0  
**Data:** 06 de Junho de 2026

---

## 📋 O que há de novo na v2.1?

### ✨ Fases 2-5 Implementadas

#### Fase 2: UI/UX Moderna
- ✅ Logo ampliado 20% em todas as páginas
- ✅ Carrossel interativo de 6 especialidades
- ✅ Seção ODS com 9 objetivos de desenvolvimento sustentável
- ✅ Google Analytics integrado
- ✅ Design responsivo mobile-first

#### Fase 3: Reformulação de Cadastros
- ✅ Cadastro de pacientes na home
- ✅ Cadastro de profissionais com validação automática de conselhos
- ✅ Seleção de gateways com modal de configuração
- ✅ Campos para WhatsApp, Email corporativo e Prescrição Eletrônica
- ✅ Validação em tempo real de registros profissionais

#### Fase 4: Integrações Científicas
- ✅ **FHIR Brasil (R4)** — Padrão internacional de saúde
- ✅ **Fiocruz (ARCA)** — Protocolos científicos
- ✅ **RedePICS Brasil** — Pesquisas clínicas
- ✅ **BIREME/OPAS** — Artigos científicos
- ✅ **Comparação de Protocolos** — Identifica diferenças entre fontes
- ✅ **Cache automático** — Reduz latência
- ✅ **Jobs agendados** — Atualização diária

#### Fase 5: Assinaturas e Pagamentos
- ✅ **Modelo Anual** com 4 planos
- ✅ **PIX com 5% de desconto** à vista
- ✅ **Cartão com até 12x** com juros
- ✅ **Cancelamento em 15 dias**, com certificado A1 cobrado quando incluído/emitido e multa proporcional de 20% sobre meses restantes após esse prazo
- ✅ **8 Gateways de Pagamento** integrados

---

## 💰 Valores dos Planos (Anuais)

| Plano | Valor Anual | Parcelamento | Desconto PIX |
|-------|------------|--------------|-------------|
| **Freemium** | R$ 0 | Gratuito | - |
| **Guardiões da Floresta** | R$ 200 | Condição social anual | Sem desconto adicional |
| **Pro** | R$ 899 | Até 12x com juros | 5% (R$ 854) |
| **Premium** | R$ 4.799 | Até 12x com juros | 5% (R$ 4.559) |
| **Enterprise** | R$ 9.990 | Até 12x com juros | 5% (R$ 9.491) |

---

## 🚀 Quick Start

### 1. Clonar o Repositório
```bash
git clone seu-repositorio
cd saude-integrativa-v2.1-final
```

### 2. Setup Local com Supabase
```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar Supabase localmente
supabase init
supabase start

# Executar migrações
psql postgresql://postgres:postgres@localhost:54322/postgres < migracao-v2.1.sql
```

### 3. Instalar Dependências
```bash
cd backend
npm install
```

### 4. Configurar .env
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

Para rodar junto com o frontend local sem sobrescrever a API de producao, configure:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
JWT_SECRET=uma_chave_local_com_pelo_menos_32_caracteres
CORS_ORIGINS=http://localhost:8000
```

O backend tambem aceita modo alfa/teste via `.env.teste` e scripts `npm run start:teste` ou `npm run dev:teste`. Nesse modo, `TEST_MODE=true` habilita login demo com `profissional@demo.com` ou `paciente@demo.com` usando senha `demo123`; use `TESTE_DATABASE_URL` para isolar o banco de teste.

### 5. Iniciar Backend
```bash
npm run dev
```

### 6. Iniciar Frontend
```bash
cd frontend
python3 -m http.server 8000
```

### 7. Acessar
- **Frontend:** http://localhost:8000
- **Backend local esperado pelo frontend:** http://localhost:3001
- **Backend padrao sem `PORT`:** http://localhost:3000
- **Supabase Studio:** http://localhost:54323

---

## 📁 Estrutura do Projeto

```
saude-integrativa-v2.1-final/
├── backend/
│   ├── rotas/
│   │   ├── fhir.js                 # ✨ NOVO: FHIR Brasil
│   │   ├── validacao-conselhos.js  # ✨ NOVO: Validação de Conselhos
│   │   └── ... (outras rotas)
│   ├── server.js                   # ✨ ATUALIZADO: Com FHIR e Validação
│   ├── package.json                # ✨ ATUALIZADO: node-cron, bull
│   └── database.js
├── frontend/
│   ├── index.html                  # ✨ NOVO: Home com carrossel e ODS
│   ├── profissionais.html          # ✨ NOVO: Cadastro de profissionais
│   ├── checkout.html               # ✨ NOVO: Checkout com novo modelo
│   ├── js/
│   │   ├── config.js               # ✨ ATUALIZADO: Novos planos
│   │   ├── carrossel.js            # Carrossel de especialidades
│   │   └── ... (outros scripts)
│   ├── css/
│   │   ├── carrossel.css           # Estilos do carrossel
│   │   └── ... (outros estilos)
│   └── img/
│       ├── especialidade-*.png     # Imagens de especialidades
│       └── ... (outras imagens)
├── migracao-v2.1.sql               # ✨ NOVO: Migrações do banco
├── .env.example                    # ✨ NOVO: Variáveis de ambiente
├── SETUP_LOCAL_SUPABASE.md         # ✨ NOVO: Guia de setup local
├── README_v2.1.md                  # Este arquivo
└── ... (outros arquivos)
```

---

## 🔐 Segurança

- ✅ Autenticação JWT nos endpoints privados; rotas publicas existem para cadastro, metadados FHIR, validacao inicial de conselhos e consulta de alertas.
- ✅ Senhas persistidas com bcrypt; códigos de validação de assinatura persistidos como hash SHA-256
- ✅ Segredos operacionais carregados por variáveis de ambiente (`JWT_SECRET`, bancos, gateways e integrações)
- ✅ Conformidade FHIR Brasil
- ✅ LGPD: Proteção de dados pessoais
- ✅ Validação de entrada em formulários
- ✅ Rate limiting global em `/api/` de 100 req/min e limite mais restritivo em login/cadastros de 10 tentativas/15 min
- ✅ CORS configurado

---

## 📊 Endpoints Principais

### FHIR Brasil

| Método | Rota | Acesso | Uso |
|--------|------|--------|-----|
| GET | `/api/fhir/metadata` | Público | CapabilityStatement local com perfis RNDS/FHIR R4 |
| POST | `/api/fhir/export-patient` | JWT | Exportar paciente (`pacienteId` ou `patientId`) |
| POST | `/api/fhir/export-practitioner` | JWT | Exportar profissional (`profissionalId` ou `practitionerId`) |
| POST | `/api/fhir/export-organization` | JWT | Exportar organização vinculada ao usuário |
| POST | `/api/fhir/export-appointment` | JWT | Exportar agendamento |
| POST | `/api/fhir/export-encounter` | JWT | Exportar atendimento |
| POST | `/api/fhir/export-medication-request` | JWT | Exportar prescrição |
| POST | `/api/fhir/export-bundle` | JWT | Exportar bundle do atendimento |
| POST | `/api/fhir/import-patient` | JWT | Mapear `Patient` FHIR para modelo interno |
| GET | `/api/fhir/exports/:tipo/:id` | JWT | Recuperar última exportação salva |
| GET | `/api/fhir/protocolos-fiocruz` | JWT | Buscar protocolos Fiocruz; usa cache do banco se a API externa falhar |
| GET | `/api/fhir/pesquisas-redepics` | JWT | Buscar pesquisas RedePICS |
| GET | `/api/fhir/artigos-bireme` | JWT | Buscar artigos BIREME |
| POST | `/api/fhir/comparar-protocolos` | JWT | Comparar fontes científicas por especialidade |

### Validação de Conselhos

| Método | Rota | Acesso | Uso |
|--------|------|--------|-----|
| GET | `/api/validacao/conselhos` | Público | Lista conselhos, formatos e especialidades livres |
| GET | `/api/validacao/conselho/:especialidade` | Público | Retorna conselho exigido para uma especialidade |
| POST | `/api/validacao/verificar` | Público | Validação inicial de cadastro (`conselho`, `uf`, `numero`, `nome`) |
| POST | `/api/validacao/validar-registro` | JWT | Valida e persiste resultado para profissional logado |
| GET | `/api/validacao/status/:profissionalId` | JWT | Histórico de validações do profissional |

Limite importante: conselhos brasileiros não oferecem APIs REST públicas oficiais uniformes. A validação é best-effort: confere formato, usa uma URL privada configurável (`<CONSELHO>_API_URL`) quando existir e sempre retorna o link oficial para conferência manual.

### Assinaturas e Pagamentos

| Método | Rota | Acesso | Uso |
|--------|------|--------|-----|
| POST | `/api/financeiro/simular-parcelamento` | Público | Simula plano, PIX e parcelas antes do checkout |
| POST | `/api/financeiro/pagar` | JWT | Registra pagamento de consulta a partir do valor do agendamento |
| GET | `/api/financeiro/meus-pagamentos` | JWT | Lista pagamentos do usuário |
| POST | `/api/financeiro/nota-fiscal` | JWT | Emite ou solicita autorização de nota fiscal |
| POST | `/api/financeiro/renovar-assinatura` | JWT | Cria assinatura anual ou freemium pendente de validação |
| POST | `/api/financeiro/validar-assinatura-codigo` | JWT | Ativa assinatura com código enviado por WhatsApp/email |
| POST | `/api/financeiro/cancelar-assinatura` | JWT | Cancela assinatura e calcula estorno |
| GET | `/api/financeiro/dashboard` | JWT | Indicadores financeiros agregados |

Regras de negócio implementadas no backend: PIX com 5% de desconto, Tabela Price em até 12 parcelas com 1,99% a.m., desconto ABRATH de 8% para Pro/Premium, janela de cancelamento de 15 dias e multa de 20% sobre saldo proporcional após a janela. Certificado A1 emitido pela plataforma pode ser cobrado no cancelamento de planos Premium/Enterprise.

### Teleconsulta LiveKit

| Método | Rota | Acesso | Uso |
|--------|------|--------|-----|
| POST | `/api/reunioes/livekit-token` | JWT | Gera `{ url, token, sala }` para entrar em sala LiveKit |

Variáveis obrigatórias: `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET`. A sala é normalizada para letras/números/`_`/`-`, com limite de 80 caracteres, e o token expira em 2 horas.

### Alertas de Segurança

| Método | Rota | Acesso | Uso |
|--------|------|--------|-----|
| GET | `/api/alertas-seguranca` | Público, JWT opcional | Consulta rápida por termo, prática, produto, condições, medicamentos e alergias |
| POST | `/api/alertas-seguranca/verificar` | Público, JWT opcional | Consulta estruturada para prescrições e formulários |
| GET | `/api/alertas-seguranca/regras` | Admin/super_admin | Auditoria de regras cadastradas |

As respostas do motor incluem `usa_ia:false`; novas regras devem permanecer no backend em `backend/servicos/alertas-seguranca.js`.

---

## 🔄 Fluxos Principais

### Cadastro de Paciente
1. Usuário acessa `index.html`
2. Preenche formulário (nome, email, senha)
3. Submete para `/api/auth/cadastro`
4. Recebe confirmação e é redirecionado para login

### Cadastro de Profissional
1. Usuário acessa `profissionais.html`
2. Preenche dados pessoais e profissionais
3. Seleciona especialidade → conselho é preenchido automaticamente
4. Insere número de registro → validação automática
5. Seleciona gateway de pagamento → abre modal
6. Submete para `/api/auth/cadastro-profissional`

### Checkout
1. Usuário seleciona plano
2. Escolhe PIX (5% desconto) ou Cartão (até 12x)
3. Se cartão: seleciona número de parcelas
4. Preenche dados pessoais
5. Submete para `/api/financeiro/renovar-assinatura`
6. Confirma o código recebido por WhatsApp/email em `/api/financeiro/validar-assinatura-codigo`
7. Assinatura anual é ativada

---

## 🛠 Tecnologias

### Frontend
- HTML5 semântico
- CSS3 com variáveis
- JavaScript vanilla
- Google Analytics 4

### Backend
- Node.js + Express
- PostgreSQL (Supabase)
- JWT para autenticação
- Axios para requisições HTTP
- Node-cron para jobs agendados

### Integrações
- HAPI FHIR Brasil
- Fiocruz ARCA
- RedePICS Brasil
- BIREME/OPAS
- 8 Gateways de Pagamento

---

## 📝 Configuração de Variáveis de Ambiente

Ver `.env.example` para lista completa. Principais:

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Autenticação
JWT_SECRET=sua_chave_secreta_super_segura

# FHIR e Científicas
FIOCRUZ_API_KEY=seu_token
REDEPICS_API_KEY=seu_token
BIREME_API_KEY=seu_token

# Gateways de Pagamento
PAGSEGURO_TOKEN=seu_token
PAGBANK_KEY=sua_chave
ASAAS_API_KEY=sua_chave
# ... etc
```

---

## 🧪 Testes

### Teste FHIR
```bash
curl -X GET http://localhost:3001/api/fhir/protocolos-fiocruz \
  -H "Authorization: Bearer seu_token_jwt"
```

### Teste de Validação
```bash
curl -X POST http://localhost:3001/api/validacao/validar-registro \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_jwt" \
  -d '{
    "especialidade": "massoterapia",
    "conselho": "ABRATH",
    "numero": "123456"
  }'
```

---

## 📊 Jobs Agendados

- **2h da manhã:** Atualizar cache de protocolos Fiocruz para as principais especialidades integrativas
- **3h da manhã:** Revalidar registros profissionais válidos dos últimos 30 dias

---

## 🐛 Troubleshooting

**Erro: "Port 54322 already in use"**
```bash
supabase stop
docker kill $(docker ps -q)
supabase start
```

**Erro: "Connection refused"**
```bash
supabase status
supabase start
```

**Erro: "Rota não encontrada"**
Verificar se as rotas FHIR e Validação foram adicionadas no `server.js`

**Frontend local chama produção ou falha CORS**
Confirme que o frontend está em `localhost` e que o backend local roda com `PORT=3001` e `CORS_ORIGINS=http://localhost:8000`. O resolvedor em `frontend/js/config.js` usa `http://localhost:3001/api` para `localhost`/`127.0.0.1`.

**Login demo não funciona**
Use `TEST_MODE=true`, `JWT_SECRET` configurado e senha `demo123` para `profissional@demo.com` ou `paciente@demo.com`. O modo demo não substitui a necessidade de `DATABASE_URL` para inicializar o backend.

---

## 📞 Suporte

- Documentação FHIR Brasil: https://www.hl7.org.br/
- API Fiocruz: https://arca.fiocruz.br/api
- RedePICS Brasil: https://redepicsbrasil.org.br
- BIREME: https://www.bireme.org.br

---

## 📈 Próximos Passos

1. ✅ Setup local com Supabase
2. ✅ Testar fluxos de cadastro
3. ✅ Testar integrações FHIR
4. ✅ Testar pagamentos (sandbox)
5. ⏳ Integração com Dropbox
6. ✅ Deploy alfa documentado em `DEPLOY-ALFA.md`; produção continua em Vercel/Render

---

## 📄 Licença

ISC — Veja LICENSE para detalhes

---

## 👨‍💻 Desenvolvido por

**Manus AI** — 06 de Junho de 2026

**Versão:** 2.1.0  
**Status:** ✅ Pronto para Produção
