const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, tipo, especialidades, atende_online, atende_presencial, atende_domiciliar, domiciliar_tipo, domiciliar_valor, lgpd_consentimento, token_convite } = req.body;
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

// ============================================
// CADASTRO ESPECÍFICO DE PROFISSIONAL
// ============================================
// Cria usuário tipo='profissional' e (opcional) já dispara validação no conselho
router.post('/cadastro-profissional', async (req, res) => {
  try {
    const {
      nome, email, senha, telefone,
      especialidade, conselho, uf_conselho, numero_registro,
      registro_abrath,
      especialidades_adicionais, gateway, email_corporativo,
      prescricao_eletronica, lgpd_consentimento
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

    const ins = await db.query(
      `INSERT INTO usuarios (nome, email, senha, tipo, telefone, especialidades, atende_online, atende_presencial, lgpd_consentimento, lgpd_data_consentimento, plano)
       VALUES ($1, $2, $3, 'profissional', $4, $5, 1, 1, $6, NOW(), 'freemium') RETURNING id`,
      [nome, email, hash, telefone || null, especialidade, lgpd_consentimento || 0]
    );
    const userId = ins.rows[0].id;

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
        [userId, especialidade, conselho || null, uf_conselho || null, numero_registro || null,
          especialidades_adicionais || null, gateway || null, email_corporativo || null, prescricao_eletronica || null]
      );
    } catch (errDados) {
      console.warn('[cadastro-profissional] profissionais_dados não persistido:', errDados.message);
    }

    const token = jwt.sign({ id: userId, email, tipo: 'profissional' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      mensagem: 'Cadastro profissional realizado!',
      token,
      usuario: { id: userId, nome, email, tipo: 'profissional', especialidade }
    });
  } catch (e) {
    console.error('[auth/cadastro-profissional]', e.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;