# Deploy Alfa Remoto

Este projeto esta preparado para um ambiente alfa separado da producao.

## URLs sugeridas

- Frontend alfa: `https://integrativoapp-alfa.vercel.app`
- Backend alfa: `https://integra-backend-alfa.onrender.com`
- API alfa: `https://integra-backend-alfa.onrender.com/api`

O frontend detecta automaticamente dominios com `alfa` ou `alpha` e passa a usar a API alfa.

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

## Banco alfa

Use uma base separada da producao. Pode ser Supabase, Render PostgreSQL ou outro Postgres.

Depois de criar o banco, rode as migracoes do projeto nessa base antes de liberar para testadores.

## Acesso dos testadores

Envie apenas a URL do frontend alfa:

```text
https://integrativoapp-alfa.vercel.app
```

Esse endereco chamara automaticamente:

```text
https://integra-backend-alfa.onrender.com/api
```
