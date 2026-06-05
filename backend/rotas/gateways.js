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

const GATEWAYS_DISPONIVEIS = [
  { id: 'pagseguro', nome: 'PagSeguro', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
  { id: 'pagbank', nome: 'PagBank', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
  { id: 'asaas', nome: 'Asaas', taxa_cartao: '2,99%', taxa_pix: '1,99%' },
  { id: 'ton', nome: 'Ton', taxa_cartao: '1,99%', taxa_pix: '0,99%' },
  { id: 'mercadopago', nome: 'Mercado Pago', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
  { id: 'efi', nome: 'Efi Bank', taxa_cartao: '1,99%', taxa_pix: '1,99%' },
  { id: 'cielo', nome: 'Cielo', taxa_cartao: 'Variável', taxa_pix: '1,99%' },
  { id: 'stone', nome: 'Stone', taxa_cartao: 'Variável', taxa_pix: '1,99%' }
];

router.get('/disponiveis', autenticar, (req, res) => {
  res.json(GATEWAYS_DISPONIVEIS);
});

router.get('/meus', autenticar, async (req, res) => {
  const r = await db.query("SELECT * FROM configuracoes WHERE chave LIKE 'gateway_%' AND usuario_id = $1", [req.usuario.id]);
  const configurados = r.rows.map(c => {
    const cfg = JSON.parse(c.valor);
    const gw = GATEWAYS_DISPONIVEIS.find(g => g.id === c.chave.replace('gateway_', ''));
    return { ...gw, token: cfg.token, email: cfg.email, conectado: true };
  });
  res.json(configurados);
});

router.post('/conectar', autenticar, async (req, res) => {
  const { gateway_id, token, email } = req.body;
  const gw = GATEWAYS_DISPONIVEIS.find(g => g.id === gateway_id);
  if (!gw) return res.status(400).json({ erro: 'Gateway inválido' });
  
  const config = JSON.stringify({ token, email, conectado_em: new Date().toISOString() });
  await db.query("INSERT INTO configuracoes (chave, valor, usuario_id) VALUES ($1, $2, $3) ON CONFLICT (chave, usuario_id) DO UPDATE SET valor = $2", ['gateway_' + gateway_id, config, req.usuario.id]);
  res.json({ mensagem: `${gw.nome} conectado!` });
});

router.delete('/:gateway_id', autenticar, async (req, res) => {
  await db.query("DELETE FROM configuracoes WHERE chave = $1 AND usuario_id = $2", ['gateway_' + req.params.gateway_id, req.usuario.id]);
  res.json({ mensagem: 'Gateway removido!' });
});

module.exports = router;