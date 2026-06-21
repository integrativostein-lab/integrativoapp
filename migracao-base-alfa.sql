-- Base PostgreSQL para ambiente alfa (Supabase novo/vazio)
-- Rode antes de migracao-v2.1.sql

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'paciente',
  telefone VARCHAR(30),
  cpf VARCHAR(20),
  registro_profissional VARCHAR(50),
  conselho_classe VARCHAR(50),
  conselho_profissional VARCHAR(50),
  numero_registro VARCHAR(50),
  validacao_conselho_status VARCHAR(20) DEFAULT 'pendente',
  uf_conselho VARCHAR(2),
  registro_abrath VARCHAR(50),
  cnpj VARCHAR(20),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  especialidades JSONB,
  atende_online SMALLINT DEFAULT 0,
  atende_presencial SMALLINT DEFAULT 0,
  atende_domiciliar SMALLINT DEFAULT 0,
  domiciliar_tipo VARCHAR(50),
  domiciliar_valor DECIMAL(10, 2),
  lgpd_consentimento SMALLINT DEFAULT 0,
  lgpd_data_consentimento TIMESTAMPTZ,
  plano VARCHAR(50) DEFAULT 'freemium',
  ativo SMALLINT DEFAULT 1,
  gateway_preferido VARCHAR(50),
  gateway_token TEXT,
  gateway_email VARCHAR(255),
  cnes VARCHAR(20),
  cns_profissional VARCHAR(20),
  cbo VARCHAR(20),
  certificado_digital_senha TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS especialidades (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO especialidades (nome) VALUES
  ('Medicina Integrativa'),
  ('Fitoterapia'),
  ('Ayurveda')
ON CONFLICT (nome) DO NOTHING;

CREATE TABLE IF NOT EXISTS profissional_valores (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidade_id INTEGER REFERENCES especialidades(id) ON DELETE SET NULL,
  valor_online DECIMAL(10, 2) DEFAULT 150,
  valor_presencial DECIMAL(10, 2) DEFAULT 200,
  valor_domicilio DECIMAL(10, 2) DEFAULT 250,
  duracao_minutos INTEGER DEFAULT 60
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prof_valores_usuario_espec
  ON profissional_valores (usuario_id, especialidade_id);

CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  profissional_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  data_agendamento DATE NOT NULL,
  horario_inicio VARCHAR(10),
  horario_fim VARCHAR(10),
  modalidade VARCHAR(20),
  valor DECIMAL(10, 2),
  tipo_sessao VARCHAR(50) DEFAULT 'consulta',
  status VARCHAR(20) DEFAULT 'agendado',
  data_cancelamento TIMESTAMPTZ,
  cancelado_por VARCHAR(30),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
  tipo VARCHAR(50),
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0,
  forma_pagamento VARCHAR(20) DEFAULT 'pix',
  parcelas INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pendente',
  desconto_pix DECIMAL(10, 2) DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profissional_regras_agendamento (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  prazo_cancelamento_horas INTEGER DEFAULT 24,
  multa_falta_valor DECIMAL(10, 2) DEFAULT 0,
  prazo_reagendamento_horas INTEGER DEFAULT 24,
  multa_reagendamento_valor DECIMAL(10, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(255) UNIQUE NOT NULL,
  valor TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS migracao_dados (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo VARCHAR(50),
  arquivo_original TEXT,
  registros_importados INTEGER DEFAULT 0,
  registros_ignorados INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios (tipo);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_prof ON agendamentos (profissional_id);
