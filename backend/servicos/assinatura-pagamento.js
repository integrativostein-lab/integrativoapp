const { stripe, modoTeste } = require('../config/stripe');

function valorEmCentavos(valor) {
  return Math.round((Number(valor) || 0) * 100);
}

function resumirPaymentIntent(paymentIntent) {
  if (!paymentIntent) return null;
  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    amount_received: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata || {}
  };
}

async function verificarPagamentoAssinatura({
  gatewayId,
  valorEsperado,
  stripeClient = stripe,
  modoTesteAtivo = modoTeste
}) {
  const valorEsperadoCentavos = valorEmCentavos(valorEsperado);

  if (valorEsperadoCentavos <= 0) {
    return {
      aprovado: true,
      status: 'isento',
      gateway_resposta: { status: 'isento', valor_esperado_centavos: 0 }
    };
  }

  if (!gatewayId) {
    return {
      aprovado: false,
      status: 'sem_gateway',
      erro: 'Pagamento confirmado no gateway é obrigatório para ativar planos pagos.'
    };
  }

  if (modoTesteAtivo && String(gatewayId).startsWith('test_payment_')) {
    return {
      aprovado: true,
      status: 'succeeded',
      gateway_resposta: {
        id: gatewayId,
        status: 'succeeded',
        amount_received: valorEsperadoCentavos,
        currency: 'brl',
        simulated: true
      }
    };
  }

  if (!stripeClient) {
    return {
      aprovado: false,
      status: 'gateway_indisponivel',
      erro: 'Gateway de pagamento não configurado para confirmar a assinatura.'
    };
  }

  const paymentIntent = await stripeClient.paymentIntents.retrieve(gatewayId);
  const resumo = resumirPaymentIntent(paymentIntent);
  const valorRecebidoCentavos = Number(paymentIntent.amount_received || 0);

  if (paymentIntent.status !== 'succeeded') {
    return {
      aprovado: false,
      status: paymentIntent.status,
      erro: 'Pagamento ainda não foi confirmado pelo gateway.',
      gateway_resposta: resumo
    };
  }

  if (String(paymentIntent.currency || '').toLowerCase() !== 'brl') {
    return {
      aprovado: false,
      status: 'moeda_invalida',
      erro: 'Pagamento confirmado em moeda diferente de BRL.',
      gateway_resposta: resumo
    };
  }

  if (valorRecebidoCentavos < valorEsperadoCentavos) {
    return {
      aprovado: false,
      status: 'valor_insuficiente',
      erro: 'Valor confirmado pelo gateway é menor que o valor da assinatura.',
      gateway_resposta: resumo
    };
  }

  return {
    aprovado: true,
    status: paymentIntent.status,
    gateway_resposta: resumo
  };
}

module.exports = {
  verificarPagamentoAssinatura,
  valorEmCentavos
};
