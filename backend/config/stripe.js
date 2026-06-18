const Stripe = require('stripe');

// Modo teste: chave fake ou real?
const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY) 
    : null;

// Modo simulação (sem chave real)
const modoTeste = process.env.TEST_MODE === 'true';

function valorEmCentavos(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return 0;
    return Math.round(numero * 100);
}

function avaliarPagamentoAssinatura(paymentIntent, { valorEsperado, moeda = 'brl', metadataEsperada = {} } = {}) {
    const valorEsperadoCentavos = valorEmCentavos(valorEsperado);
    if (valorEsperadoCentavos <= 0) {
        return { comprovado: true, motivo: 'sem_cobranca' };
    }

    if (!paymentIntent) {
        return { comprovado: false, motivo: 'pagamento_ausente' };
    }

    if (paymentIntent.status !== 'succeeded') {
        return { comprovado: false, motivo: 'pagamento_nao_aprovado', status: paymentIntent.status };
    }

    const moedaRecebida = String(paymentIntent.currency || '').toLowerCase();
    if (moedaRecebida && moedaRecebida !== moeda) {
        return { comprovado: false, motivo: 'moeda_invalida', moeda: moedaRecebida };
    }

    const valorRecebidoCentavos = Number(paymentIntent.amount_received ?? paymentIntent.amount ?? 0);
    if (valorRecebidoCentavos < valorEsperadoCentavos) {
        return {
            comprovado: false,
            motivo: 'valor_insuficiente',
            valor_recebido_centavos: valorRecebidoCentavos,
            valor_esperado_centavos: valorEsperadoCentavos
        };
    }

    const metadata = paymentIntent.metadata || {};
    const metadataInvalida = Object.entries(metadataEsperada)
        .find(([chave, valor]) => String(metadata[chave] || '') !== String(valor));
    if (metadataInvalida) {
        return { comprovado: false, motivo: 'metadata_invalida', campo: metadataInvalida[0] };
    }

    return {
        comprovado: true,
        motivo: 'pagamento_confirmado',
        gateway_id: paymentIntent.id,
        valor_recebido_centavos: valorRecebidoCentavos
    };
}

async function verificarPagamentoAssinatura({ paymentIntentId, valorEsperado, metadataEsperada = {} }) {
    const valorEsperadoCentavos = valorEmCentavos(valorEsperado);
    if (valorEsperadoCentavos <= 0) {
        return { comprovado: true, motivo: 'sem_cobranca' };
    }

    if (!paymentIntentId) {
        return { comprovado: false, motivo: 'pagamento_ausente' };
    }

    if (modoTeste && String(paymentIntentId).startsWith('test_')) {
        return avaliarPagamentoAssinatura({
            id: paymentIntentId,
            status: 'succeeded',
            amount_received: valorEsperadoCentavos,
            currency: 'brl',
            metadata: Object.fromEntries(
                Object.entries(metadataEsperada).map(([chave, valor]) => [chave, String(valor)])
            )
        }, { valorEsperado, metadataEsperada });
    }

    if (!stripe) {
        return { comprovado: false, motivo: 'stripe_nao_configurado' };
    }

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return avaliarPagamentoAssinatura(paymentIntent, { valorEsperado, metadataEsperada });
    } catch (error) {
        return { comprovado: false, motivo: 'gateway_consulta_falhou', erro: error.message };
    }
}

// Função para criar pagamento fictício
async function criarPagamentoTeste(produto, valor, email) {
    if (!modoTeste && !stripe) {
        throw new Error('Stripe não configurado');
    }

    if (modoTeste) {
        // Simulação local
        console.log(`[TESTE] Pagamento simulado: ${produto} - R$ ${valor} - ${email}`);
        return {
            id: `test_payment_${Date.now()}`,
            status: 'succeeded',
            amount: valor,
            currency: 'brl',
            simulated: true
        };
    }

    // Stripe real
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(valor * 100),
        currency: 'brl',
        metadata: { produto, email }
    });

    return paymentIntent;
}

async function estornarPagamento({ paymentIntentId, valor, motivo = 'requested_by_customer' }) {
    if (!paymentIntentId) {
        return {
            status: 'nao_enviado',
            mensagem: 'Pagamento sem identificador do gateway; estorno automático não pôde ser enviado à administradora.'
        };
    }

    if (modoTeste || paymentIntentId.startsWith('test_')) {
        console.log(`[TESTE] Estorno simulado: ${paymentIntentId} - R$ ${valor}`);
        return {
            id: `test_refund_${Date.now()}`,
            status: 'succeeded',
            payment_intent: paymentIntentId,
            amount: Math.round((Number(valor) || 0) * 100),
            currency: 'brl',
            simulated: true
        };
    }

    if (!stripe) {
        throw new Error('Stripe não configurado para processar estorno automático');
    }

    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round((Number(valor) || 0) * 100),
        reason: motivo
    });

    return refund;
}

// Função para simular NF sem certificado
async function emitirNFSimulada(dados) {
    console.log('[TESTE] Emissão de NF simulada (sem certificado)');
    console.log('Dados da NF:', dados);
    
    return {
        numero: `TEST-${Date.now()}`,
        chave: `TESTE_${Math.random().toString(36).substring(2, 15)}`,
        data: new Date().toISOString(),
        simulada: true,
        certificado_usado: false,
        mensagem: "NF SIMULADA - Ambiente de teste sem certificado digital"
    };
}

module.exports = {
    stripe,
    modoTeste,
    avaliarPagamentoAssinatura,
    verificarPagamentoAssinatura,
    criarPagamentoTeste,
    estornarPagamento,
    emitirNFSimulada
};