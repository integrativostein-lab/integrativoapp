# Integrativo.App

Plataforma de saúde integrativa. Dois componentes:

- **backend/** — API Node.js + Express + PostgreSQL (`pg`). Entry point `backend/server.js`.
- **frontend/** — site estático (HTML/CSS/JS vanilla), sem build step.

Standard setup/run docs: `README_v2.1.md`, `SETUP_LOCAL_SUPABASE.md`, `DEPLOY-ALFA.md`. Backend scripts in `backend/package.json` (`npm run dev` uses nodemon).

## Cursor Cloud specific instructions

Dependencies (`npm install` in `backend/`) are refreshed by the startup update script. The frontend has no dependencies. There is **no lint config and no automated test suite** in this repo.

### Running the services

- **Backend**: from `backend/`, run `npm run dev` (nodemon). It requires a `backend/.env` — the server `process.exit(1)`s if `JWT_SECRET` or `DATABASE_URL` is missing.
  - Run it on **PORT=3001**: the frontend hardcodes `http://localhost:3001/api` for localhost (`frontend/js/config.js`, `resolverApiUrl()`), so a backend on 3000 will not be reached by the local UI.
  - For a non-SSL local Postgres, set **`PGSSL=false`** in `.env`, otherwise `database.js` forces SSL and the connection fails.
  - CORS is allow-listed via `CORS_ORIGINS` (default `http://localhost:8000,http://localhost:3000`); add the frontend origin if you serve it elsewhere.
- **Frontend**: from `frontend/`, serve statically, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000`.

### Database caveat (important)

The repo does **not** contain the full base schema. `migracao-v2.1.sql` is *incremental* and assumes core tables (`usuarios`, `agendamentos`, `pagamentos`, `especialidades`, …) already exist; the authoritative schema lives in remote Supabase. Most route files query these tables but do not create them (only a few helper tables like `consentimentos_pesquisa` are auto-created on first use).

To exercise DB-backed flows locally (e.g. real patient/professional registration and login) you must provide a Postgres with those tables. Options:

- Point `DATABASE_URL` at a Supabase/Postgres that already has the schema, **or**
- Create a local Postgres and bootstrap the core tables yourself, then apply `migracao-v2.1.sql` on top. A minimal bootstrap covering `usuarios` + `pacientes` (+ stub `agendamentos`/`pagamentos` for the migration's FKs) is enough for the auth/registration hello-world.

Postgres is a system dependency (not installed by the update script). Install it once (`apt-get install postgresql`) and start the cluster (`sudo pg_ctlcluster 16 main start`) before running DB-backed flows.

### No-DB shortcuts

- Set **`TEST_MODE=true`** to enable demo logins that bypass the DB: `paciente@demo.com` / `profissional@demo.com`, password `demo123` (see `backend/rotas/auth.js`).
- The deterministic clinical-safety engine needs no DB: `GET /api/alertas-seguranca?termo=ginkgo%20varfarina` returns rule `FITOTERAPIA_ANTICOAGULANTE_001`.

### Optional integrations

Payment gateways, Stripe, LiveKit (teleconsulta), Evolution/WhatsApp, Dropbox, Google, Zoho, FHIR/RNDS are all gated by env vars (see `.env.example`). They are optional for local dev; set `EVOLUTION_SIMULATE=true` and `RNDS_ENABLED=false` to avoid external calls.
