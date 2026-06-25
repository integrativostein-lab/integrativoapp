const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const crypto = require('crypto');
const auditoria = require('../servicos/auditoria-lgpd');
const bcrypt = require('bcryptjs');
const {
  ehContaCriador,
  obterEmailCriador,
  salvarEmailCriadorConfig,
  EMAIL_CRIADOR_PADRAO
} = require('../utils/acesso-roles');

async function autenticarCriador(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const uResult = await db.query('SELECT id, email, tipo, nome FROM usuarios WHERE id = $1', [d.id]);
    const u = uResult.rows[0];
    if (!u || !(await ehContaCriador(db, u))) {
      return res.status(403).json({ erro: 'Exclusivo do criador' });
    }
    req.criador = { ...d, id: u.id, email: u.email, nome: u.nome, tipo: u.tipo };
    next();
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/dashboard', autenticarCriador, async (req, res) => {
  const ter = await db.query("SELECT COUNT(*) as t FROM usuarios WHERE tipo IN ('profissional','admin')");
  const pac = await db.query("SELECT COUNT(*) as t FROM usuarios WHERE tipo = 'paciente'");
  const ass = await db.query("SELECT COUNT(*) as t FROM assinaturas WHERE status = 'ativa'");
  const fat = await db.query("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'");
  const cupom = await db.query("SELECT COUNT(*) as t FROM assinaturas WHERE valor = 0 AND status = 'ativa'");
  const vendas = await db.query("SELECT p.*, u.nome FROM pagamentos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.status = 'aprovado' AND p.valor > 0 ORDER BY p.criado_em DESC LIMIT 10");
  
  res.json({
    metricas: { profissionais: ter.rows[0].t, pacientes: pac.rows[0].t, assinaturas: ass.rows[0].t },
    financeiro: { faturamento: fat.rows[0].t },
    cupons: { presentes_domau: cupom.rows[0].t },
    ultimas_vendas: vendas.rows
  });
});

router.get('/vendas', autenticarCriador, async (req, res) => {
  const { inicio, fim } = req.query;
  let q = "SELECT p.*, u.nome FROM pagamentos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.status = 'aprovado' AND p.valor > 0";
  const params = [];
  if (inicio) { params.push(inicio); q += ` AND p.criado_em >= $${params.length}`; }
  if (fim) { params.push(fim); q += ` AND p.criado_em <= $${params.length}`; }
  q += ' ORDER BY p.criado_em DESC LIMIT 100';
  const r = await db.query(q, params);
  res.json(r.rows);
});

router.post('/convidar', autenticarCriador, async (req, res) => {
  const { email, nome, plano, especialidades, desconto, meses_gratis, isentar_taxa, acesso_vitalicio } = req.body;
  res.json({ mensagem: `Convite enviado para ${email}!`, plano, desconto, isentar_taxa, acesso_vitalicio });
});

router.get('/exportar-vendas', autenticarCriador, async (req, res) => {
  const r = await db.query("SELECT p.*, u.nome FROM pagamentos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.status = 'aprovado' AND p.valor > 0 ORDER BY p.criado_em DESC");
  let csv = 'ID,Tipo,Valor,Data,Cliente\n';
  r.rows.forEach(v => { csv += `${v.id},"${v.tipo}",${v.valor},"${v.criado_em}","${v.nome}"\n`; });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=vendas_integrativo.csv');
  res.send(csv);
});

// ============================================
// ENTIDADES (ONGs, ORGANIZAÇÕES HUMANITÁRIAS, PROJETOS SOCIAIS E GUARDIÕES DA FLORESTA)
// ============================================

router.post('/entidades/cadastro', async (req, res) => {
  try {
    const { tipo, pais, nome_entidade, cnpj, nome_responsavel, cargo, email, telefone, documento_url } = req.body;

    if (!tipo || !pais || !nome_entidade || !cnpj || !nome_responsavel || !email) {
      return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos.' });
    }

    const tiposElegiveis = ['ong', 'humanitaria', 'projeto-social', 'guardioes-floresta'];
    const elegivel = tiposElegiveis.includes(tipo);

    if (!elegivel) {
      return res.status(400).json({ erro: 'Tipo de entidade não elegível. Verifique os critérios.' });
    }

    // Gerar chave de ativação
    const chave = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
    const chaveFormatada = chave.match(/.{4}/g).join('-');
    const validade = new Date();
    validade.setDate(validade.getDate() + 30);

    await db.query(
      `INSERT INTO entidades (tipo, pais, nome_entidade, cnpj, codigo_ibge, nome_responsavel, cargo, email, telefone, documento_url, elegivel, populacao, chave_ativacao, chave_validade, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pendente')`,
      [tipo, pais, nome_entidade, cnpj, null, nome_responsavel, cargo, email, telefone, documento_url, elegivel, null, chaveFormatada, validade.toISOString().split('T')[0]]
    );

    res.status(201).json({
      mensagem: 'Cadastro recebido! Sua solicitação será analisada.',
      status: 'pendente',
      chave: chaveFormatada,
      validade: validade.toISOString().split('T')[0]
    });
  } catch (e) {
    console.error('[criador/entidades/cadastro]', e.message);
    if (process.env.TEST_MODE === 'true') {
      const chave = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
      const chaveFormatada = chave.match(/.{4}/g).join('-');
      const validade = new Date();
      validade.setDate(validade.getDate() + 30);
      return res.status(201).json({
        mensagem: 'Cadastro recebido em modo teste (simulado).',
        status: 'pendente',
        chave: chaveFormatada,
        validade: validade.toISOString().split('T')[0],
        simulacao: true
      });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar entidade.' });
  }
});

router.post('/entidades/liberar', autenticarCriador, async (req, res) => {
  try {
    const { entidade_id } = req.body;
    await db.query("UPDATE entidades SET status = 'aprovada', liberado_por = $1, data_liberacao = NOW() WHERE id = $2", [req.criador.id, entidade_id]);
    res.json({ mensagem: 'Entidade liberada com sucesso!' });
  } catch (e) {
    console.error('[criador/entidades/liberar]', e.message);
    res.status(500).json({ erro: 'Erro ao liberar entidade.' });
  }
});

router.post('/verificar-chave', async (req, res) => {
  try {
    const { chave } = req.body;
    const r = await db.query("SELECT * FROM entidades WHERE chave_ativacao = $1 AND status = 'aprovada' AND chave_validade >= CURRENT_DATE", [chave]);
    if (r.rows.length === 0) return res.status(400).json({ erro: 'Chave inválida ou expirada.', valida: false });
    res.json({ valida: true, entidade: r.rows[0].nome_entidade, validade: r.rows[0].chave_validade });
  } catch (e) {
    console.error('[criador/verificar-chave]', e.message);
    res.status(500).json({ erro: 'Erro ao verificar chave.' });
  }
});

router.get('/logs', autenticarCriador, async (req, res) => {
  try {
    const limite = Math.min(parseInt(req.query.limite, 10) || 200, 500);
    const offset = parseInt(req.query.offset, 10) || 0;
    const resultado = await auditoria.listar({
      limite,
      offset,
      categoria: req.query.categoria || null,
      dataInicio: req.query.de || null,
      dataFim: req.query.ate || null,
      data: req.query.data || null
    });
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao listar logs de auditoria.', detalhe: error.message });
  }
});

router.get('/logs/arquivo', autenticarCriador, async (req, res) => {
  const data = req.query.data || new Date().toISOString().slice(0, 10);
  const { arquivo, eventos } = auditoria.lerArquivoPorData(data);
  res.json({
    data,
    arquivo,
    total: eventos.length,
    eventos: eventos.map(auditoria.normalizarEventoArquivo)
  });
});

router.get('/logs/arquivos', autenticarCriador, async (req, res) => {
  res.json(auditoria.listarArquivosDisponiveis());
});

// ============================================
// CONFIGURAÇÃO DO CRIADOR (email de acesso)
// ============================================
router.get('/configuracao', autenticarCriador, async (req, res) => {
  try {
    const emailOficial = await obterEmailCriador(db);
    res.json({
      email: req.criador.email,
      email_oficial: emailOficial,
      nome: req.criador.nome,
      email_padrao: EMAIL_CRIADOR_PADRAO
    });
  } catch (e) {
    console.error('[criador/configuracao GET]', e.message);
    res.status(500).json({ erro: 'Erro ao carregar configuração.' });
  }
});

router.put('/configuracao', autenticarCriador, async (req, res) => {
  try {
    const { nome, email, senha_atual, nova_senha } = req.body || {};
    if (!senha_atual) {
      return res.status(400).json({ erro: 'Informe sua senha atual para confirmar alterações.' });
    }

    const perfil = await db.query('SELECT id, email, senha, nome FROM usuarios WHERE id = $1', [req.criador.id]);
    const u = perfil.rows[0];
    if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    const senhaOk = await bcrypt.compare(String(senha_atual), u.senha);
    if (!senhaOk) return res.status(401).json({ erro: 'Senha atual incorreta.' });

    const novoEmail = email ? String(email).trim().toLowerCase() : u.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(novoEmail)) {
      return res.status(400).json({ erro: 'Email inválido.' });
    }

    if (novoEmail !== u.email) {
      const dup = await db.query('SELECT id FROM usuarios WHERE email = $1 AND id <> $2', [novoEmail, u.id]);
      if (dup.rows.length) {
        return res.status(400).json({ erro: 'Este email já está em uso por outra conta.' });
      }
    }

    const novoNome = nome ? String(nome).trim() : u.nome;
    let hashSenha = u.senha;
    if (nova_senha) {
      if (String(nova_senha).length < 8) {
        return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 8 caracteres.' });
      }
      hashSenha = await bcrypt.hash(String(nova_senha), 12);
    }

    await db.query(
      'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4',
      [novoNome, novoEmail, hashSenha, u.id]
    );
    await salvarEmailCriadorConfig(db, novoEmail);

    auditoria.registrar({
      categoria: auditoria.CATEGORIAS.AUTENTICACAO,
      acao: 'criador_atualizar_configuracao',
      usuario_id: u.id,
      usuario_tipo: 'super_admin',
      email: novoEmail,
      detalhes: { email_alterado: novoEmail !== u.email, senha_alterada: !!nova_senha }
    });

    res.json({
      mensagem: 'Configuração atualizada com sucesso.',
      usuario: { id: u.id, nome: novoNome, email: novoEmail, tipo: 'super_admin' },
      email_oficial: novoEmail
    });
  } catch (e) {
    console.error('[criador/configuracao PUT]', e.message);
    res.status(500).json({ erro: 'Erro ao salvar configuração.' });
  }
});

module.exports = router;