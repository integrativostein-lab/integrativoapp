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
| https://integrativoapp-alfa.vercel.app | Frontend alfa (padrão atual) |
| https://integrativoappespelho.onrender.com/api | Backend alfa |

Hostname com `alfa` ou `alpha` usa API espelho (`frontend/js/config.js`).

**Render alfa** — `CORS_ORIGINS`:

```text
https://integrativoapp-alfa.vercel.app
```

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
