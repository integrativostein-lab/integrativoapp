# 🚀 SETUP LOCAL COM SUPABASE — Integrativo.App v2.1

## Pré-requisitos

- Node.js 18+
- Docker (para Supabase local)
- PostgreSQL 14+ (ou use Docker)
- Git

## 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

## 2. Inicializar Supabase Localmente

```bash
cd /caminho/do/projeto
supabase init
supabase start
```

Isso criará um banco de dados PostgreSQL local em Docker.

## 3. Executar Migrações

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres < migracao-v2.1.sql
```

Este repositório mantém a migração principal em `migracao-v2.1.sql`. Se você criar uma pasta `supabase/migrations/` no futuro, documente a ordem das novas migrações aqui antes de trocar para `supabase db push`.

## 4. Instalar Dependências do Backend

```bash
cd backend
npm install
```

## 5. Configurar .env

Copie `.env.example` para `.env` e preencha com suas credenciais:

```bash
cp .env.example .env
```

Para desenvolvimento local com Supabase:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
JWT_SECRET=seu_segredo_super_seguro
NODE_ENV=development
PORT=3001
CORS_ORIGINS=http://localhost:8000
```

Use uma `JWT_SECRET` com pelo menos 32 caracteres em qualquer ambiente compartilhado. Sem `PORT`, o backend sobe em `3000`, mas o frontend local (`frontend/js/config.js`) chama `http://localhost:3001/api`.

## 6. Iniciar o Backend

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3001` quando `PORT=3001` estiver no `.env`.

### Modo alfa/teste local

Para reproduzir o ambiente alfa, crie `backend/.env.teste` com variáveis isoladas:

```env
NODE_ENV=test
TEST_MODE=true
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
TESTE_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
JWT_SECRET=uma_chave_de_teste_com_pelo_menos_32_caracteres
CORS_ORIGINS=http://localhost:8000
EVOLUTION_SIMULATE=true
RNDS_ENABLED=false
```

Inicie com:

```bash
cd backend
npm run dev:teste
```

Com `TEST_MODE=true`, o login aceita as contas demo abaixo sem consultar a tabela de usuários, desde que a senha seja `demo123`:

- `profissional@demo.com`
- `paciente@demo.com`

O backend ainda precisa de `DATABASE_URL` para inicializar o pool Postgres. Se `TESTE_DATABASE_URL` estiver definido, ele substitui `DATABASE_URL` enquanto o modo teste estiver ativo.

## 7. Iniciar o Frontend

```bash
cd frontend
# Se usar um servidor HTTP simples:
python3 -m http.server 8000
# Ou com Live Server no VS Code
```

Acesse em `http://localhost:8000`

## 8. Testar as Rotas

### Teste de saúde do backend
```bash
curl http://localhost:3001/
```

### Login demo em modo teste
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"profissional@demo.com","senha":"demo123"}'
```

### Teste FHIR
```bash
curl -X GET http://localhost:3001/api/fhir/protocolos-fiocruz \
  -H "Authorization: Bearer seu_token_jwt"
```

### Teste FHIR público
```bash
curl http://localhost:3001/api/fhir/metadata
```

### Teste de Validação
```bash
curl -X POST http://localhost:3001/api/validacao/verificar \
  -H "Content-Type: application/json" \
  -d '{
    "conselho": "ABRATH",
    "numero": "123456",
    "nome": "Profissional Demo"
  }'
```

Para persistir o resultado no histórico do profissional, use a rota autenticada:

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

### Teste de alertas determinísticos
```bash
curl "http://localhost:3001/api/alertas-seguranca?termo=ginkgo%20varfarina"
```

A resposta deve conter `usa_ia:false`. O endpoint `/api/alertas-seguranca/regras` exige token de usuário `admin` ou `super_admin`.

## 9. Acessar Supabase Studio (GUI)

```bash
supabase studio
```

Abre em `http://localhost:54323`

## 10. Parar Supabase

```bash
supabase stop
```

## 📊 Estrutura do Banco Local

O Supabase local cria:
- PostgreSQL em `localhost:54322`
- PostgREST em `localhost:54321`
- Studio em `localhost:54323`

## 🔐 Credenciais Padrão

```
Usuário: postgres
Senha: postgres
Banco: postgres
```

## 📝 Notas Importantes

1. **Dados Locais:** Todos os dados são armazenados localmente em Docker
2. **Reset:** Para resetar o banco: `supabase db reset`
3. **Migrations:** Hoje a fonte versionada é `migracao-v2.1.sql`; crie e documente `supabase/migrations/` antes de depender de `supabase db push`
4. **Backup:** Faça backup antes de resetar: `pg_dump > backup.sql`

## 🐛 Troubleshooting

**Erro: "Port 54322 already in use"**
```bash
supabase stop
docker ps
docker kill <container_id>
supabase start
```

**Erro: "Connection refused"**
```bash
supabase status
supabase start
```

**Erro: "Database does not exist"**
```bash
supabase db reset
```

**Frontend chama backend errado ou retorna CORS**
```bash
cd backend
PORT=3001 CORS_ORIGINS=http://localhost:8000 npm run dev
```

**Erro fatal de JWT**
Defina `JWT_SECRET` no `.env` ou `.env.teste`. Em ambientes compartilhados, use pelo menos 32 caracteres.

**Login demo retorna erro**
Confirme que o backend foi iniciado com `TEST_MODE=true` e que a senha é exatamente `demo123`.

## 📞 Próximos Passos

1. Testar fluxos de cadastro
2. Testar integrações FHIR
3. Testar pagamentos (modo sandbox)
4. Deploy em Vercel/Render

---

**Pronto para começar!** 🎉
