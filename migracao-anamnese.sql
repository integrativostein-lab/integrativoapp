-- Anamnese integrativa v2.1 — PICS + medicina ocidental
-- Rode após migracao-base-alfa.sql

CREATE TABLE IF NOT EXISTS config_anamnese_parte1 (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidade_id VARCHAR(255) NOT NULL,
  campos_ativos JSONB NOT NULL DEFAULT '[]',
  campos_obrigatorios JSONB NOT NULL DEFAULT '[]',
  versao_schema VARCHAR(20) DEFAULT '2.1',
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, especialidade_id)
);

CREATE INDEX IF NOT EXISTS idx_config_anamnese_usuario ON config_anamnese_parte1 (usuario_id);

CREATE TABLE IF NOT EXISTS anamneses (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  profissional_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
  especialidade VARCHAR(255),
  parte1_respostas JSONB NOT NULL DEFAULT '{}',
  parte2_respostas JSONB NOT NULL DEFAULT '{}',
  campos_pendentes JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
  versao_schema VARCHAR(20) DEFAULT '2.1',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamneses_paciente ON anamneses (paciente_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_profissional ON anamneses (profissional_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_status ON anamneses (status);
