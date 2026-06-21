# Integrativo.App

Plataforma de saúde integrativa — frontend estático (Vercel) + API Node.js (Render).

| Ambiente | Site | API |
|----------|------|-----|
| **Produção** | https://integrativo.app | https://integra-backend-ynrd.onrender.com/api |
| **Alfa / teste** | https://integrativoapp-alfa.vercel.app | https://integrativoappespelho.onrender.com/api |

Domínios espelho (redirect): `integrativo.app.br`, `integrativoapp.com`, `integrativoapp.com.br`.

## Automatizar infra (GitHub + Render)

1. Copie `.env.alfa.example` → `.env.alfa`
2. Preencha `RENDER_API_KEY` e `GITHUB_TOKEN`
3. Execute:

```powershell
.\scripts\sincronizar-infra.ps1
```

Ou separado: `.\scripts\sincronizar-github.ps1` · `.\scripts\sincronizar-render.ps1`

Deploy alfa completo (SQL + Vercel): `npm run deploy:alfa` (pasta `backend`).

Documentação: `DOMINIOS.md` · `DEPLOY-ALFA.md`

## Demo

- Profissional: `profissional@demo.com` / `demo123`
- Paciente: `paciente@demo.com` / `demo123`

## Contato

suporte@integrativo.app
