const test = require('node:test');
const assert = require('node:assert/strict');
const { verificarPagamentoAssinatura, valorEmCentavos } = require('../servicos/assinatura-pagamento');

function stripeComPaymentIntent(paymentIntent) {
  return {
    paymentIntents: {
      retrieve: async (id) => {
        assert.equal(id, paymentIntent.id);
        return paymentIntent;
      }
    }
  };
}

test('valorEmCentavos converte valores monetarios com arredondamento', () => {
  assert.equal(valorEmCentavos(899), 89900);
  assert.equal(valorEmCentavos(826.829999999), 82683);
});

test('aprova assinaturas sem valor sem exigir gateway', async () => {
  const resultado = await verificarPagamentoAssinatura({
    valorEsperado: 0,
    gatewayId: null,
    stripeClient: null,
    modoTesteAtivo: false
  });

  assert.equal(resultado.aprovado, true);
  assert.equal(resultado.status, 'isento');
});

test('rejeita plano pago sem pagamento confirmado', async () => {
  const resultado = await verificarPagamentoAssinatura({
    valorEsperado: 899,
    gatewayId: null,
    stripeClient: null,
    modoTesteAtivo: false
  });

  assert.equal(resultado.aprovado, false);
  assert.equal(resultado.status, 'sem_gateway');
});

test('rejeita payment intent que ainda nao foi capturado', async () => {
  const resultado = await verificarPagamentoAssinatura({
    valorEsperado: 899,
    gatewayId: 'pi_pendente',
    stripeClient: stripeComPaymentIntent({
      id: 'pi_pendente',
      status: 'requires_payment_method',
      amount: 89900,
      amount_received: 0,
      currency: 'brl'
    }),
    modoTesteAtivo: false
  });

  assert.equal(resultado.aprovado, false);
  assert.equal(resultado.status, 'requires_payment_method');
});

test('rejeita payment intent confirmado com valor menor que a assinatura', async () => {
  const resultado = await verificarPagamentoAssinatura({
    valorEsperado: 899,
    gatewayId: 'pi_subpago',
    stripeClient: stripeComPaymentIntent({
      id: 'pi_subpago',
      status: 'succeeded',
      amount: 1000,
      amount_received: 1000,
      currency: 'brl'
    }),
    modoTesteAtivo: false
  });

  assert.equal(resultado.aprovado, false);
  assert.equal(resultado.status, 'valor_insuficiente');
});

test('aprova payment intent capturado com valor suficiente em BRL', async () => {
  const resultado = await verificarPagamentoAssinatura({
    valorEsperado: 899,
    gatewayId: 'pi_pago',
    stripeClient: stripeComPaymentIntent({
      id: 'pi_pago',
      status: 'succeeded',
      amount: 89900,
      amount_received: 89900,
      currency: 'brl',
      metadata: { tipo: 'assinatura' }
    }),
    modoTesteAtivo: false
  });

  assert.equal(resultado.aprovado, true);
  assert.equal(resultado.status, 'succeeded');
  assert.equal(resultado.gateway_resposta.id, 'pi_pago');
});

test('aprova pagamentos simulados apenas quando modo teste esta ativo', async () => {
  const resultado = await verificarPagamentoAssinatura({
    valorEsperado: 899,
    gatewayId: 'test_payment_123',
    stripeClient: null,
    modoTesteAtivo: true
  });

  assert.equal(resultado.aprovado, true);
  assert.equal(resultado.gateway_resposta.simulated, true);
});
