# Deploy Alfa Remoto

Este projeto esta preparado para um ambiente alfa separado da producao.

## URLs sugeridas

- Frontend alfa: `https://integrativoapp-alfa.vercel.app`
- Backend alfa: `https://integrativoappespelho.onrender.com`
- API alfa: `https://integrativoappespelho.onrender.com/api`

O frontend detecta automaticamente dominios com `alfa` ou `alpha` e usa o backend espelho:

```text
https://integrativoappespelho.onrender.com/api
```

Em `localhost` ou `127.0.0.1`, o mesmo resolvedor usa `http://localhost:3001/api`. Em outros dominios, o fallback e a API de producao `https://integra-backend-ynrd.onrender.com/api`.

## Vercel

1. Crie um novo projeto chamado `integrativoapp-alfa`.
2. Conecte o repositorio `integrativostein-lab/integrativoapp`.
3. Use a branch `master`.
4. Mantenha o deploy pelo arquivo `vercel.json`.
5. Faca o primeiro deploy com cache limpo.

## Render

O `render.yaml` versionado publica apenas o backend principal:

```text
https://integra-backend-ynrd.onrender.com
```

Ele nao cria automaticamente o servico espelho. Se o servico `integrativoappespelho` ainda nao existir ou estiver indisponivel, use temporariamente a API principal e mantenha a URL do frontend alfa em `CORS_ORIGINS` do backend principal:

```text
https://integrativoapp-alfa.vercel.app
```

Para backend alfa separado, use o servico manual `integrativoappespelho` e preencha as variaveis sensiveis:

- `DATABASE_URL`: banco Postgres exclusivo para alfa.
- `JWT_SECRET`: chave forte exclusiva para alfa.
- `LIVEKIT_URL`: URL WebSocket do projeto LiveKit.
- `LIVEKIT_API_KEY`: chave API do LiveKit.
- `LIVEKIT_API_SECRET`: segredo API do LiveKit.
- `EVOLUTION_API_URL`: URL da Evolution API, se for testar WhatsApp real.
- `EVOLUTION_API_KEY`: chave da Evolution API, se for testar WhatsApp real.
- `EVOLUTION_INSTANCE`: instancia alfa da Evolution API.
- `EVOLUTION_SIMULATE=true`: mantem WhatsApp em simulacao enquanto nao houver instancia alfa real.
- `RNDS_ENABLED=false`: evita envio real para RNDS durante alfa.

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

Variaveis opcionais conforme escopo do teste:

- `TESTE_DATABASE_URL=<banco alfa alternativo>`: usado no lugar de `DATABASE_URL` quando `TEST_MODE=true`.
- `FIOCRUZ_API_KEY`, `REDEPICS_API_KEY`, `BIREME_API_KEY`: chaves para fontes cientificas externas.
- `EMAIL_WEBHOOK_URL`: webhook de email; sem ele, notificacoes podem simular/logar envio.
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`: somente se `EVOLUTION_SIMULATE=false`.

Depois do deploy, valide:

```text
https://integrativoappespelho.onrender.com/
https://integrativoappespelho.onrender.com/api/alertas-seguranca?termo=ginkgo%20varfarina
```

O segundo endpoint deve retornar `usa_ia:false` e uma regra como `FITOTERAPIA_ANTICOAGULANTE_001`.

Se o servico `integrativoappespelho` ficar indisponivel, use temporariamente o servico existente `integra-backend-ynrd` para teste remoto. Nesse cenario, inclua tambem a URL do frontend alfa em `CORS_ORIGINS` do `integra-backend-ynrd` e ajuste `frontend/js/config.js` enquanto durar a contingencia.

## Banco alfa

Use uma base separada da producao. Pode ser Supabase, Render PostgreSQL ou outro Postgres.

Depois de criar o banco, rode as migracoes do projeto nessa base antes de liberar para testadores.

## LiveKit / Teleconsulta

O backend gera tokens seguros pela rota:

```text
POST /api/reunioes/livekit-token
```

Contrato da rota:

- Requer `Authorization: Bearer <jwt>`.
- Requer `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` no ambiente; sem eles retorna HTTP 500.
- Aceita `sala`, `agendamento_id` e `nome` no body.
- Normaliza a sala para letras, numeros, `_` e `-`, com maximo de 80 caracteres; valor padrao: `teleconsulta-alfa`.
- Retorna `{ url, token, sala }`.
- Token expira em 2 horas e libera entrar na sala, publicar audio/video, assinar streams e publicar dados.

O frontend de teste usa:

```text
/reuniao.html?sala=teleconsulta-alfa
```

O painel profissional tambem pode embutir a sala com `?embed=1`. A UI atual cobre microfone, camera e compartilhamento de tela; gravacao persistente, chat salvo e estado de reuniao nao sao persistidos pelo backend atual.

As chaves reais do LiveKit devem ficar somente em variaveis de ambiente do Render e nos arquivos locais `.env` / `.env.teste`, que nao devem ir para o GitHub.

Teste manual com token JWT valido:

```bash
curl -X POST https://integrativoappespelho.onrender.com/api/reunioes/livekit-token \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sala":"teleconsulta-alfa","nome":"Tester Alfa"}'
```

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

Em modo alfa, `TEST_MODE=true` habilita login demo para:

- `profissional@demo.com` / `demo123`
- `paciente@demo.com` / `demo123`

Esse bypass existe apenas para esses emails e depende de `JWT_SECRET` configurado.

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

## Rotas publicas vs privadas relevantes no alfa

Nem toda rota de verificacao exige JWT. Isso e intencional para cadastro, metadados e consultas publicas:

| Rota | Acesso | Observacao |
|------|--------|------------|
| `GET /api/fhir/metadata` | Publico | CapabilityStatement FHIR local |
| `GET /api/validacao/conselhos` | Publico | Lista conselhos e formatos suportados |
| `GET /api/validacao/conselho/:especialidade` | Publico | Usada no cadastro profissional |
| `POST /api/validacao/verificar` | Publico | Validacao best-effort de conselho antes do cadastro |
| `GET /api/alertas-seguranca` | Publico, JWT opcional | Retorna `usa_ia:false` |
| `POST /api/alertas-seguranca/verificar` | Publico, JWT opcional | Consulta estruturada |
| `GET /api/alertas-seguranca/regras` | Admin/super_admin | Auditoria das regras |
| `POST /api/reunioes/livekit-token` | JWT | Gera token LiveKit |
| `POST /api/financeiro/renovar-assinatura` | JWT | Cria assinatura anual pendente de codigo |
| `POST /api/financeiro/validar-assinatura-codigo` | JWT | Ativa assinatura apos codigo |

O rate limit global e 100 req/min em `/api/`; login e cadastros usam limite mais restritivo de 10 tentativas a cada 15 minutos.

## Redeploy automatico via GitHub

Quando Vercel e Render estiverem conectados ao repositorio, qualquer novo commit em `master` dispara um novo deploy.

Se precisar forcar um redeploy sem alterar regra de negocio, atualize este guia ou outro arquivo de documentacao e faca push para o GitHub.
