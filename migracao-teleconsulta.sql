-- Conformidade telessaúde — Lei 14.510/2022 · CFM 2.314/2022 · LGPD
CREATE TABLE IF NOT EXISTS teleconsultas_sessoes (
  id SERIAL PRIMARY KEY,
  agendamento_id INTEGER NOT NULL UNIQUE REFERENCES agendamentos(id) ON DELETE CASCADE,
  paciente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  profissional_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  consentimento_paciente_em TIMESTAMPTZ,
  consentimento_profissional_em TIMESTAMPTZ,
  consentimento_gravacao_paciente_em TIMESTAMPTZ,
  consentimento_gravacao_prof_em TIMESTAMPTZ,
  limites_informados_paciente BOOLEAN DEFAULT FALSE,
  limites_informados_prof BOOLEAN DEFAULT FALSE,
  direito_presencial_reconhecido BOOLEAN DEFAULT FALSE,
  optou_atendimento_presencial BOOLEAN DEFAULT FALSE,
  consentimento_ip TEXT,
  consentimento_user_agent TEXT,
  inicio_em TIMESTAMPTZ,
  fim_em TIMESTAMPTZ,
  duracao_segundos INTEGER,
  status VARCHAR(40) NOT NULL DEFAULT 'pendente_consentimento',
  notas_encerramento TEXT,
  bases_legais JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teleconsultas_agendamento ON teleconsultas_sessoes (agendamento_id);
CREATE INDEX IF NOT EXISTS idx_teleconsultas_paciente ON teleconsultas_sessoes (paciente_id);
CREATE INDEX IF NOT EXISTS idx_teleconsultas_prof ON teleconsultas_sessoes (profissional_id);
