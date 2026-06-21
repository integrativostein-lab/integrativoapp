const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const auditoria = require('../servicos/auditoria-lgpd');
const ambiente = require('../config/ambiente');
const { processarAssinaturasExpiradas } = require('../servicos/assinaturas-ciclo');
const {
  limiteBibliotecasPorPlano,
  montarBibliotecasCadastro
} = require('../utils/bibliotecas');
const { garantirValoresPadrao } = require('../utils/profissional-valores');

const VERSAO_CONSENTIMENTO_PESQUISA = 'pesquisa-clinica-anonimizada-2026-06-13';
const VERSAO_CONSENTIMENTO_LGPD = '2026-06-20';

const METADADOS_CONSENTIMENTOS = {
  termos_privacidade: {
    finalidade: 'Cadastro, autenticação e operação da plataforma conforme Termos e Privacidade',
    base_legal: 'execucao_contrato_art7_V'
  },
  dados_saude: {
    finalidade: 'Agendamento, anamnese, prontuário, prescrições e continuidade do cuidado',
    base_legal: 'tutela_saude_art11_II'
  },
  dados_profissionais: {
    finalidade: 'Validação de habilitação profissional e operação clínica',
    base_legal: 'execucao_contrato_art7_V'
  },
  arquivamento_rastreabilidade: {
    finalidade: 'Arquivamento assistencial, trilha de auditoria e segurança',
    base_legal: 'legitimo_interesse_art7_IX'
  },
  pesquisa_anonimizada: {
    finalidade: 'Pesquisa clínica com dados anonimizados',
    base_legal: 'consentimento_art7_I'
  },
  notificacoes: {
    finalidade: 'Lembretes e comunicações operacionais',
    base_legal: 'consentimento_art7_I'
  },
  teleconsulta_gravacao: {
    finalidade: 'Gravação de teleconsulta quando autorizada por todos',
    base_legal: 'consentimento_art7_I'
  },
  compartilhamento_fhir: {
    finalidade: 'Interoperabilidade clínica FHIR/RNDS quando solicitado',
    base_legal: 'consentimento_art7_I'
  },
  cobranca_assinatura: {
    finalidade: 'Cobrança de assinatura, comissões e gestão do plano',
    base_legal: 'execucao_contrato_art7_V'
  }
};

const CONSENTIMENTOS_OBRIGATORIOS = {
  paciente: ['termos_privacidade', 'dados_saude', 'arquivamento_rastreabilidade'],
  profissional: ['termos_privacidade', 'dados_saude', 'dados_profissionais', 'arquivamento_rastreabilidade', 'cobranca_assinatura']
};

async function garantirTabelaConsentimentosLgpd() {
  await db.query(`
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
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_consentimentos_lgpd_usuario
    ON consentimentos_lgpd (usuario_id, tipo, criado_em DESC)
  `);
}

function validarConsentimentosObrigatorios(tipoUsuario, consentimentos) {
  const obrigatorios = CONSENTIMENTOS_OBRIGATORIOS[tipoUsuario] || CONSENTIMENTOS_OBRIGATORIOS.paciente;
  const faltando = obrigatorios.filter((tipo) => !consentimentos || consentimentos[tipo] !== true);
  return faltando;
}

async function salvarConsentimentosLote({ usuarioId, consentimentos, req, origem, tipoUsuario, exigirObrigatorios = false }) {
  if (!consentimentos || typeof consentimentos !== 'object') return;
  await garantirTabelaConsentimentosLgpd();

  if (exigirObrigatorios) {
    const faltando = validarConsentimentosObrigatorios(tipoUsuario, consentimentos);
    if (faltando.length) {
      const erro = new Error(`Consentimentos obrigatórios pendentes: ${faltando.join(', ')}`);
      erro.code = 'CONSENTIMENTO_OBRIGATORIO';
      throw erro;
    }
  }

  for (const [tipo, consentiu] of Object.entries(consentimentos)) {
    const meta = METADADOS_CONSENTIMENTOS[tipo];
    if (!meta) continue;

    await db.query(
      `INSERT INTO consentimentos_lgpd
         (usuario_id, tipo, consentiu, versao, finalidade, base_legal, ip, user_agent, origem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        usuarioId,
        tipo,
        Boolean(consentiu),
        VERSAO_CONSENTIMENTO_LGPD,
        meta.finalidade,
        meta.base_legal,
        req.ip || null,
        req.get('user-agent') || null,
        origem
      ]
    );

    auditoria.registrar({
      categoria: auditoria.CATEGORIAS.CONSENTIMENTO,
      acao: consentiu ? 'consentimento_concedido' : 'consentimento_revogado',
      base_legal: meta.base_legal,
      finalidade: meta.finalidade,
      usuario_id: usuarioId,
      recurso: 'consentimento_lgpd',
      recurso_id: tipo,
      rota: req.originalUrl,
      metodo: req.method,
      ip: req.ip,
      user_agent: req.get('user-agent'),
      detalhes: { tipo, origem, versao: VERSAO_CONSENTIMENTO_LGPD }
    });

    if (tipo === 'pesquisa_anonimizada') {
      await salvarConsentimentoPesquisa({
        usuarioId,
        consentiu: Boolean(consentiu),
        req,
        origem
      });
    }
  }
}

async function obterEstadoConsentimentos(usuarioId) {
  await garantirTabelaConsentimentosLgpd();
  const r = await db.query(
    `SELECT DISTINCT ON (tipo)
       tipo, consentiu, versao, finalidade, base_legal, origem, criado_em
     FROM consentimentos_lgpd
     WHERE usuario_id = $1
     ORDER BY tipo, criado_em DESC`,
    [usuarioId]
  );
  const atual = {};
  r.rows.forEach((row) => { atual[row.tipo] = row; });
  return atual;
}

async function garantirTabelaConsentimentoPesquisa() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS consentimentos_pesquisa (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL,
      consentiu BOOLEAN NOT NULL DEFAULT false,
      finalidade VARCHAR(120) NOT NULL,
      versao VARCHAR(120) NOT NULL,
      ip VARCHAR(80),
      user_agent TEXT,
      origem VARCHAR(80),
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_consentimentos_pesquisa_usuario
    ON consentimentos_pesquisa (usuario_id, criado_em DESC)
  `);
}

async function salvarConsentimentoPesquisa({ usuarioId, consentiu, req, origem }) {
  try {
    await garantirTabelaConsentimentoPesquisa();
    await db.query(
      `INSERT INTO consentimentos_pesquisa
         (usuario_id, consentiu, finalidade, versao, ip, user_agent, origem, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        usuarioId,
        Boolean(consentiu),
        'uso de dados anonimizados de pacientes para apoio a pesquisas clinicas',
        VERSAO_CONSENTIMENTO_PESQUISA,
        req.ip || null,
        req.get('user-agent') || null,
        origem
      ]
    );
    auditoria.registrar({
      categoria: auditoria.CATEGORIAS.CONSENTIMENTO,
      acao: consentiu ? 'consentimento_concedido' : 'consentimento_negado',
      base_legal: auditoria.BASE_LEGAL.CONSENTIMENTO,
      finalidade: 'uso de dados anonimizados de pacientes para apoio a pesquisas clinicas',
      usuario_id: usuarioId,
      recurso: 'consentimentos_pesquisa',
      recurso_id: usuarioId,
      rota: req.originalUrl,
      metodo: req.method,
      ip: req.ip || null,
      user_agent: req.get('user-agent') || null,
      detalhes: { origem, versao: VERSAO_CONSENTIMENTO_PESQUISA }
    });
  } catch (error) {
    console.warn('[consentimento-pesquisa] não foi possível registrar:', error.message);
  }
}

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

router.post('/cadastro', async (req, res) => {
  try {
    const {
      nome, email, senha, tipo, especialidades,
      atende_online, atende_presencial, atende_domiciliar,
      domiciliar_tipo, domiciliar_valor, lgpd_consentimento,
      pesquisa_clinica_consentimento, token_convite, consentimentos
    } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ erro: 'Email inválido' });
    if (typeof senha !== 'string' || senha.length < 8) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres' });
    }

    const TIPOS_PUBLICOS = ['paciente', 'profissional'];
    const tipoFinal = TIPOS_PUBLICOS.includes(tipo) ? tipo : 'paciente';

    const mapaConsentimentos = consentimentos && typeof consentimentos === 'object'
      ? consentimentos
      : {
        termos_privacidade: Boolean(lgpd_consentimento),
        dados_saude: Boolean(lgpd_consentimento),
        arquivamento_rastreabilidade: Boolean(lgpd_consentimento),
        pesquisa_anonimizada: Boolean(pesquisa_clinica_consentimento),
        notificacoes: false
      };
    const faltando = validarConsentimentosObrigatorios(tipoFinal, mapaConsentimentos);
    if (faltando.length) {
      return res.status(400).json({
        erro: 'É necessário aceitar todas as autorizações obrigatórias de privacidade.',
        faltando
      });
    }

    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) return res.status(400).json({ erro: 'Email já cadastrado' });
    
    const hash = await bcrypt.hash(senha, 12);

    // Verificar se veio de convite do Super Admin
    let convite = null;
    if (token_convite) {
      const r = await db.query("SELECT valor FROM configuracoes WHERE chave = $1", ['convite_' + token_convite]);
      if (r.rows.length > 0) {
        convite = JSON.parse(r.rows[0].valor);
        // Marcar convite como usado
        await db.query("UPDATE configuracoes SET valor = $1 WHERE chave = $2", [JSON.stringify({ ...convite, usado: true }), 'convite_' + token_convite]);
      }
    }

    const result = await db.query(
      `INSERT INTO usuarios (nome, email, senha, tipo, especialidades, atende_online, atende_presencial, atende_domiciliar, domiciliar_tipo, domiciliar_valor, lgpd_consentimento, lgpd_data_consentimento, plano) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12) RETURNING id`,
      [
        nome, email, hash, tipoFinal,
        especialidades || null,
        atende_online || 0, atende_presencial || 0,
        atende_domiciliar || 0, domiciliar_tipo || null, domiciliar_valor || null,
        (mapaConsentimentos.termos_privacidade && mapaConsentimentos.dados_saude) ? 1 : 0,
        convite ? convite.plano : 'freemium'
      ]
    );

    if (tipoFinal === 'paciente') {
      await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [result.rows[0].id]);
    } else if (tipoFinal === 'profissional') {
      await garantirValoresPadrao(result.rows[0].id).catch((err) => {
        console.warn('[auth/cadastro] valores padrão não criados:', err.message);
      });
    }

    await salvarConsentimentosLote({
      usuarioId: result.rows[0].id,
      consentimentos: mapaConsentimentos,
      req,
      origem: `cadastro-${tipoFinal}`,
      tipoUsuario: tipoFinal,
      exigirObrigatorios: true
    });

    // Se veio de convite com benefícios, criar assinatura
    if (convite && convite.vitalicio) {
      await db.query("INSERT INTO assinaturas (usuario_id, plano, tipo_ciclo, valor, data_inicio, data_expiracao, status) VALUES ($1, $2, 'vitalicio', 0, NOW(), '2099-12-31', 'ativa')", [result.rows[0].id, convite.plano]);
      await db.query("UPDATE usuarios SET assinatura_ativa = 1, data_expiracao_assinatura = '2099-12-31' WHERE id = $1", [result.rows[0].id]);
    }

    const token = jwt.sign({ id: result.rows[0].id, email, tipo: tipoFinal }, process.env.JWT_SECRET, { expiresIn: '7d' });
    auditoria.registrar({
      categoria: auditoria.CATEGORIAS.AUTENTICACAO,
      acao: 'cadastro',
      base_legal: lgpd_consentimento ? auditoria.BASE_LEGAL.CONSENTIMENTO : auditoria.BASE_LEGAL.EXECUCAO_CONTRATO,
      finalidade: 'criação de conta e prestação do serviço',
      usuario_id: result.rows[0].id,
      usuario_tipo: tipoFinal,
      email,
      recurso: 'usuario',
      recurso_id: result.rows[0].id,
      rota: req.originalUrl,
      metodo: req.method,
      ip: req.ip,
      user_agent: req.get('user-agent'),
      detalhes: { tipo: tipoFinal, lgpd_consentimento: Boolean(lgpd_consentimento) }
    });
    res.status(201).json({
      mensagem: 'Cadastro realizado!',
      token,
      usuario: { id: result.rows[0].id, nome, email, tipo: tipoFinal },
      convite: convite ? {
        plano: convite.plano,
        vitalicio: convite.vitalicio,
        isentar_taxa: convite.isentar_taxa,
        isentar_assinatura: convite.isentar_assinatura
      } : null
    });
  } catch (e) {
    console.error('[auth/cadastro]', e.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

function respostaUsuarioDemo(payload) {
  const planoDemo = payload.tipo === 'profissional' ? 'pro' : 'freemium';
  return {
    valido: true,
    usuario: {
      id: payload.id,
      nome: payload.tipo === 'profissional' ? 'Dr. João Integrativo' : 'Maria Paciente',
      email: payload.email,
      tipo: payload.tipo,
      plano: planoDemo
    }
  };
}

function tokenDemoValido(payload) {
  return payload?.demo === true && ambiente.modoTeste;
}

function idUsuarioNumerico(id) {
  return Number.isInteger(Number(id)) && String(id).match(/^\d+$/);
}

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });

    if (ambiente.modoTeste && senha === 'demo123') {
      const demoDb = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      if (demoDb.rows.length > 0) {
        const u = demoDb.rows[0];
        if (u.ativo && (await bcrypt.compare(senha, u.senha))) {
          const token = jwt.sign({ id: u.id, email: u.email, tipo: u.tipo }, process.env.JWT_SECRET, { expiresIn: '7d' });
          if (idUsuarioNumerico(u.id)) {
            await processarAssinaturasExpiradas({ usuarioId: Number(u.id) }).catch((err) => {
              console.error('[assinaturas-ciclo/login-demo]', err.message);
            });
          }
          const perfil = await db.query('SELECT id, nome, email, tipo, plano FROM usuarios WHERE id = $1', [u.id]);
          const usuario = perfil.rows[0] || u;
          return res.json({
            mensagem: 'Login demo realizado!',
            token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo, plano: usuario.plano }
          });
        }
      }

      const usuariosDemo = {
        'profissional@demo.com': { id: 'demo-profissional', nome: 'Dr. João Integrativo', tipo: 'profissional', plano: 'pro' },
        'paciente@demo.com': { id: 'demo-paciente', nome: 'Maria Paciente', tipo: 'paciente', plano: 'freemium' }
      };
      const demo = usuariosDemo[email];
      if (demo) {
        const token = jwt.sign({ id: demo.id, email, tipo: demo.tipo, demo: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ mensagem: 'Login demo realizado!', token, usuario: { ...demo, email } });
      }
    }
    
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      auditoria.registrar({
        categoria: auditoria.CATEGORIAS.AUTENTICACAO,
        acao: 'login_falha',
        base_legal: auditoria.BASE_LEGAL.SEGURANCA,
        finalidade: 'prevenção a acesso indevido',
        email,
        recurso: 'sessao',
        rota: req.originalUrl,
        metodo: req.method,
        resultado: 'falha',
        ip: req.ip,
        user_agent: req.get('user-agent'),
        detalhes: { motivo: 'email_nao_encontrado' }
      });
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }
    
    const u = result.rows[0];
    if (!u.ativo) {
      auditoria.registrar({
        categoria: auditoria.CATEGORIAS.AUTENTICACAO,
        acao: 'login_negado',
        base_legal: auditoria.BASE_LEGAL.SEGURANCA,
        finalidade: 'bloqueio de conta inativa',
        usuario_id: u.id,
        usuario_tipo: u.tipo,
        email: u.email,
        recurso: 'sessao',
        rota: req.originalUrl,
        metodo: req.method,
        resultado: 'negado',
        ip: req.ip,
        user_agent: req.get('user-agent')
      });
      return res.status(403).json({ erro: 'Conta desativada' });
    }
    
    const ok = await bcrypt.compare(senha, u.senha);
    if (!ok) {
      auditoria.registrar({
        categoria: auditoria.CATEGORIAS.AUTENTICACAO,
        acao: 'login_falha',
        base_legal: auditoria.BASE_LEGAL.SEGURANCA,
        finalidade: 'prevenção a acesso indevido',
        usuario_id: u.id,
        usuario_tipo: u.tipo,
        email: u.email,
        recurso: 'sessao',
        rota: req.originalUrl,
        metodo: req.method,
        resultado: 'falha',
        ip: req.ip,
        user_agent: req.get('user-agent'),
        detalhes: { motivo: 'senha_incorreta' }
      });
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }
    
    const token = jwt.sign({ id: u.id, email: u.email, tipo: u.tipo }, process.env.JWT_SECRET, { expiresIn: '7d' });
    if (idUsuarioNumerico(u.id)) {
      await processarAssinaturasExpiradas({ usuarioId: Number(u.id) }).catch((err) => {
        console.error('[assinaturas-ciclo/login]', err.message);
      });
    }
    const usuarioAtual = await db.query('SELECT id, nome, email, tipo, plano FROM usuarios WHERE id = $1', [u.id]);
    const perfil = usuarioAtual.rows[0] || u;
    auditoria.registrar({
      categoria: auditoria.CATEGORIAS.AUTENTICACAO,
      acao: 'login_sucesso',
      base_legal: auditoria.BASE_LEGAL.EXECUCAO_CONTRATO,
      finalidade: 'autenticação de usuário',
      usuario_id: u.id,
      usuario_tipo: u.tipo,
      email: u.email,
      recurso: 'sessao',
      rota: req.originalUrl,
      metodo: req.method,
      ip: req.ip,
      user_agent: req.get('user-agent')
    });
    res.json({ mensagem: 'Login realizado!', token, usuario: { id: perfil.id, nome: perfil.nome, email: perfil.email, tipo: perfil.tipo, plano: perfil.plano } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/verificar', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (tokenDemoValido(d)) {
      return res.json(respostaUsuarioDemo(d));
    }
    if (idUsuarioNumerico(d.id)) {
      await processarAssinaturasExpiradas({ usuarioId: Number(d.id) }).catch((err) => {
        console.error('[assinaturas-ciclo/verificar]', err.message);
      });
    }
    const result = await db.query('SELECT id, nome, email, tipo, plano FROM usuarios WHERE id = $1', [d.id]);
    if (result.rows.length === 0) return res.status(401).json({ erro: 'Usuário não encontrado' });
    res.json({ valido: true, usuario: result.rows[0] });
  } catch (e) {
    if (ambiente.modoTeste) {
      return res.status(401).json({ erro: 'Token inválido', motivo: e.message });
    }
    res.status(401).json({ erro: 'Token inválido' });
  }
});

router.post('/pesquisa-consentimento', autenticar, async (req, res) => {
  const { consentiu } = req.body || {};
  await salvarConsentimentosLote({
    usuarioId: req.usuario.id,
    consentimentos: { pesquisa_anonimizada: consentiu === true || consentiu === 1 },
    req,
    origem: 'painel-usuario',
    tipoUsuario: req.usuario.tipo === 'profissional' ? 'profissional' : 'paciente'
  });
  res.json({
    mensagem: consentiu
      ? 'Consentimento de pesquisa clínica anonimizada registrado.'
      : 'Consentimento de pesquisa clínica anonimizada revogado.'
  });
});

router.get('/consentimentos', autenticar, async (req, res) => {
  const atual = await obterEstadoConsentimentos(req.usuario.id);
  const historico = await db.query(
    `SELECT tipo, consentiu, versao, finalidade, base_legal, origem, criado_em
     FROM consentimentos_lgpd
     WHERE usuario_id = $1
     ORDER BY criado_em DESC
     LIMIT 100`,
    [req.usuario.id]
  );
  res.json({
    versao: VERSAO_CONSENTIMENTO_LGPD,
    atual,
    historico: historico.rows,
    tipos: METADADOS_CONSENTIMENTOS,
    obrigatorios: CONSENTIMENTOS_OBRIGATORIOS
  });
});

router.post('/consentimentos', autenticar, async (req, res) => {
  try {
    const { consentimentos, origem } = req.body || {};
    if (!consentimentos || typeof consentimentos !== 'object') {
      return res.status(400).json({ erro: 'Informe as autorizações a registrar.' });
    }
    const tipoUsuario = ['profissional', 'admin', 'super_admin'].includes(req.usuario.tipo)
      ? 'profissional'
      : 'paciente';
    await salvarConsentimentosLote({
      usuarioId: req.usuario.id,
      consentimentos,
      req,
      origem: origem || 'painel-privacidade',
      tipoUsuario
    });
    const atual = await obterEstadoConsentimentos(req.usuario.id);
    res.json({ mensagem: 'Autorizações atualizadas.', atual });
  } catch (error) {
    if (error.code === 'CONSENTIMENTO_OBRIGATORIO') {
      return res.status(400).json({ erro: error.message });
    }
    console.error('[auth/consentimentos]', error.message);
    res.status(500).json({ erro: 'Erro ao salvar autorizações.' });
  }
});

// ============================================
// CADASTRO ESPECÍFICO DE PROFISSIONAL
// ============================================
// Cria usuário tipo='profissional' e (opcional) já dispara validação no conselho
const PLANOS_CADASTRO_PROF = ['freemium', 'guardioes_floresta', 'pro', 'clinic', 'premium'];

function validarSenhaCadastroProfissional(senha) {
  if (typeof senha !== 'string' || senha.length < 12) {
    return 'Senha deve ter no mínimo 12 caracteres';
  }
  if (!/[A-Za-z]/.test(senha)) return 'Senha deve incluir letras';
  if (!/\d/.test(senha)) return 'Senha deve incluir números';
  if (!/[^A-Za-z0-9\s]/.test(senha)) return 'Senha deve incluir símbolos';
  return null;
}

router.post('/cadastro-profissional', async (req, res) => {
  try {
    const {
      nome, email, senha, telefone,
      especialidade, especialidade_nome, bibliotecas_selecionadas,
      conselho, uf_conselho, numero_registro,
      registro_abrath, tem_abrath, abrath_verificada,
      cpf, data_nascimento, cep, logradouro, numero_endereco, complemento, cidade, estado,
      tem_registro_profissional, ocupacao_secundaria, ocupacao_terciaria,
      modalidade_atendimento, renovacao_automatica, plano,
      especialidades_adicionais, gateway, email_corporativo,
      prescricao_eletronica, lgpd_consentimento, pesquisa_clinica_consentimento, consentimentos
    } = req.body;

    if (!nome || !email || !senha || !especialidade) {
      return res.status(400).json({ erro: 'Nome, email, senha e especialidade são obrigatórios' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ erro: 'Email inválido' });
    const erroSenha = validarSenhaCadastroProfissional(senha);
    if (erroSenha) return res.status(400).json({ erro: erroSenha });

    const planoInicial = PLANOS_CADASTRO_PROF.includes(plano) ? plano : 'freemium';
    const modalidade = modalidade_atendimento || 'ambos';
    const atendeOnline = modalidade === 'presencial' ? 0 : 1;
    const atendePresencial = modalidade === 'online' ? 0 : 1;

    const adicionaisInformados = Array.isArray(especialidades_adicionais)
      ? especialidades_adicionais
      : [ocupacao_secundaria, ocupacao_terciaria].filter(Boolean);

    const mapaConsentimentos = consentimentos && typeof consentimentos === 'object'
      ? consentimentos
      : {
        termos_privacidade: Boolean(lgpd_consentimento),
        dados_saude: Boolean(lgpd_consentimento),
        dados_profissionais: Boolean(lgpd_consentimento),
        arquivamento_rastreabilidade: Boolean(lgpd_consentimento),
        cobranca_assinatura: Boolean(lgpd_consentimento),
        pesquisa_anonimizada: Boolean(pesquisa_clinica_consentimento),
        notificacoes: false
      };
    const faltando = validarConsentimentosObrigatorios('profissional', mapaConsentimentos);
    if (faltando.length) {
      return res.status(400).json({
        erro: 'É necessário aceitar todas as autorizações obrigatórias de privacidade.',
        faltando
      });
    }

    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) return res.status(400).json({ erro: 'Email já cadastrado' });

    const hash = await bcrypt.hash(senha, 12);
    const limiteBibliotecas = limiteBibliotecasPorPlano(planoInicial);
    const montagem = montarBibliotecasCadastro({
      especialidade,
      especialidadeNome: especialidade_nome,
      bibliotecasSelecionadas: bibliotecas_selecionadas,
      especialidadesAdicionais: adicionaisInformados,
      limite: limiteBibliotecas,
      plano: planoInicial
    });

    if (montagem.erro) {
      return res.status(400).json({ erro: montagem.erro });
    }

    const { bibliotecaPrincipal, bibliotecas: bibliotecasAutorizadas, adicionais } = montagem;
    const especialidadesJson = JSON.stringify(bibliotecasAutorizadas);
    const adicionaisAutorizadasJson = JSON.stringify(adicionais);

    const ins = await db.query(
      `INSERT INTO usuarios (nome, email, senha, tipo, telefone, especialidades, atende_online, atende_presencial, lgpd_consentimento, lgpd_data_consentimento, plano)
       VALUES ($1, $2, $3, 'profissional', $4, $5, $6, $7, $8, NOW(), $9) RETURNING id`,
      [nome, email, hash, telefone || null, especialidadesJson, atendeOnline, atendePresencial, (mapaConsentimentos.termos_privacidade ? 1 : 0), planoInicial]
    );
    const userId = ins.rows[0].id;

    await salvarConsentimentosLote({
      usuarioId: userId,
      consentimentos: mapaConsentimentos,
      req,
      origem: 'cadastro-profissional',
      tipoUsuario: 'profissional',
      exigirObrigatorios: true
    });

    await garantirValoresPadrao(userId).catch((err) => {
      console.warn('[cadastro-profissional] valores padrão não criados:', err.message);
    });

    const dadosCadastroExtra = {
      cpf: cpf || null,
      data_nascimento: data_nascimento || null,
      endereco: {
        cep: cep || null,
        logradouro: logradouro || null,
        numero: numero_endereco || null,
        complemento: complemento || null,
        cidade: cidade || null,
        estado: estado || null
      },
      tem_registro_profissional: Boolean(tem_registro_profissional),
      tem_abrath: tem_abrath || null,
      abrath_verificada: Boolean(abrath_verificada),
      modalidade_atendimento: modalidade,
      renovacao_automatica: renovacao_automatica !== false,
      ocupacao_secundaria: ocupacao_secundaria || null,
      ocupacao_terciaria: ocupacao_terciaria || null
    };

    // Persistir registros profissionais se as colunas existirem no ambiente.
    try {
      await db.query(
        `UPDATE usuarios
         SET conselho_classe = $1,
             uf_conselho = $2,
             registro_profissional = $3,
             registro_abrath = $4
         WHERE id = $5`,
        [conselho || null, uf_conselho || null, numero_registro || null, registro_abrath || null, userId]
      );
    } catch (errRegistro) {
      console.warn('[cadastro-profissional] registros profissionais não persistidos em usuarios:', errRegistro.message);
    }

    try {
      await db.query(
        `UPDATE usuarios SET cpf = $1, data_nascimento = $2 WHERE id = $3`,
        [cpf || null, data_nascimento || null, userId]
      );
    } catch (errCpf) {
      console.warn('[cadastro-profissional] cpf/data_nascimento não persistidos:', errCpf.message);
    }

    // Registrar dados profissionais (best-effort — tabela pode não existir em todos os ambientes)
    try {
      await db.query(
        `INSERT INTO profissionais_dados (usuario_id, especialidade, conselho, uf_conselho, numero_registro, especialidades_adicionais, gateway, email_corporativo, prescricao_eletronica, criado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [userId, bibliotecaPrincipal, conselho || null, uf_conselho || null, numero_registro || null,
          adicionaisAutorizadasJson, gateway || null, email_corporativo || null, prescricao_eletronica || null]
      );
    } catch (errDados) {
      console.warn('[cadastro-profissional] profissionais_dados não persistido:', errDados.message);
    }

    const token = jwt.sign({ id: userId, email, tipo: 'profissional' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    auditoria.registrar({
      categoria: auditoria.CATEGORIAS.AUTENTICACAO,
      acao: 'cadastro_profissional',
      base_legal: lgpd_consentimento ? auditoria.BASE_LEGAL.CONSENTIMENTO : auditoria.BASE_LEGAL.EXECUCAO_CONTRATO,
      finalidade: 'cadastro profissional e habilitação de bibliotecas',
      usuario_id: userId,
      usuario_tipo: 'profissional',
      email,
      recurso: 'usuario',
      recurso_id: userId,
      rota: req.originalUrl,
      metodo: req.method,
      ip: req.ip,
      user_agent: req.get('user-agent'),
      detalhes: {
        biblioteca_principal: bibliotecaPrincipal,
        total_bibliotecas: bibliotecasAutorizadas.length,
        lgpd_consentimento: Boolean(lgpd_consentimento),
        plano: planoInicial,
        modalidade_atendimento: modalidade,
        renovacao_automatica: renovacao_automatica !== false,
        abrath_verificada: Boolean(abrath_verificada)
      }
    });
    res.status(201).json({
      mensagem: 'Cadastro profissional realizado!',
      token,
      usuario: {
        id: userId,
        nome,
        email,
        tipo: 'profissional',
        plano: planoInicial,
        especialidade: bibliotecaPrincipal,
        especialidades: bibliotecasAutorizadas,
        modalidade_atendimento: modalidade,
        renovacao_automatica: renovacao_automatica !== false,
        abrath_verificada: Boolean(abrath_verificada),
        registro_abrath: registro_abrath || null,
        dados_cadastro: dadosCadastroExtra
      }
    });
  } catch (e) {
    console.error('[auth/cadastro-profissional]', e.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;