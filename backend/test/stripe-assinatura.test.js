const assert = require('node:assert/strict');
const test = require('node:test');

const {
  pagamentoRequerConfirmacao,
  verificarPagamentoAssinatura
} = require('../config/stripe');

test('assinaturas sem valor nao exigem confirmacao de pagamento', async () => {
  assert.equal(pagamentoRequerConfirmacao(0), false);

  const resultado = await verificarPagamentoAssinatura({
    paymentIntentId: null,
    valor: 0
  });

  assert.equal(resultado.confirmado, true);
  assert.equal(resultado.status, 'sem_cobranca');
});

test('assinaturas pagas sem gateway nao podem ser confirmadas', async () => {
  assert.equal(pagamentoRequerConfirmacao(899), true);

  const resultado = await verificarPagamentoAssinatura({
    paymentIntentId: null,
    valor: 899
  });

  assert.equal(resultado.confirmado, false);
  assert.equal(resultado.status, 'sem_gateway');
});
