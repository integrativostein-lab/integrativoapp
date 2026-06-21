-- Trilha de auditoria LGPD — Integrativo.App
-- Espelha a estrutura criada automaticamente por backend/servicos/auditoria-lgpd.js
-- Arquivos append-only: backend/logs/auditoria-lgpd/AAAA/MM/auditoria-AAAA-MM-DD.jsonl

CREATE TABLE IF NOT EXISTS logs_auditoria (
  id SERIAL PRIMARY KEY,
  evento_id UUID NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  categoria VARCHAR(60) NOT NULL,
  acao VARCHAR(60) NOT NULL,
  usuario_id INTEGER,
  usuario_tipo VARCHAR(30),
  recurso VARCHAR(60),
  recurso_id VARCHAR(80),
  base_legal VARCHAR(40),
  finalidade VARCHAR(200),
  ip VARCHAR(80),
  user_agent TEXT,
  rota VARCHAR(255),
  metodo VARCHAR(10),
  resultado VARCHAR(20) NOT NULL,
  detalhes JSONB,
  arquivo_log VARCHAR(255),
  schema_versao VARCHAR(10) DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_criado ON logs_auditoria (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario ON logs_auditoria (usuario_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_categoria ON logs_auditoria (categoria, criado_em DESC);
