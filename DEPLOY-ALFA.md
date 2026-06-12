# Deploy Alfa Remoto

Este projeto esta preparado para um ambiente alfa separado da producao.

## URLs sugeridas

- Frontend alfa: `https://integrativoapp-alfa.vercel.app`
- Backend alfa: `https://integra-backend-alfa.onrender.com`
- API alfa: `https://integra-backend-alfa.onrender.com/api`

O frontend detecta automaticamente dominios com `alfa` ou `alpha`. Enquanto o servico `integra-backend-alfa` ainda nao existir no Render, ele usa temporariamente a API existente `https://integra-backend-ynrd.onrender.com/api`.

Quando o backend alfa for criado, altere `frontend/js/config.js` para apontar dominios alfa para:

```text
https://integra-backend-alfa.onrender.com/api
```

## Vercel

1. Crie um novo projeto chamado `integrativoapp-alfa`.
2. Conecte o repositorio `integrativostein-lab/integrativoapp`.
3. Use a branch `master`.
4. Mantenha o deploy pelo arquivo `vercel.json`.
5. Faca o primeiro deploy com cache limpo.

## Render

1. Crie um novo Blueprint a partir do repositorio `integrativostein-lab/integrativoapp`.
2. Use o arquivo `render.yaml`.
3. O Blueprint cria/atualiza dois servicos:
   - `integra-backend-ynrd` para producao.
   - `integra-backend-alfa` para testes remotos.
4. No servico `integra-backend-alfa`, preencha as variaveis sensiveis:
   - `DATABASE_URL`: banco Postgres exclusivo para alfa.
   - `JWT_SECRET`: chave forte exclusiva para alfa.
   - `LIVEKIT_URL`: URL WebSocket do projeto LiveKit.
   - `LIVEKIT_API_KEY`: chave API do LiveKit.
   - `LIVEKIT_API_SECRET`: segredo API do LiveKit.

Se o servico `integra-backend-alfa` ainda nao existir, use temporariamente o servico existente `integra-backend-ynrd` para teste remoto e preencha nele as mesmas variaveis sensiveis. Nesse cenario, inclua tambem a URL do frontend alfa em `CORS_ORIGINS` do `integra-backend-ynrd`. Depois crie o backend alfa separado antes de liberar testadores.

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

Enquanto o backend alfa remoto nao existir, esse endereco chamara temporariamente:

```text
https://integra-backend-ynrd.onrender.com/api
```

Depois da criacao do backend alfa, esse endereco devera chamar:

```text
https://integra-backend-alfa.onrender.com/api
```

## Redeploy automatico via GitHub

Quando Vercel e Render estiverem conectados ao repositorio, qualquer novo commit em `master` dispara um novo deploy.

Se precisar forcar um redeploy sem alterar regra de negocio, atualize este guia ou outro arquivo de documentacao e faca push para o GitHub.
