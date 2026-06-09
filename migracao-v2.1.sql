-- ============================================
-- MIGRAÇÕES PARA INTEGRATIVO.APP v2.1
-- ============================================

-- 1. Tabela de cache de protocolos científicos
CREATE TABLE IF NOT EXISTS cache_protocolos (
  id SERIAL PRIMARY KEY,
  especialidade VARCHAR(255) UNIQUE NOT NULL,
  dados JSONB NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_especialidade ON cache_protocolos(especialidade);

-- 2. Tabela de validações de conselhos profissionais
CREATE TABLE IF NOT EXISTS validacoes_conselhos (
  id SERIAL PRIMARY KEY,
  profissional_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  conselho VARCHAR(50) NOT NULL,
  numero_registro VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, valido, invalido, expirado
  dados_validacao JSONB,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validacoes_profissional ON validacoes_conselhos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_validacoes_conselho ON validacoes_conselhos(conselho);

-- 3. Adicionar coluna de conselho profissional na tabela usuarios (se não existir)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS conselho_profissional VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero_registro VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS validacao_conselho_status VARCHAR(20) DEFAULT 'pendente';

-- 4. Tabela de configurações de gateways por profissional
CREATE TABLE IF NOT EXISTS gateway_configs (
  id SERIAL PRIMARY KEY,
  profissional_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  gateway VARCHAR(50) NOT NULL, -- pagseguro, pagbank, asaas, ton, etc
  configuracoes JSONB NOT NULL, -- dados criptografados
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_profissional ON gateway_configs(profissional_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gateway_unico ON gateway_configs(profissional_id, gateway);

-- 5. Tabela de assinaturas (modelo anual)
CREATE TABLE IF NOT EXISTS assinaturas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plano VARCHAR(50) NOT NULL, -- pro, premium, enterprise, coworking
  valor_anual DECIMAL(10, 2) NOT NULL,
  valor_pago DECIMAL(10, 2) NOT NULL,
  forma_pagamento VARCHAR(20) NOT NULL, -- pix, cartao
  parcelas INTEGER DEFAULT 1,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'ativa', -- ativa, cancelada, expirada, suspensa
  cancelada_em TIMESTAMP,
  motivo_cancelamento TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assinatura_usuario ON assinaturas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_assinatura_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinatura_data_fim ON assinaturas(data_fim);

-- 6. Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS historico_pagamentos (
  id SERIAL PRIMARY KEY,
  assinatura_id INTEGER NOT NULL REFERENCES assinaturas(id) ON DELETE CASCADE,
  numero_parcela INTEGER,
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, pago, atrasado, cancelado
  gateway_id VARCHAR(255), -- ID da transação no gateway
  gateway_resposta JSONB,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagamento_assinatura ON historico_pagamentos(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_status ON historico_pagamentos(status);

-- 7. Tabela de integrações FHIR
CREATE TABLE IF NOT EXISTS fhir_exports (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_recurso VARCHAR(50) NOT NULL, -- Patient, Appointment, Observation, etc
  recurso_id INTEGER NOT NULL,
  fhir_json JSONB NOT NULL,
  url_fhir VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fhir_usuario ON fhir_exports(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fhir_tipo ON fhir_exports(tipo_recurso);

-- 8. Tabela de referências de protocolos
CREATE TABLE IF NOT EXISTS referencias_protocolos (
  id SERIAL PRIMARY KEY,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,
  especialidade VARCHAR(255) NOT NULL,
  protocolo_fiocruz VARCHAR(255),
  protocolo_redepics VARCHAR(255),
  protocolo_bireme VARCHAR(255),
  diferencas TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referencias_agendamento ON referencias_protocolos(agendamento_id);

-- 9. Adicionar coluna de desconto PIX na tabela pagamentos (se não existir)
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS desconto_pix DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(20) DEFAULT 'cartao';

-- 10. Criar view para dashboard de assinaturas
CREATE OR REPLACE VIEW vw_assinaturas_ativas AS
SELECT 
  a.id,
  a.usuario_id,
  u.nome,
  u.email,
  a.plano,
  a.valor_anual,
  a.data_inicio,
  a.data_fim,
  EXTRACT(DAY FROM a.data_fim - NOW()) as dias_restantes,
  a.status
FROM assinaturas a
JOIN usuarios u ON a.usuario_id = u.id
WHERE a.status = 'ativa' AND a.data_fim > NOW();

-- 11. Criar view para dashboard de pagamentos
CREATE OR REPLACE VIEW vw_pagamentos_pendentes AS
SELECT 
  hp.id,
  hp.assinatura_id,
  a.usuario_id,
  u.nome,
  hp.valor,
  hp.data_vencimento,
  EXTRACT(DAY FROM hp.data_vencimento - NOW()) as dias_para_vencer,
  hp.status
FROM historico_pagamentos hp
JOIN assinaturas a ON hp.assinatura_id = a.id
JOIN usuarios u ON a.usuario_id = u.id
WHERE hp.status IN ('pendente', 'atrasado');

-- 12. Criar função para calcular dias restantes de assinatura
CREATE OR REPLACE FUNCTION dias_restantes_assinatura(usuario_id_param INTEGER)
RETURNS INTEGER AS $$
SELECT EXTRACT(DAY FROM data_fim - NOW())::INTEGER
FROM assinaturas
WHERE usuario_id = usuario_id_param AND status = 'ativa'
LIMIT 1;
$$ LANGUAGE SQL;

-- 13. Criar função para verificar se assinatura está ativa
CREATE OR REPLACE FUNCTION assinatura_ativa(usuario_id_param INTEGER)
RETURNS BOOLEAN AS $$
SELECT EXISTS(
  SELECT 1 FROM assinaturas
  WHERE usuario_id = usuario_id_param 
  AND status = 'ativa' 
  AND data_fim > NOW()
);
$$ LANGUAGE SQL;

-- 14. Criar trigger para atualizar status de assinatura expirada
CREATE OR REPLACE FUNCTION atualizar_assinaturas_expiradas()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assinaturas
  SET status = 'expirada'
  WHERE status = 'ativa' AND data_fim < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_assinaturas_expiradas
AFTER INSERT ON assinaturas
FOR EACH STATEMENT
EXECUTE FUNCTION atualizar_assinaturas_expiradas();

-- 15. Adicionar coluna de especialidades no usuário
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS especialidades_json JSONB DEFAULT '[]'::jsonb;

-- Confirmar execução
SELECT 'Migrações concluídas com sucesso!' as status;
