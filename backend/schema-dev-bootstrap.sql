-- ============================================================
-- SCHEMA DE BOOTSTRAP PARA DESENVOLVIMENTO LOCAL
-- ============================================================
-- ATENCAO: este NAO e o schema oficial de producao.
--
-- O schema completo/autoritativo vive no Supabase remoto. Este arquivo
-- cria apenas o subconjunto minimo de tabelas necessario para rodar os
-- fluxos de autenticacao (cadastro de paciente/profissional e login)
-- em um Postgres local, permitindo desenvolvimento e testes sem depender
-- do banco remoto.
--
-- Uso (Postgres local):
--   psql "$DATABASE_URL" -f backend/schema-dev-bootstrap.sql
--   psql "$DATABASE_URL" -f migracao-v2.1.sql   # migracao incremental por cima
--
-- As tabelas "agendamentos" e "pagamentos" abaixo sao stubs, presentes
-- apenas para satisfazer as FKs/ALTERs de migracao-v2.1.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'paciente',
  telefone VARCHAR(50),
  especialidades TEXT,
  atende_online INTEGER DEFAULT 0,
  atende_presencial INTEGER DEFAULT 0,
  atende_domiciliar INTEGER DEFAULT 0,
  domiciliar_tipo VARCHAR(50),
  domiciliar_valor DECIMAL(10,2),
  lgpd_consentimento INTEGER DEFAULT 0,
  lgpd_data_consentimento TIMESTAMP,
  plano VARCHAR(50) DEFAULT 'freemium',
  ativo BOOLEAN DEFAULT TRUE,
  assinatura_ativa INTEGER DEFAULT 0,
  data_expiracao_assinatura DATE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profissionais (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(255) UNIQUE NOT NULL,
  valor TEXT
);

CREATE TABLE IF NOT EXISTS especialidades (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL
);

-- Stubs para as FKs/ALTERs de migracao-v2.1.sql
CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER,
  profissional_id INTEGER,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER,
  valor DECIMAL(10,2),
  criado_em TIMESTAMP DEFAULT NOW()
);
