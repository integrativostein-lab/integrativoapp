/**
 * ============================================
 * VALIDAÇÃO AUTOMÁTICA DE CONSELHOS PROFISSIONAIS
 * ============================================
 *
 * Endpoints:
 *   GET  /api/validacao/conselhos                 (público)  Lista todos os conselhos suportados
 *   GET  /api/validacao/conselho/:especialidade   (público)  Retorna conselho exigido para a especialidade
 *   POST /api/validacao/verificar                 (público)  Valida { conselho, uf, numero, nome? } durante o cadastro
 *   POST /api/validacao/validar-registro          (auth)     Valida e persiste resultado para o profissional logado
 *   GET  /api/validacao/status/:profissionalId    (auth)     Histórico de validações do profissional
 *
 * IMPORTANTE: Os conselhos brasileiros (CFM, CRM, CFP, CRP, CFF, CREFITO, COREN, CRO, CRN, etc.)
 * NÃO disponibilizam APIs REST públicas oficiais. A validação online aqui:
 *   1) Confere o formato do registro (regex por conselho).
 *   2) Tenta consultar uma URL configurável (CONSELHO_<SIGLA>_API_URL via env) caso esteja
 *      cadastrada — útil para integrações privadas ou serviços terceiros (ex.: Cremesp Open Data).
 *   3) Sempre retorna a URL pública oficial de consulta para o usuário conferir manualmente.
 * Esse desenho deixa claro que a validação é "best-effort" sem prometer o que não pode entregar.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');

// ============================================
// CONFIGURAÇÕES DOS CONSELHOS
// ============================================
const CONSELHOS_CONFIG = {
  ABRATH: {
    nome: 'Associação Brasileira de Terapeutas Holísticos',
    site: 'https://abrath.org.br',
    consultaPublica: 'https://abrath.org.br/area-do-terapeuta/',
    apiEnv: 'ABRATH_API_URL',
    formato: /^\d{5,8}$/,
    formatoLabel: '5 a 8 dígitos',
    requerUF: false,
    especialidades: ['massoterapia', 'reflexologia', 'reiki', 'acupuntura', 'quiropraxia', 'osteopatia', 'aromaterapia', 'florais', 'cromoterapia', 'musicoterapia']
  },
  CRM: {
    nome: 'Conselho Regional de Medicina',
    site: 'https://portal.cfm.org.br',
    consultaPublica: 'https://portal.cfm.org.br/busca-medicos/',
    apiEnv: 'CRM_API_URL',
    formato: /^\d{4,7}$/,
    formatoLabel: '4 a 7 dígitos',
    requerUF: true,
    especialidades: ['medico', 'medicina-integrativa', 'pediatria', 'ginecologia', 'geriatria', 'medicina-de-familia', 'emergencia', 'psiquiatria', 'medicina-tradicional']
  },
  CRP: {
    nome: 'Conselho Regional de Psicologia',
    site: 'https://cadastro.cfp.org.br',
    consultaPublica: 'https://cadastro.cfp.org.br/',
    apiEnv: 'CRP_API_URL',
    formato: /^\d{2}\/\d{4,6}$/,
    formatoLabel: 'XX/NNNNNN (região/número)',
    requerUF: true,
    especialidades: ['psicologo', 'saude-mental', 'psicologia-clinica', 'neuropsicologia']
  },
  CREFITO: {
    nome: 'Conselho Regional de Fisioterapia e Terapia Ocupacional',
    site: 'https://www.coffito.gov.br',
    consultaPublica: 'https://www.coffito.gov.br/nsite/?page_id=2454',
    apiEnv: 'CREFITO_API_URL',
    formato: /^\d{4,6}-?[A-Z]?$/,
    formatoLabel: 'NNNNNN ou NNNNNN-F',
    requerUF: true,
    especialidades: ['fisioterapia', 'hidroterapia', 'equoterapia', 'terapia-ocupacional']
  },
  COREN: {
    nome: 'Conselho Regional de Enfermagem',
    site: 'https://www.cofen.gov.br',
    consultaPublica: 'http://servicos.cofen.gov.br/mobile/index.php',
    apiEnv: 'COREN_API_URL',
    formato: /^\d{4,7}$/,
    formatoLabel: '4 a 7 dígitos',
    requerUF: true,
    especialidades: ['enfermeiro', 'tecnico-enfermagem', 'auxiliar-enfermagem', 'obstetrica']
  },
  CRO: {
    nome: 'Conselho Regional de Odontologia',
    site: 'https://website.cfo.org.br',
    consultaPublica: 'https://website.cfo.org.br/consulta-profissionais/',
    apiEnv: 'CRO_API_URL',
    formato: /^\d{3,6}$/,
    formatoLabel: '3 a 6 dígitos',
    requerUF: true,
    especialidades: ['odontologo', 'dentista', 'ortodontia', 'periodontia', 'endodontia']
  },
  CRN: {
    nome: 'Conselho Regional de Nutricionistas',
    site: 'https://www.cfn.org.br',
    consultaPublica: 'https://www.cfn.org.br/index.php/cnn-publica/',
    apiEnv: 'CRN_API_URL',
    formato: /^\d{4,6}$/,
    formatoLabel: '4 a 6 dígitos',
    requerUF: true,
    especialidades: ['nutricionista', 'nutricao-clinica', 'nutricao-esportiva', 'nutricao-funcional']
  },
  CRF: {
    nome: 'Conselho Regional de Farmácia',
    site: 'https://www.cff.org.br',
    consultaPublica: 'http://www.cff.org.br/pagina.php?id=144',
    apiEnv: 'CRF_API_URL',
    formato: /^\d{4,6}$/,
    formatoLabel: '4 a 6 dígitos',
    requerUF: true,
    especialidades: ['farmaceutico', 'farmacologia', 'farmacia-clinica', 'homeopatia-farmaceutica']
  },
  CRBM: {
    nome: 'Conselho Regional de Biomedicina',
    site: 'https://cfbm.gov.br',
    consultaPublica: 'https://cfbm.gov.br/consulta-publica/',
    apiEnv: 'CRBM_API_URL',
    formato: /^\d{4,6}$/,
    formatoLabel: '4 a 6 dígitos',
    requerUF: true,
    especialidades: ['biomedico', 'analises-clinicas']
  },
  CRBIO: {
    nome: 'Conselho Regional de Biologia',
    site: 'https://www.cfbio.gov.br',
    consultaPublica: 'https://www.cfbio.gov.br/biologo/',
    apiEnv: 'CRBIO_API_URL',
    formato: /^\d{4,6}$/,
    formatoLabel: '4 a 6 dígitos',
    requerUF: true,
    especialidades: ['biologo']
  },
  CREF: {
    nome: 'Conselho Regional de Educação Física',
    site: 'https://www.confef.org.br',
    consultaPublica: 'https://www.confef.org.br/extra/registrados/',
    apiEnv: 'CREF_API_URL',
    formato: /^\d{4,6}-[A-Z]\/[A-Z]{2}$/,
    formatoLabel: 'NNNNNN-G/UF',
    requerUF: true,
    especialidades: ['educador-fisico', 'personal-trainer', 'yoga-instrutor']
  },
  CFTO: {
    nome: 'Conselho Federal dos Terapeutas Ocupacionais (via CREFITO)',
    site: 'https://www.coffito.gov.br',
    consultaPublica: 'https://www.coffito.gov.br/nsite/?page_id=2454',
    apiEnv: 'CFTO_API_URL',
    formato: /^\d{4,6}$/,
    formatoLabel: '4 a 6 dígitos',
    requerUF: true,
    especialidades: ['terapeuta-ocupacional']
  }
};

// Especialidades sem conselho obrigatório no Brasil
const ESPECIALIDADES_LIVRES = [
  'fitoterapia', 'ayurveda', 'mtc', 'yoga', 'xamanismo',
  'jyotish', 'vastu', 'florais-bach', 'apiterapia'
];

// ============================================
// HELPERS
// ============================================
function obterConselhoEspecialidade(especialidade) {
  if (!especialidade) return null;
  const esp = String(especialidade).toLowerCase();
  for (const [sigla, cfg] of Object.entries(CONSELHOS_CONFIG)) {
    if (cfg.especialidades.includes(esp)) return sigla;
  }
  return null;
}

function listarConselhos() {
  return Object.entries(CONSELHOS_CONFIG).map(([sigla, cfg]) => ({
    sigla,
    nome: cfg.nome,
    site: cfg.site,
    consultaPublica: cfg.consultaPublica,
    requerUF: cfg.requerUF,
    formatoLabel: cfg.formatoLabel,
    especialidades: cfg.especialidades
  }));
}

async function tentarConsultaExterna(conselho, payload) {
  const cfg = CONSELHOS_CONFIG[conselho];
  if (!cfg) return null;
  const apiUrl = process.env[cfg.apiEnv];
  if (!apiUrl) return null;
  try {
    const r = await axios.post(apiUrl, payload, { timeout: 6000 });
    return r.data;
  } catch (e) {
    console.warn(`[validacao] API ${conselho} falhou:`, e.message);
    return null;
  }
}

function validacaoOffline(conselho, numero) {
  const cfg = CONSELHOS_CONFIG[conselho];
  if (!cfg) {
    return { valido: false, fonte: 'offline', mensagem: 'Conselho não suportado' };
  }
  const valido = cfg.formato.test(String(numero || '').trim());
  return {
    valido,
    fonte: 'offline',
    mensagem: valido
      ? `Formato válido para ${conselho}. Consulta oficial disponível em ${cfg.consultaPublica}.`
      : `Formato inválido. Esperado: ${cfg.formatoLabel}.`,
    consultaPublica: cfg.consultaPublica
  };
}

async function validarConselho({ conselho, uf, numero, nome }) {
  const sigla = String(conselho || '').toUpperCase();
  const cfg = CONSELHOS_CONFIG[sigla];
  if (!cfg) {
    return { valido: false, mensagem: 'Conselho não suportado', conselho: sigla };
  }
  if (cfg.requerUF && !uf) {
    return { valido: false, mensagem: 'UF é obrigatória para este conselho', conselho: sigla, requerUF: true };
  }

  // 1) Tenta consulta externa (se configurada via env)
  const externo = await tentarConsultaExterna(sigla, { numero, uf, nome });
  if (externo && typeof externo.valido === 'boolean') {
    return {
      conselho: sigla,
      conselhoNome: cfg.nome,
      valido: externo.valido,
      ativo: externo.ativo ?? null,
      profissional: externo.profissional ?? null,
      especialidades: externo.especialidades ?? null,
      mensagem: externo.mensagem || (externo.valido ? 'Registro encontrado' : 'Registro não encontrado'),
      fonte: 'api-externa',
      consultaPublica: cfg.consultaPublica
    };
  }

  // 2) Fallback: validação de formato + link para consulta oficial
  const off = validacaoOffline(sigla, numero);
  return {
    conselho: sigla,
    conselhoNome: cfg.nome,
    ...off
  };
}

// ============================================
// ENDPOINTS PÚBLICOS
// ============================================
router.get('/conselhos', (req, res) => {
  res.json({ conselhos: listarConselhos(), especialidadesLivres: ESPECIALIDADES_LIVRES });
});

router.get('/conselho/:especialidade', (req, res) => {
  const sigla = obterConselhoEspecialidade(req.params.especialidade);
  if (!sigla) {
    return res.json({
      conselho: null,
      mensagem: 'Sem conselho regulamentar obrigatório no Brasil para esta especialidade'
    });
  }
  const cfg = CONSELHOS_CONFIG[sigla];
  res.json({
    conselho: sigla,
    nome: cfg.nome,
    site: cfg.site,
    consultaPublica: cfg.consultaPublica,
    formatoLabel: cfg.formatoLabel,
    requerUF: cfg.requerUF
  });
});

// Verificação pública usada pelo formulário de cadastro (sem JWT)
router.post('/verificar', async (req, res) => {
  try {
    const { conselho, uf, numero, nome } = req.body || {};
    if (!conselho || !numero) {
      return res.status(400).json({ erro: 'Conselho e número são obrigatórios' });
    }
    const resultado = await validarConselho({ conselho, uf, numero, nome });
    res.json(resultado);
  } catch (e) {
    console.error('[validacao/verificar]', e.message);
    res.status(500).json({ erro: 'Erro ao verificar registro' });
  }
});

// ============================================
// ENDPOINTS AUTENTICADOS
// ============================================
router.post('/validar-registro', autenticar, async (req, res) => {
  try {
    const { especialidade, conselho, uf, numero } = req.body || {};
    if (!especialidade || !conselho || !numero) {
      return res.status(400).json({ erro: 'Dados incompletos' });
    }
    const cfg = CONSELHOS_CONFIG[String(conselho).toUpperCase()];
    if (!cfg) return res.status(400).json({ erro: 'Conselho não reconhecido' });
    if (!cfg.especialidades.includes(String(especialidade).toLowerCase())) {
      return res.status(400).json({
        erro: 'Especialidade não compatível com este conselho',
        conselhoCorreto: obterConselhoEspecialidade(especialidade)
      });
    }

    const resultado = await validarConselho({ conselho, uf, numero });

    try {
      await db.query(
        `INSERT INTO validacoes_conselhos (profissional_id, conselho, numero_registro, status, dados_validacao, criado_em)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [req.usuario.id, conselho, numero, resultado.valido ? 'valido' : 'invalido', JSON.stringify(resultado)]
      );
    } catch (errPersist) {
      console.warn('[validar-registro] persistência falhou:', errPersist.message);
    }

    res.json(resultado);
  } catch (e) {
    console.error('[validacao/validar-registro]', e.message);
    res.status(500).json({ erro: 'Erro ao validar registro' });
  }
});

router.get('/status/:profissionalId', autenticar, async (req, res) => {
  try {
    const { profissionalId } = req.params;
    if (req.usuario.id !== parseInt(profissionalId, 10) && req.usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    const result = await db.query(
      `SELECT conselho, numero_registro, status, dados_validacao, criado_em
       FROM validacoes_conselhos
       WHERE profissional_id = $1
       ORDER BY criado_em DESC`,
      [profissionalId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('[validacao/status]', e.message);
    res.status(500).json({ erro: 'Erro ao buscar status' });
  }
});

// ============================================
// JOB CRON (revalidação periódica)
// ============================================
async function atualizarStatusValidacoes() {
  try {
    console.log('🔄 Atualizando status de validações...');
    const result = await db.query(
      `SELECT id, profissional_id, conselho, numero_registro
       FROM validacoes_conselhos
       WHERE status = 'valido' AND criado_em > NOW() - INTERVAL '30 days'`
    );
    for (const v of result.rows) {
      try {
        const novo = await validarConselho({ conselho: v.conselho, numero: v.numero_registro });
        await db.query(
          `UPDATE validacoes_conselhos SET dados_validacao = $1, atualizado_em = NOW() WHERE id = $2`,
          [JSON.stringify(novo), v.id]
        );
      } catch (errOne) {
        console.error(`[validacao-cron] ${v.id}:`, errOne.message);
      }
    }
    console.log('✓ Validações atualizadas');
  } catch (e) {
    console.error('[validacao-cron]', e.message);
  }
}

module.exports = {
  router,
  atualizarStatusValidacoes,
  obterConselhoEspecialidade,
  CONSELHOS_CONFIG
};
