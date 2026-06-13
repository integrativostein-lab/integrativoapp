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
- **Backend:** http://localhost:3000
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

- ✅ Autenticação JWT em todos os endpoints
- ✅ Dados sensíveis criptografados
- ✅ Conformidade FHIR Brasil
- ✅ LGPD: Proteção de dados pessoais
- ✅ Validação de entrada em formulários
- ✅ Rate limiting implementado
- ✅ CORS configurado

---

## 📊 Endpoints Principais

### FHIR Brasil
```
POST   /api/fhir/export-patient          # Exportar paciente em FHIR
POST   /api/fhir/export-appointment      # Exportar agendamento em FHIR
GET    /api/fhir/protocolos-fiocruz      # Buscar protocolos Fiocruz
GET    /api/fhir/pesquisas-redepics      # Buscar pesquisas RedePICS
GET    /api/fhir/artigos-bireme          # Buscar artigos BIREME
POST   /api/fhir/comparar-protocolos     # Comparar protocolos
```

### Validação de Conselhos
```
POST   /api/validacao/validar-registro   # Validar registro profissional
GET    /api/validacao/conselho/:esp      # Obter conselho de especialidade
GET    /api/validacao/status/:prof_id    # Status de validação
```

### Assinaturas e Pagamentos
```
POST   /api/financeiro/processar-pagamento  # Processar pagamento
GET    /api/financeiro/assinaturas/:user_id # Listar assinaturas
POST   /api/financeiro/cancelar-assinatura  # Cancelar assinatura
```

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
5. Submete para `/api/financeiro/processar-pagamento`
6. Assinatura é ativada por 1 ano

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
curl -X GET http://localhost:3000/api/fhir/protocolos-fiocruz \
  -H "Authorization: Bearer seu_token_jwt"
```

### Teste de Validação
```bash
curl -X POST http://localhost:3000/api/validacao/validar-registro \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_jwt" \
  -d '{
    "especialidade": "massoterapia",
    "numeroRegistro": "123456",
    "conselho": "ABRATH"
  }'
```

---

## 📊 Jobs Agendados

- **2h da manhã:** Atualizar protocolos Fiocruz
- **3h da manhã:** Atualizar status de validações

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
6. ⏳ Deploy em Vercel/Render

---

## 📄 Licença

ISC — Veja LICENSE para detalhes

---

## 👨‍💻 Desenvolvido por

**Manus AI** — 06 de Junho de 2026

**Versão:** 2.1.0  
**Status:** ✅ Pronto para Produção
