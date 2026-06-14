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

Ou via Supabase CLI:

```bash
supabase db push
```

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
```

## 6. Iniciar o Backend

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

## 7. Iniciar o Frontend

```bash
cd frontend
# Se usar um servidor HTTP simples:
python3 -m http.server 8000
# Ou com Live Server no VS Code
```

Acesse em `http://localhost:8000`

## 8. Testar as Rotas

### Testes FHIR

Metadata publico:

```bash
curl http://localhost:3000/api/fhir/metadata
```

Exportacao autenticada:

```bash
curl -X POST http://localhost:3000/api/fhir/export-patient \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_jwt" \
  -d '{"pacienteId": 1}'
```

Consulta cientifica autenticada:

```bash
curl http://localhost:3000/api/fhir/protocolos-fiocruz?especialidade=fitoterapia \
  -H "Authorization: Bearer seu_token_jwt"
```

### Testes de Validação

Verificacao publica usada pelo cadastro:

```bash
curl -X POST http://localhost:3000/api/validacao/verificar \
  -H "Content-Type: application/json" \
  -d '{
    "conselho": "ABRATH",
    "numero": "123456",
    "nome": "Profissional Teste"
  }'
```

Validacao autenticada e persistida:

```bash
curl -X POST http://localhost:3000/api/validacao/validar-registro \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_jwt" \
  -d '{
    "especialidade": "massoterapia",
    "numero": "123456",
    "conselho": "ABRATH"
  }'
```

### Teste LiveKit

Depois de configurar `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` no `.env`:

```bash
curl -X POST http://localhost:3000/api/reunioes/livekit-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_jwt" \
  -d '{"sala":"teleconsulta-local","nome":"Profissional Teste"}'
```

Se estiver usando o script `npm run dev:teste`, configure `.env.teste` com `PORT=3001`, pois `frontend/js/config.js` envia localhost para `http://localhost:3001/api`.

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
3. **Migrations:** Novas migrações vão em `supabase/migrations/`
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

## 📞 Próximos Passos

1. Testar fluxos de cadastro
2. Testar integrações FHIR
3. Testar pagamentos (modo sandbox)
4. Deploy em Vercel/Render

---

**Pronto para começar!** 🎉
