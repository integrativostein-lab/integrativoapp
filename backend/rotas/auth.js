const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, tipo, especialidades, atende_online, atende_presencial, atende_domiciliar, domiciliar_tipo, domiciliar_valor, lgpd_consentimento, token_convite } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    
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
        nome, email, hash, tipo || 'paciente',
        especialidades || null,
        atende_online || 0, atende_presencial || 0,
        atende_domiciliar || 0, domiciliar_tipo || null, domiciliar_valor || null,
        lgpd_consentimento || 0,
        convite ? convite.plano : 'freemium'
      ]
    );
    
    if (tipo === 'paciente' || !tipo) {
      await db.query('INSERT INTO pacientes (usuario_id) VALUES ($1)', [result.rows[0].id]);
    }

    // Se veio de convite com benefícios, criar assinatura
    if (convite && convite.vitalicio) {
      await db.query("INSERT INTO assinaturas (usuario_id, plano, tipo_ciclo, valor, data_inicio, data_expiracao, status) VALUES ($1, $2, 'vitalicio', 0, NOW(), '2099-12-31', 'ativa')", [result.rows[0].id, convite.plano]);
      await db.query("UPDATE usuarios SET assinatura_ativa = 1, data_expiracao_assinatura = '2099-12-31' WHERE id = $1", [result.rows[0].id]);
    }
    
    const token = jwt.sign({ id: result.rows[0].id, email, tipo: tipo || 'paciente' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      mensagem: 'Cadastro realizado!',
      token,
      usuario: { id: result.rows[0].id, nome, email },
      convite: convite ? {
        plano: convite.plano,
        vitalicio: convite.vitalicio,
        isentar_taxa: convite.isentar_taxa,
        isentar_assinatura: convite.isentar_assinatura
      } : null
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });
    
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

module.exports = router;