# Deploy Alfa Remoto

Este projeto esta preparado para um ambiente alfa separado da producao.

## URLs sugeridas

### Produção (domínios oficiais)

- **Canônico:** `https://integrativo.app`
- Espelhos (redirect na Vercel): `integrativo.app.br`, `integrativoapp.com`, `integrativoapp.com.br`
- Backend: `https://integra-backend-ynrd.onrender.com`
- API: `https://integra-backend-ynrd.onrender.com/api`

Ver mapa completo em `DOMINIOS.md` (CORS e `FRONTEND_URL` no Render).

### Alfa / teste

- Frontend alfa: `https://integrativoapp-alfa.vercel.app`
- Backend alfa: `https://integrativoappespelho.onrender.com`
- API alfa: `https://integrativoappespelho.onrender.com/api`

O frontend detecta automaticamente dominios com `alfa` ou `alpha` e usa o backend espelho `https://integrativoappespelho.onrender.com/api`.

Quando o backend alfa for criado, altere `frontend/js/config.js` para apontar dominios alfa para:

```text
https://integrativoappespelho.onrender.com/api
```

## Vercel

1. Crie um novo projeto chamado `integrativoapp-alfa`.
2. Conecte o repositorio `integrativostein-lab/integrativoapp`.
3. Use a branch `master`.
4. Mantenha o deploy pelo arquivo `vercel.json`.
5. Faca o primeiro deploy com cache limpo.

## Render

Por enquanto, para evitar custo extra no Render, o `render.yaml` publica apenas o backend principal:

```text
https://integra-backend-ynrd.onrender.com
```

O frontend alfa continua usando temporariamente essa API. Para isso, mantenha a URL do frontend alfa em `CORS_ORIGINS` do backend principal:

```text
https://integrativoapp-alfa.vercel.app
```

Se no futuro for necessario um backend alfa separado, use o servico `integrativoappespelho` como opcao manual e preencha as variaveis sensiveis:

- `DATABASE_URL`: banco Postgres exclusivo para alfa.
- `JWT_SECRET`: chave forte exclusiva para alfa.
- `LIVEKIT_URL`: URL WebSocket do projeto LiveKit.
- `LIVEKIT_API_KEY`: chave API do LiveKit.
- `LIVEKIT_API_SECRET`: segredo API do LiveKit.
- `EVOLUTION_API_URL`: URL da Evolution API, se for testar WhatsApp real.
- `EVOLUTION_API_KEY`: chave da Evolution API, se for testar WhatsApp real.
- `EVOLUTION_INSTANCE`: instancia alfa da Evolution API.

### Criacao manual/correcao do `integrativoappespelho`

Se o Blueprint nao criou o alfa automaticamente, ou se o servico ja aparece como `integrativoappespelho` com cadeado no Render, corrija o proprio servico existente.

1. Acesse Render > `integrativoappespelho` > Settings.
2. Confirme que o repositorio conectado e `integrativostein-lab/integrativoapp`.
3. Nome do servico: `integrativoappespelho`.
4. Branch: `master`.
5. Root Directory: `backend`.
6. Runtime: `Node`.
7. Build Command: `npm install`.
8. Start Command: `npm start`.
9. Health Check Path: `/`.
10. Auto Deploy: `Yes`.
11. Variaveis obrigatorias:
    - `NODE_ENV=test`
    - `PORT=10000`
    - `TEST_MODE=true`
    - `SIMULAR_NF_SEM_CERTIFICADO=true`
    - `CORS_ORIGINS=https://integrativoapp-alfa.vercel.app`
    - `DATABASE_URL=<banco alfa>`
    - `JWT_SECRET=<chave forte exclusiva do alfa>`
    - `EVOLUTION_SIMULATE=true`
    - `RNDS_ENABLED=false`
    - `FHIR_BASE_URL=https://integrativoappespelho.onrender.com/api/fhir`
    - `TISS_BASE_URL=https://integrativoappespelho.onrender.com/api/tiss`

Depois do deploy, valide:

```text
https://integrativoappespelho.onrender.com/
https://integrativoappespelho.onrender.com/api/alertas-seguranca?termo=ginkgo%20varfarina
https://integrativoappespelho.onrender.com/api/tiss/metadata
```

O endpoint de alertas deve retornar `usa_ia:false` e uma regra como `FITOTERAPIA_ANTICOAGULANTE_001`.
O endpoint TISS deve retornar `sistema`, `versaoTiss`, `formatos` e a lista de endpoints `/api/tiss`.

Se o servico `integrativoappespelho` ficar indisponivel, use temporariamente o servico existente `integra-backend-ynrd` para teste remoto. Nesse cenario, inclua tambem a URL do frontend alfa em `CORS_ORIGINS` do `integra-backend-ynrd` e ajuste `frontend/js/config.js` enquanto durar a contingencia.

## Banco alfa

Use uma base separada da producao. Pode ser Supabase, Render PostgreSQL ou outro Postgres.

Depois de criar o banco, rode as migracoes do projeto nessa base antes de liberar para testadores.

## LiveKit / Teleconsulta

O backend gera tokens seguros pela rota:

```text
POST /api/reunioes/livekit-token
```

O frontend de teste usa:

```text
/reuniao.html?sala=teleconsulta-alfa
```

As chaves reais do LiveKit devem ficar somente em variaveis de ambiente do Render e nos arquivos locais `.env` / `.env.teste`, que nao devem ir para o GitHub.

## Acesso dos testadores

Envie apenas a URL do frontend alfa:

```text
https://integrativoapp-alfa.vercel.app
```

O frontend alfa deve chamar:

```text
https://integrativoappespelho.onrender.com/api
```

Fallback temporario, somente em contingencia:

```text
https://integra-backend-ynrd.onrender.com/api
```

## Gestao das regras deterministicas

As regras de seguranca ficam no backend, no arquivo:

```text
backend/servicos/alertas-seguranca.js
```

Elas sao executadas em tempo real pelas rotas:

```text
GET  /api/alertas-seguranca
POST /api/alertas-seguranca/verificar
```

O frontend nunca recebe o arquivo de regras; ele recebe apenas o resultado da verificacao.

Para manter alfa e producao alinhados:

1. Altere regras apenas em `backend/servicos/alertas-seguranca.js`.
2. Teste no ambiente local.
3. Faca commit e push.
4. Confirme primeiro no backend alfa.
5. Depois valide producao.

O endpoint `/api/alertas-seguranca/regras` e restrito a `admin` e `super_admin`.

## Redeploy automatico via GitHub

Quando Vercel e Render estiverem conectados ao repositorio, qualquer novo commit em `master` dispara um novo deploy.

Se precisar forcar um redeploy sem alterar regra de negocio, atualize este guia ou outro arquivo de documentacao e faca push para o GitHub.

## Deploy automatizado (1 comando)

Depois de obter os tokens (uma unica vez), o script faz SQL + Render + Vercel + testes:

1. Copie `.env.alfa.example` para `.env.alfa`
2. Preencha:
   - `DATABASE_URL` (Supabase → Database → Connection string)
   - `RENDER_API_KEY` (Render → Account Settings → API Keys)
   - `VERCEL_TOKEN` (vercel.com/account/tokens → Create Token)
3. Execute:

```powershell
cd C:\Users\HP\Dropbox\integrativo-app-v2.1.0-INTEGRADO
.\scripts\deploy-alfa.ps1
```

Ou: `npm run deploy:alfa` (pasta `backend`).

Flags uteis: `--skip-vercel`, `--skip-render`, `--dry-run`.

**O que ainda exige voce uma vez (nao da para automatizar sem login):**
- Criar projeto Supabase e copiar a connection string
- Ter o servico `integrativoappespelho` criado no Render (conectado ao GitHub)
- Gerar os 3 tokens acima (tokens antigos nao podem ser recuperados — crie novos)
