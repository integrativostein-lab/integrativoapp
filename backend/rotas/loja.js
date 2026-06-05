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

router.get('/produtos', async (req, res) => {
  const r = await db.query('SELECT * FROM produtos WHERE ativo = 1 LIMIT 100');
  res.json(r.rows);
});

router.post('/produtos', autenticar, async (req, res) => {
  const { nome, preco, estoque, categoria } = req.body;
  const r = await db.query('INSERT INTO produtos (usuario_id, nome, preco, estoque, categoria) VALUES ($1, $2, $3, $4, $5) RETURNING id', [req.usuario.id, nome, preco, estoque || 0, categoria]);
  res.status(201).json({ mensagem: 'Produto cadastrado!', id: r.rows[0].id });
});

router.post('/pedidos', autenticar, async (req, res) => {
  const { itens, origem } = req.body;
  let total = 0;
  for (const item of itens) {
    const prod = await db.query('SELECT * FROM produtos WHERE id = $1', [item.produto_id]);
    if (prod.rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    total += prod.rows[0].preco * item.quantidade;
  }
  const r = await db.query("INSERT INTO pedidos_loja (paciente_id, vendedor_id, origem, valor_total, frete_valor) VALUES ($1, $2, $3, $4, 0) RETURNING id", [req.usuario.id, itens[0].usuario_id || 1, origem || 'virtual', total]);
  res.status(201).json({ mensagem: 'Pedido criado!', id: r.rows[0].id, total });
});

module.exports = router;