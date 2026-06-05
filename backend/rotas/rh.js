const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.post('/funcionarios', autenticar, async (req, res) => {
  const { nome, cpf, pis, ctps, cargo, salario, data_admissao, anotacoes } = req.body;
  const r = await db.query('INSERT INTO funcionarios (empresa_id, nome, cpf, pis, ctps, cargo, salario, data_admissao, anotacoes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id', [req.usuario.id, nome, cpf, pis, ctps, cargo, salario, data_admissao, anotacoes]);
  res.status(201).json({ mensagem: 'Funcionário cadastrado!', id: r.rows[0].id });
});

router.get('/funcionarios', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM funcionarios WHERE empresa_id = $1 ORDER BY nome', [req.usuario.id]);
  res.json(r.rows);
});

router.post('/folha', autenticar, async (req, res) => {
  const { mes_referencia } = req.body;
  const funcs = await db.query("SELECT * FROM funcionarios WHERE empresa_id = $1 AND status = 'ativo'", [req.usuario.id]);
  let total = 0;
  const resultados = [];
  for (const f of funcs.rows) {
    const inss = f.salario * 0.08;
    const irrf = f.salario > 1903.98 ? f.salario * 0.075 : 0;
    const fgts = f.salario * 0.08;
    const liquido = f.salario - inss - irrf;
    total += f.salario;
    const r = await db.query('INSERT INTO folha_pagamento (funcionario_id, mes_referencia, salario_bruto, inss_descontado, irrf_descontado, fgts, salario_liquido) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id', [f.id, mes_referencia, f.salario, inss, irrf, fgts, liquido]);
    resultados.push({ funcionario: f.nome, salario_bruto: f.salario, inss, irrf, fgts, liquido, id: r.rows[0].id });
  }
  res.json({ mes: mes_referencia, total_folha: total, funcionarios: resultados });
});

router.get('/folha/:mes', autenticar, async (req, res) => {
  const r = await db.query('SELECT fp.*, f.nome FROM folha_pagamento fp JOIN funcionarios f ON fp.funcionario_id = f.id WHERE f.empresa_id = $1 AND fp.mes_referencia = $2', [req.usuario.id, req.params.mes]);
  res.json(r.rows);
});

router.post('/config-previdencia', autenticar, async (req, res) => {
  const { tipo_contribuicao, salarios_contribuicao } = req.body;
  const ex = await db.query('SELECT id FROM config_previdencia WHERE usuario_id = $1', [req.usuario.id]);
  if (ex.rows.length > 0) await db.query('UPDATE config_previdencia SET tipo_contribuicao=$1, salarios_contribuicao=$2 WHERE id=$3', [tipo_contribuicao, salarios_contribuicao, ex.rows[0].id]);
  else await db.query('INSERT INTO config_previdencia (usuario_id, tipo_contribuicao, salarios_contribuicao) VALUES ($1,$2,$3)', [req.usuario.id, tipo_contribuicao, salarios_contribuicao]);
  res.json({ mensagem: 'Configuração salva!' });
});

router.get('/guia-previdencia', autenticar, async (req, res) => {
  const cfg = await db.query('SELECT * FROM config_previdencia WHERE usuario_id = $1', [req.usuario.id]);
  const salMin = 1500.00;
  const base = cfg.rows.length > 0 ? cfg.rows[0].salarios_contribuicao * salMin : salMin;
  const valorINSS = base * 0.20;
  const valorDAS = 75.00;
  const complemento = Math.max(0, valorINSS - valorDAS);
  res.json({ salario_minimo: salMin, salarios_contribuicao: cfg.rows[0]?.salarios_contribuicao || 1, valor_inss: valorINSS, das_mei: valorDAS, complemento });
});

module.exports = router;