const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const VERSAO_CONSENTIMENTO_PESQUISA = 'pesquisa-clinica-anonimizada-2026-06-13';
const LIMITES_BIBLIOTECAS_PLANO = {
  freemium: 1,
  guardioes_floresta: 5,
  pro: 10,
  premium: 20,
  enterprise: 47
};

function normalizarListaBibliotecas(valor) {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof valor !== 'string' || !valor.trim()) return [];
  try {
    const parsed = JSON.parse(valor);
    if (Array.isArray(parsed)) return normalizarListaBibliotecas(parsed);
  } catch {
    // Mantem compatibilidade com listas simples separadas por virgula.
  }
  return valor.split(',').map((item) => item.trim()).filter(Boolean);
}

function unicas(lista) {
  return Array.from(new Set(lista.filter(Boolean)));
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
      pesquisa_clinica_consentimento, token_convite
    } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ erro: 'Email inválido' });
    if (typeof senha !== 'string' || senha.length < 8) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres' });
    }

    // Allowlist de tipos no cadastro público — NUNCA aceitar admin do body
    const TIPOS_PUBLICOS = ['paciente', 'profissional'];
    const tipoFinal = TIPOS_PUBLICOS.includes(tipo) ? tipo : 'paciente';

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
        lgpd_consentimento || 0,
        convite ? convite.plano : 'freemium'
      ]
    );

    if (tipoFinal === 'paciente') {
      await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [result.rows[0].id]);
    }

    await salvarConsentimentoPesquisa({
      usuarioId: result.rows[0].id,
      consentiu: pesquisa_clinica_consentimento === true || pesquisa_clinica_consentimento === 1,
      req,
      origem: `cadastro-${tipoFinal}`
    });

    // Se veio de convite com benefícios, criar assinatura
    if (convite && convite.vitalicio) {
      await db.query("INSERT INTO assinaturas (usuario_id, plano, tipo_ciclo, valor, data_inicio, data_expiracao, status) VALUES ($1, $2, 'vitalicio', 0, NOW(), '2099-12-31', 'ativa')", [result.rows[0].id, convite.plano]);
      await db.query("UPDATE usuarios SET assinatura_ativa = 1, data_expiracao_assinatura = '2099-12-31' WHERE id = $1", [result.rows[0].id]);
    }

    const token = jwt.sign({ id: result.rows[0].id, email, tipo: tipoFinal }, process.env.JWT_SECRET, { expiresIn: '7d' });
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

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });

    if (process.env.TEST_MODE === 'true' && senha === 'demo123') {
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
    if (result.rows.length === 0) return res.status(401).json({ erro: 'Email ou senha incorretos' });
    
    const u = result.rows[0];
    if (!u.ativo) return res.status(403).json({ erro: 'Conta desativada' });
    
    const ok = await bcrypt.compare(senha, u.senha);
    if (!ok) return res.status(401).json({ erro: 'Email ou senha incorretos' });
    
    const token = jwt.sign({ id: u.id, email: u.email, tipo: u.tipo }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ mensagem: 'Login realizado!', token, usuario: { id: u.id, nome: u.nome, email: u.email, tipo: u.tipo, plano: u.plano } });
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
    const result = await db.query('SELECT id, nome, email, tipo, plano FROM usuarios WHERE id = $1', [d.id]);
    if (result.rows.length === 0) return res.status(401).json({ erro: 'Usuário não encontrado' });
    res.json({ valido: true, usuario: result.rows[0] });
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
});

router.post('/pesquisa-consentimento', autenticar, async (req, res) => {
  const { consentiu } = req.body || {};
  await salvarConsentimentoPesquisa({
    usuarioId: req.usuario.id,
    consentiu: consentiu === true || consentiu === 1,
    req,
    origem: 'painel-usuario'
  });
  res.json({
    mensagem: consentiu
      ? 'Consentimento de pesquisa clínica anonimizada registrado.'
      : 'Consentimento de pesquisa clínica anonimizada revogado.'
  });
});

// ============================================
// CADASTRO ESPECÍFICO DE PROFISSIONAL
// ============================================
// Cria usuário tipo='profissional' e (opcional) já dispara validação no conselho
router.post('/cadastro-profissional', async (req, res) => {
  try {
    const {
      nome, email, senha, telefone,
      especialidade, especialidade_nome, bibliotecas_selecionadas,
      conselho, uf_conselho, numero_registro,
      registro_abrath,
      especialidades_adicionais, gateway, email_corporativo,
      prescricao_eletronica, lgpd_consentimento, pesquisa_clinica_consentimento
    } = req.body;

    if (!nome || !email || !senha || !especialidade) {
      return res.status(400).json({ erro: 'Nome, email, senha e especialidade são obrigatórios' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ erro: 'Email inválido' });
    if (typeof senha !== 'string' || senha.length < 8) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres' });
    }

    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) return res.status(400).json({ erro: 'Email já cadastrado' });

    const hash = await bcrypt.hash(senha, 12);
    const planoInicial = 'freemium';
    const limiteBibliotecas = LIMITES_BIBLIOTECAS_PLANO[planoInicial];
    const bibliotecaPrincipal = String(especialidade_nome || especialidade || '').trim();
    const adicionaisNormalizadas = normalizarListaBibliotecas(especialidades_adicionais)
      .filter((item) => item !== bibliotecaPrincipal);
    const bibliotecasSolicitadas = normalizarListaBibliotecas(bibliotecas_selecionadas);
    const bibliotecasAutorizadas = unicas(
      bibliotecasSolicitadas.length
        ? [bibliotecaPrincipal, ...bibliotecasSolicitadas.filter((item) => item !== bibliotecaPrincipal)]
        : [bibliotecaPrincipal, ...adicionaisNormalizadas]
    );

    if (bibliotecasAutorizadas.length > limiteBibliotecas) {
      return res.status(400).json({
        erro: `Seu plano ${planoInicial} permite ${limiteBibliotecas} biblioteca(s), incluindo a especialidade principal.`
      });
    }

    const especialidadesJson = JSON.stringify(bibliotecasAutorizadas);
    const adicionaisAutorizadasJson = JSON.stringify(bibliotecasAutorizadas.slice(1));

    const ins = await db.query(
      `INSERT INTO usuarios (nome, email, senha, tipo, telefone, especialidades, atende_online, atende_presencial, lgpd_consentimento, lgpd_data_consentimento, plano)
       VALUES ($1, $2, $3, 'profissional', $4, $5, 1, 1, $6, NOW(), $7) RETURNING id`,
      [nome, email, hash, telefone || null, especialidadesJson, lgpd_consentimento || 0, planoInicial]
    );
    const userId = ins.rows[0].id;

    await salvarConsentimentoPesquisa({
      usuarioId: userId,
      consentiu: pesquisa_clinica_consentimento === true || pesquisa_clinica_consentimento === 1,
      req,
      origem: 'cadastro-profissional'
    });

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
    res.status(201).json({
      mensagem: 'Cadastro profissional realizado!',
      token,
      usuario: { id: userId, nome, email, tipo: 'profissional', plano: planoInicial, especialidade: bibliotecaPrincipal, especialidades: bibliotecasAutorizadas }
    });
  } catch (e) {
    console.error('[auth/cadastro-profissional]', e.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;