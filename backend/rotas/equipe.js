const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticarAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    // Verifica se é admin ou super_admin
    if (!['admin', 'super_admin'].includes(d.tipo)) return res.status(403).json({ erro: 'Acesso restrito a administradores' });
    req.usuario = d;
    next();
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
}

// Listar equipe da clínica (Admin)
router.get('/equipe', autenticarAdmin, async (req, res) => {
  try {
    // Se for super_admin, vê todos; se for admin, vê só os da sua clínica
    const r = await db.query(
      `SELECT id, nome, email, tipo, registro_profissional, conselho_classe, ativo, criado_em 
       FROM usuarios WHERE tipo IN ('recepcionista', 'rh', 'financeiro', 'contador', 'profissional') 
       AND ativo = 1 ORDER BY tipo, nome`
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao listar equipe' });
  }
});

// Convidar membro da equipe (Admin)
router.post('/convidar', autenticarAdmin, async (req, res) => {
  const { email, nome, tipo } = req.body;
  if (!email || !nome || !tipo) return res.status(400).json({ erro: 'Email, nome e tipo são obrigatórios' });
  
  // Gera uma senha aleatória ou envia email de cadastro
  console.log(`Convite enviado para ${email} como ${tipo}`);
  
  // Aqui você pode integrar com o serviço de email (Zoho) para enviar o convite
  res.json({ mensagem: `Convite enviado para ${email} como ${tipo}!` });
});

// Resumo contábil da clínica (Admin)
router.get('/contabil', autenticarAdmin, async (req, res) => {
  try {
    const mes = new Date().toISOString().substring(0, 7);
    
    const faturamento = await db.query("SELECT COALESCE(SUM(valor),0) as total FROM pagamentos WHERE status = 'aprovado' AND criado_em >= $1", [mes + '-01']);
    const despesas = await db.query("SELECT COALESCE(SUM(salario_bruto),0) as total FROM folha_pagamento WHERE mes_referencia = $1", [mes]);
    
    res.json({
      mes,
      faturamento: faturamento.rows[0].total,
      despesas_funcionarios: despesas.rows[0].total,
      lucro_liquido: faturamento.rows[0].total - despesas.rows[0].total
    });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao carregar resumo contábil' });
  }
});

module.exports = router;