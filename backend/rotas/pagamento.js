const express = require('express');
const router = express.Router();
const { criarPagamentoTeste, emitirNFSimulada, modoTeste } = require('../config/stripe');

// Rota para processar pagamento (modo teste)
router.post('/criar', async (req, res) => {
    try {
        const { produto, valor, email, profissionalId } = req.body;

        if (modoTeste) {
            console.log('🔵 MODO TESTE ATIVO - Pagamento fictício');
        }

        // Criar pagamento
        const pagamento = await criarPagamentoTeste(produto, valor, email);

        // Emitir NF simulada
        const notaFiscal = await emitirNFSimulada({
            produto,
            valor,
            profissionalId,
            email,
            pagamentoId: pagamento.id
        });

        res.json({
            sucesso: true,
            modo_teste: modoTeste,
            pagamento,
            nota_fiscal: notaFiscal,
            mensagem: modoTeste 
                ? "✅ Pagamento SIMULADO realizado com sucesso. Nenhum valor foi cobrado." 
                : "Pagamento realizado com sucesso."
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

// Rota para verificar status do modo
router.get('/status', (req, res) => {
    res.json({
        modo_teste: modoTeste,
        ambiente: process.env.NODE_ENV || 'development',
        stripe_configurada: !!process.env.STRIPE_SECRET_KEY,
        nf_sem_certificado: process.env.SIMULAR_NF_SEM_CERTIFICADO === 'true'
    });
});

module.exports = router;