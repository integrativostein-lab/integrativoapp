-- Banco terapêutico — protocolos, condutas e referências por especialidade
CREATE TABLE IF NOT EXISTS banco_terapeutico (
  id SERIAL PRIMARY KEY,
  especialidade_id INTEGER NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL DEFAULT 'protocolo',
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  contraindicacoes TEXT,
  dosagem_padrao TEXT,
  criado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  ativo SMALLINT DEFAULT 1,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banco_terapeutico_esp ON banco_terapeutico (especialidade_id);
CREATE INDEX IF NOT EXISTS idx_banco_terapeutico_tipo ON banco_terapeutico (tipo);
CREATE INDEX IF NOT EXISTS idx_banco_terapeutico_ativo ON banco_terapeutico (ativo);

CREATE UNIQUE INDEX IF NOT EXISTS idx_banco_terapeutico_unico
  ON banco_terapeutico (especialidade_id, tipo, nome);
