-- Consentimentos LGPD — Integrativo.App
-- Criada automaticamente por backend/rotas/auth.js

CREATE TABLE IF NOT EXISTS consentimentos_lgpd (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  consentiu BOOLEAN NOT NULL,
  versao VARCHAR(120) NOT NULL,
  finalidade TEXT NOT NULL,
  base_legal VARCHAR(80),
  ip VARCHAR(80),
  user_agent TEXT,
  origem VARCHAR(80),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consentimentos_lgpd_usuario
ON consentimentos_lgpd (usuario_id, tipo, criado_em DESC);
