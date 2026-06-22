const express = require('express');
const router = express.Router();
const { criarPagamentoTeste, emitirNFSimulada, modoTeste } = require('../config/stripe');
const ambiente = require('../config/ambiente');
const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');

router.post('/criar', autenticar, async (req, res) => {
  try {
    if (!modoTeste && !ambiente.modoTeste) {
      return res.status(503).json({
        sucesso: false,
        erro: 'Pagamento simulado indisponível em produção. Use o checkout em /api/financeiro.'
      });
    }

    const { produto, valor, profissionalId } = req.body;
    const email = req.usuario.email || req.body.email;

    if (!produto || valor == null) {
      return res.status(400).json({ sucesso: false, erro: 'produto e valor são obrigatórios.' });
    }

    if (modoTeste) {
      console.log('🔵 MODO TESTE ATIVO - Pagamento fictício');
    }

    const pagamento = await criarPagamentoTeste(produto, valor, email);
    const notaFiscal = await emitirNFSimulada({
      produto,
      valor,
      profissionalId: profissionalId || req.usuario.id,
      email,
      pagamentoId: pagamento.id
    });

    res.json({
      sucesso: true,
      modo_teste: modoTeste,
      pagamento,
      nota_fiscal: notaFiscal,
      mensagem: modoTeste
        ? '✅ Pagamento SIMULADO realizado com sucesso. Nenhum valor foi cobrado.'
        : 'Pagamento realizado com sucesso.'
    });
  } catch (error) {
    console.error('Erro no pagamento:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      modo_teste: modoTeste
    });
  }
});

router.get('/status', (req, res) => {
  res.json({
    modo_teste: modoTeste,
    ambiente: process.env.NODE_ENV || 'development',
    pasta_teste: ambiente.testeDir,
    banco_teste: db.usandoBancoTeste,
    stripe_configurada: !!process.env.STRIPE_SECRET_KEY,
    nf_sem_certificado: process.env.SIMULAR_NF_SEM_CERTIFICADO === 'true'
  });
});

module.exports = router;
