const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ambiente = require('../config/ambiente');

const SCHEMA_VERSAO = '1.0';
const SISTEMA = 'Integrativo.App';

function temBancoConfigurado() {
  return !!(
    process.env.DATABASE_URL
    || (ambiente.modoTeste && process.env.TESTE_DATABASE_URL)
  );
}

function obterDb() {
  if (!temBancoConfigurado()) return null;
  if (!obterDb._instancia) {
    obterDb._instancia = require('../database');
  }
  return obterDb._instancia;
}

const CATEGORIAS = {
  AUTENTICACAO: 'autenticacao',
  CONSENTIMENTO: 'consentimento',
  DADOS_PESSOAIS: 'dados_pessoais',
  DADOS_SENSIVEIS: 'dados_sensiveis_saude',
  ADMINISTRACAO: 'administracao',
  EXPORTACAO: 'exportacao',
  EXCLUSAO: 'exclusao',
  ACESSO_NEGADO: 'acesso_negado',
  SEGURANCA_CLINICA: 'seguranca_clinica',
  SISTEMA: 'sistema'
};

const BASE_LEGAL = {
  CONSENTIMENTO: 'consentimento_art7_I',
  EXECUCAO_CONTRATO: 'execucao_contrato_art7_V',
  OBRIGACAO_LEGAL: 'obrigacao_legal_art7_II',
  LEGITIMO_INTERESSE: 'legitimo_interesse_art7_IX',
  TUTELA_SAUDE: 'tutela_saude_art11_II',
  SEGURANCA: 'seguranca_art46'
};

const CAMPOS_PROIBIDOS = new Set([
  'senha', 'senha_atual', 'nova_senha', 'password', 'token',
  'authorization', 'certificado_digital_senha', 'cpf', 'cns'
]);

function diretorioLogs() {
  return ambiente.garantirDiretorio('logs', 'auditoria-lgpd');
}

function caminhoArquivoDia(dataRef = new Date()) {
  const ano = dataRef.getFullYear();
  const mes = String(dataRef.getMonth() + 1).padStart(2, '0');
  const dia = String(dataRef.getDate()).padStart(2, '0');
  const dir = ambiente.garantirDiretorio('logs', 'auditoria-lgpd', String(ano), mes);
  return path.join(dir, `auditoria-${ano}-${mes}-${dia}.jsonl`);
}

function mascararEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const [local, dominio] = email.split('@');
  if (!dominio) return '***';
  const visivel = local.slice(0, Math.min(2, local.length));
  return `${visivel}***@${dominio}`;
}

function hashIdentificador(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  return crypto.createHash('sha256').update(String(valor)).digest('hex').slice(0, 16);
}

function sanitizarDetalhes(valor, profundidade = 0) {
  if (profundidade > 4) return '[truncado]';
  if (valor === null || valor === undefined) return valor;
  if (Array.isArray(valor)) {
    return valor.slice(0, 20).map((item) => sanitizarDetalhes(item, profundidade + 1));
  }
  if (typeof valor !== 'object') {
    if (typeof valor === 'string' && valor.length > 500) return `${valor.slice(0, 500)}…`;
    return valor;
  }
  const limpo = {};
  Object.entries(valor).forEach(([chave, item]) => {
    if (CAMPOS_PROIBIDOS.has(chave.toLowerCase())) {
      limpo[chave] = '[omitido]';
      return;
    }
    limpo[chave] = sanitizarDetalhes(item, profundidade + 1);
  });
  return limpo;
}

function montarEvento(dados) {
  const agora = new Date();
  const eventoId = dados.evento_id || crypto.randomUUID();
  const usuarioId = dados.usuario_id ?? dados.ator?.id ?? null;
  const usuarioTipo = dados.usuario_tipo ?? dados.ator?.tipo ?? null;
  const email = dados.email ?? dados.ator?.email ?? null;

  return {
    schema: SCHEMA_VERSAO,
    sistema: SISTEMA,
    evento_id: eventoId,
    timestamp: agora.toISOString(),
    categoria: dados.categoria || CATEGORIAS.SISTEMA,
    acao: dados.acao || 'evento',
    base_legal: dados.base_legal || BASE_LEGAL.SEGURANCA,
    finalidade: dados.finalidade || 'registro de auditoria para conformidade LGPD',
    ator: {
      usuario_id: usuarioId,
      usuario_tipo: usuarioTipo,
      email_mascarado: mascararEmail(email),
      email_hash: hashIdentificador(email)
    },
    recurso: dados.recurso || null,
    recurso_id: dados.recurso_id != null ? String(dados.recurso_id) : null,
    rota: dados.rota || null,
    metodo: dados.metodo || null,
    resultado: dados.resultado || 'sucesso',
    ip: dados.ip || null,
    user_agent: dados.user_agent ? String(dados.user_agent).slice(0, 300) : null,
    request_id: dados.request_id || null,
    duracao_ms: typeof dados.duracao_ms === 'number' ? dados.duracao_ms : null,
    detalhes: sanitizarDetalhes(dados.detalhes || {})
  };
}

async function garantirTabelaLogsAuditoria() {
  const db = obterDb();
  if (!db) return false;
  await db.query(`
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
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_logs_auditoria_criado
    ON logs_auditoria (criado_em DESC)
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario
    ON logs_auditoria (usuario_id, criado_em DESC)
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_logs_auditoria_categoria
    ON logs_auditoria (categoria, criado_em DESC)
  `);
  return true;
}

async function garantirInfraestrutura() {
  diretorioLogs();
  if (temBancoConfigurado()) {
    await garantirTabelaLogsAuditoria();
  }
  return true;
}

function gravarArquivo(evento) {
  const arquivo = caminhoArquivoDia(new Date(evento.timestamp));
  const linha = `${JSON.stringify(evento)}\n`;
  fs.appendFileSync(arquivo, linha, { encoding: 'utf8', flag: 'a' });
  return arquivo;
}

async function persistirBanco(evento, arquivoLog) {
  const db = obterDb();
  if (!db) return false;
  await db.query(
    `INSERT INTO logs_auditoria
      (evento_id, categoria, acao, usuario_id, usuario_tipo, recurso, recurso_id,
       base_legal, finalidade, ip, user_agent, rota, metodo, resultado, detalhes, arquivo_log, schema_versao)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (evento_id) DO NOTHING`,
    [
      evento.evento_id,
      evento.categoria,
      evento.acao,
      evento.ator.usuario_id,
      evento.ator.usuario_tipo,
      evento.recurso,
      evento.recurso_id,
      evento.base_legal,
      evento.finalidade,
      evento.ip,
      evento.user_agent,
      evento.rota,
      evento.metodo,
      evento.resultado,
      JSON.stringify(evento.detalhes || {}),
      arquivoLog,
      evento.schema
    ]
  );
  return true;
}

async function registrarAguardar(dados) {
  if (process.env.AUDITORIA_LGPD_ATIVA === 'false') return null;
  const evento = montarEvento(dados);
  const arquivoLog = gravarArquivo(evento);
  if (temBancoConfigurado()) {
    try {
      await persistirBanco(evento, arquivoLog);
    } catch (errorDb) {
      console.warn('[auditoria-lgpd] falha ao espelhar no banco:', errorDb.message);
    }
  }
  return { evento_id: evento.evento_id, arquivo: arquivoLog, evento };
}

function registrar(dados) {
  if (process.env.AUDITORIA_LGPD_ATIVA === 'false') return null;
  const evento = montarEvento(dados);
  setImmediate(async () => {
    try {
      const arquivoLog = gravarArquivo(evento);
      if (temBancoConfigurado()) {
        try {
          await persistirBanco(evento, arquivoLog);
        } catch (errorDb) {
          console.warn('[auditoria-lgpd] falha ao espelhar no banco:', errorDb.message);
        }
      }
    } catch (error) {
      console.error('[auditoria-lgpd] falha ao gravar arquivo:', error.message);
    }
  });
  return evento.evento_id;
}

function normalizarEventoArquivo(evento) {
  return {
    evento_id: evento.evento_id,
    criado_em: evento.timestamp,
    categoria: evento.categoria,
    acao: evento.acao,
    usuario_id: evento.ator?.usuario_id ?? null,
    usuario_tipo: evento.ator?.usuario_tipo ?? null,
    usuario_nome: evento.ator?.email_mascarado || null,
    recurso: evento.recurso,
    recurso_id: evento.recurso_id,
    base_legal: evento.base_legal,
    finalidade: evento.finalidade,
    ip: evento.ip,
    rota: evento.rota,
    metodo: evento.metodo,
    resultado: evento.resultado,
    detalhes: evento.detalhes || {}
  };
}

function filtrarEventos(eventos, { categoria = null, dataInicio = null, dataFim = null } = {}) {
  return eventos.filter((evento) => {
    if (categoria && evento.categoria !== categoria) return false;
    const quando = new Date(evento.criado_em || evento.timestamp);
    if (dataInicio && quando < new Date(dataInicio)) return false;
    if (dataFim && quando > new Date(dataFim)) return false;
    return true;
  });
}

function listarDoArquivo({ limite = 200, offset = 0, categoria = null, dataInicio = null, dataFim = null, data = null } = {}) {
  let brutos = [];

  if (data) {
    brutos = lerArquivoPorData(data).eventos;
  } else {
    const arquivos = listarArquivosDisponiveis().slice(0, 31);
    arquivos.forEach((item) => {
      if (!fs.existsSync(item.caminho_absoluto)) return;
      const linhas = fs.readFileSync(item.caminho_absoluto, 'utf8').split('\n').filter(Boolean);
      linhas.forEach((linha) => {
        try {
          brutos.push(JSON.parse(linha));
        } catch {
          /* linha corrompida */
        }
      });
    });
  }

  const normalizados = filtrarEventos(
    brutos.map(normalizarEventoArquivo),
    { categoria, dataInicio, dataFim }
  ).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));

  return {
    origem: 'arquivo',
    total: normalizados.length,
    eventos: normalizados.slice(offset, offset + limite)
  };
}

async function listar({ limite = 200, offset = 0, categoria = null, dataInicio = null, dataFim = null, data = null } = {}) {
  const db = obterDb();
  if (!db) {
    return listarDoArquivo({ limite, offset, categoria, dataInicio, dataFim, data });
  }

  try {
    await garantirTabelaLogsAuditoria();
    const params = [];
    const filtros = ['1=1'];
    let i = 1;

    if (categoria) {
      filtros.push(`l.categoria = $${i++}`);
      params.push(categoria);
    }
    if (dataInicio) {
      filtros.push(`l.criado_em >= $${i++}`);
      params.push(dataInicio);
    }
    if (dataFim) {
      filtros.push(`l.criado_em <= $${i++}`);
      params.push(dataFim);
    }

    params.push(limite, offset);
    const sql = `
      SELECT l.*, u.nome AS usuario_nome
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE ${filtros.join(' AND ')}
      ORDER BY l.criado_em DESC
      LIMIT $${i++} OFFSET $${i}
    `;
    const r = await db.query(sql, params);
    return {
      origem: 'banco',
      total: r.rows.length,
      eventos: r.rows
    };
  } catch (error) {
    const fallback = listarDoArquivo({ limite, offset, categoria, dataInicio, dataFim, data });
    fallback.aviso = error.message;
    return fallback;
  }
}

function lerArquivoPorData(dataIso) {
  const dataRef = dataIso ? new Date(`${dataIso}T12:00:00`) : new Date();
  const arquivo = caminhoArquivoDia(dataRef);
  if (!fs.existsSync(arquivo)) return { arquivo, eventos: [] };
  const linhas = fs.readFileSync(arquivo, 'utf8').split('\n').filter(Boolean);
  return {
    arquivo,
    eventos: linhas.map((linha) => JSON.parse(linha))
  };
}

function listarArquivosDisponiveis() {
  const base = diretorioLogs();
  const arquivos = [];

  function percorrer(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) percorrer(full);
      else if (entry.name.endsWith('.jsonl')) {
        const stat = fs.statSync(full);
        arquivos.push({
          arquivo: path.relative(base, full).replace(/\\/g, '/'),
          caminho_absoluto: full,
          tamanho_bytes: stat.size,
          modificado_em: stat.mtime.toISOString()
        });
      }
    });
  }

  percorrer(base);
  return arquivos.sort((a, b) => b.modificado_em.localeCompare(a.modificado_em));
}

module.exports = {
  SCHEMA_VERSAO,
  CATEGORIAS,
  BASE_LEGAL,
  temBancoConfigurado,
  garantirInfraestrutura,
  registrar,
  registrarAguardar,
  listar,
  listarDoArquivo,
  normalizarEventoArquivo,
  lerArquivoPorData,
  listarArquivosDisponiveis,
  mascararEmail,
  montarEvento,
  gravarArquivo,
  caminhoArquivoDia
};
