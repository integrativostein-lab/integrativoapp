process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(32);

const assert = require('node:assert/strict');
const test = require('node:test');

const financeiro = require('./financeiro');
const {
  valorEmCentavos,
  parseGatewayResposta,
  assinaturaTemPagamentoVerificado,
  validarPagamentoAssinatura
} = financeiro._internals;

test('validarPagamentoAssinatura permite plano sem valor sem gateway', async () => {
  const resultado = await validarPagamentoAssinatura({
    gatewayId: null,
    valorEsperado: 0,
    usuarioId: 123,
    plano: 'freemium'
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.gatewayId, null);
  assert.equal(resultado.gatewayResposta.pagamento_verificado, false);
});

test('validarPagamentoAssinatura rejeita plano pago sem pagamento confirmado', async () => {
  const resultado = await validarPagamentoAssinatura({
    gatewayId: null,
    valorEsperado: 899,
    usuarioId: 123,
    plano: 'pro'
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.status, 402);
});

test('assinaturaTemPagamentoVerificado exige marcador e gateway id correspondentes', () => {
  assert.equal(assinaturaTemPagamentoVerificado({
    gateway_id: 'pi_confirmado',
    gateway_resposta: {
      pagamento_verificado: true,
      gateway_id: 'pi_confirmado'
    }
  }), true);

  assert.equal(assinaturaTemPagamentoVerificado({
    gateway_id: 'pi_cliente',
    gateway_resposta: {
      observacao: 'Pagamento vinculado ao gateway.'
    }
  }), false);

  assert.equal(assinaturaTemPagamentoVerificado({
    gateway_id: 'pi_confirmado',
    gateway_resposta: JSON.stringify({
      pagamento_verificado: true,
      gateway_id: 'pi_outro'
    })
  }), false);
});

test('helpers normalizam centavos e JSON invalido de forma segura', () => {
  assert.equal(valorEmCentavos(47.99), 4799);
  assert.deepEqual(parseGatewayResposta('{'), {});
});
