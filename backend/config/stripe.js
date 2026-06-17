const Stripe = require('stripe');

// Modo teste: chave fake ou real?
const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY) 
    : null;

// Modo simulação (sem chave real)
const modoTeste = process.env.TEST_MODE === 'true';

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

function valorEmCentavos(valor) {
    return Math.round((Number(valor) || 0) * 100);
}

function pagamentoRequerConfirmacao(valor) {
    return valorEmCentavos(valor) > 0;
}

async function verificarPagamentoAssinatura({ paymentIntentId, valor }) {
    const amount = valorEmCentavos(valor);
    if (amount <= 0) {
        return {
            confirmado: true,
            status: 'sem_cobranca',
            mensagem: 'Assinatura sem valor a cobrar.'
        };
    }

    if (!paymentIntentId) {
        return {
            confirmado: false,
            status: 'sem_gateway',
            mensagem: 'Pagamento da assinatura sem identificador do gateway.'
        };
    }

    if (modoTeste && paymentIntentId.startsWith('test_')) {
        return {
            confirmado: true,
            status: 'succeeded',
            payment_intent: paymentIntentId,
            amount_received: amount,
            currency: 'brl',
            simulated: true
        };
    }

    if (!stripe) {
        return {
            confirmado: false,
            status: 'stripe_nao_configurado',
            mensagem: 'Stripe não configurado para confirmar pagamento da assinatura.'
        };
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const recebido = paymentIntent.amount_received || 0;
    const confirmado = paymentIntent.status === 'succeeded' && recebido >= amount;

    return {
        confirmado,
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount_received: recebido,
        amount_expected: amount,
        currency: paymentIntent.currency,
        mensagem: confirmado
            ? 'Pagamento confirmado no gateway.'
            : 'Pagamento ainda não confirmado no gateway.'
    };
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
    criarPagamentoTeste,
    estornarPagamento,
    verificarPagamentoAssinatura,
    pagamentoRequerConfirmacao,
    emitirNFSimulada
};