const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const crypto = require('crypto');

async function autenticarCriador(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const uResult = await db.query('SELECT email, tipo FROM usuarios WHERE id = $1', [d.id]);
    const u = uResult.rows[0];
    if (u?.email !== 'admin@integra.com') return res.status(403).json({ erro: 'Exclusivo do criador' });
    req.criador = d;
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
});

router.post('/entidades/liberar', autenticarCriador, async (req, res) => {
  const { entidade_id } = req.body;
  await db.query("UPDATE entidades SET status = 'aprovada', liberado_por = $1, data_liberacao = NOW() WHERE id = $2", [req.criador.id, entidade_id]);
  res.json({ mensagem: 'Entidade liberada com sucesso!' });
});

router.post('/verificar-chave', async (req, res) => {
  const { chave } = req.body;
  const r = await db.query("SELECT * FROM entidades WHERE chave_ativacao = $1 AND status = 'aprovada' AND chave_validade >= CURRENT_DATE", [chave]);
  if (r.rows.length === 0) return res.status(400).json({ erro: 'Chave inválida ou expirada.', valida: false });
  res.json({ valida: true, entidade: r.rows[0].nome_entidade, validade: r.rows[0].chave_validade });
});

module.exports = router;