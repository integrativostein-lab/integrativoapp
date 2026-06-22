# Domínios — Integrativo.App

## Produção (canônico)

| URL | Papel |
|-----|--------|
| **https://integrativo.app** | Site principal (canônico) |
| https://integrativo.app.br | Redirect → integrativo.app |
| https://integrativoapp.com | Redirect → integrativo.app |
| https://integrativoapp.com.br | Redirect → integrativo.app |

**Backend API:** `https://integra-backend-ynrd.onrender.com/api`

**Vercel:** projeto produção (ex.: `integra-saude-psi`), pasta `frontend/`.

### Render — variáveis de produção

Cole em `CORS_ORIGINS` do serviço `integra-backend-ynrd`:

```text
https://integrativo.app,https://www.integrativo.app,https://integrativo.app.br,https://www.integrativo.app.br,https://integrativoapp.com,https://www.integrativoapp.com,https://integrativoapp.com.br,https://www.integrativoapp.com.br,https://integra-saude-psi.vercel.app
```

`FRONTEND_URL`:

```text
https://integrativo.app
```

## Teste / alfa

| URL | Papel |
|-----|--------|
| https://integrativoapp-alfa.vercel.app | Frontend alfa (padrão Vercel) |
| **https://alfa.integrativoapp.com** | Subdomínio recomendado para testes |
| https://teste.integrativoapp.com | Alternativa de teste |
| https://integrativoappespelho.onrender.com/api | Backend alfa |

### Como o site sabe que é teste

1. **Subdomínio** — `alfa.*` ou `teste.*` (lista em `frontend/js/config.js` → `HOSTNAMES_TESTE`)
2. **Deploy alfa** — `npm run deploy:alfa` embute `INTEGRATIVO_DEPLOY=alfa` no bundle (vale em **qualquer** domínio apontado ao projeto `integrativoapp-alfa` na Vercel)
3. **Deploy produção** — `npm run deploy:prod` embute `INTEGRATIVO_DEPLOY=producao` (sem banner, API produção)

**Produção** (`integrativo.app`, `integrativoapp.com` no projeto `integra-saude-psi`): **não** exibe banner de teste.

**Alfa** (projeto `integrativoapp-alfa`): exibe banner mesmo com domínio customizado, desde que o deploy tenha sido feito via `deploy:alfa`.

**Render alfa** — `CORS_ORIGINS` (inclui subdomínios de teste):

```text
https://integrativoapp-alfa.vercel.app,https://alfa.integrativoapp.com,https://www.alfa.integrativoapp.com,https://teste.integrativoapp.com,https://www.teste.integrativoapp.com
```

Configure no DNS: `alfa.integrativoapp.com` → projeto Vercel **integrativoapp-alfa** (não o de produção).

## E-mail institucional

- contato@integrativo.app  
- suporte@integrativo.app  

## Automatizar infra (recomendado)

**GitHub + Render em um comando:**

```powershell
.\scripts\sincronizar-infra.ps1
```

| Script | O que faz |
|--------|-----------|
| `sincronizar-github.ps1` | Descrição/homepage do repo principal; README + arquiva `integrativoappespelho` |
| `sincronizar-render.ps1` | CORS, env, repo GitHub e redeploy nos 2 backends Render |
| `sincronizar-infra.ps1` | Os dois acima |

Pré-requisitos no `.env.alfa`: `RENDER_API_KEY`, `GITHUB_TOKEN`.

Deploy alfa completo: `npm run deploy:alfa`.
