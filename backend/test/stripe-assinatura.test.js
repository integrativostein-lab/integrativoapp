const test = require('node:test');
const assert = require('node:assert/strict');

const { avaliarPagamentoAssinatura } = require('../config/stripe');

test('permite assinaturas sem cobranca', () => {
    const resultado = avaliarPagamentoAssinatura(null, { valorEsperado: 0 });
    assert.equal(resultado.comprovado, true);
    assert.equal(resultado.motivo, 'sem_cobranca');
});

test('rejeita assinatura paga sem PaymentIntent', () => {
    const resultado = avaliarPagamentoAssinatura(null, { valorEsperado: 899 });
    assert.equal(resultado.comprovado, false);
    assert.equal(resultado.motivo, 'pagamento_ausente');
});

test('rejeita PaymentIntent aprovado com valor menor que o plano', () => {
    const resultado = avaliarPagamentoAssinatura({
        id: 'pi_underpaid',
        status: 'succeeded',
        amount_received: 1000,
        currency: 'brl',
        metadata: {
            integrativo_tipo: 'assinatura',
            usuario_id: '42',
            plano: 'pro'
        }
    }, {
        valorEsperado: 899,
        metadataEsperada: {
            integrativo_tipo: 'assinatura',
            usuario_id: 42,
            plano: 'pro'
        }
    });

    assert.equal(resultado.comprovado, false);
    assert.equal(resultado.motivo, 'valor_insuficiente');
});

test('rejeita PaymentIntent de outro usuario ou plano', () => {
    const resultado = avaliarPagamentoAssinatura({
        id: 'pi_wrong_metadata',
        status: 'succeeded',
        amount_received: 89900,
        currency: 'brl',
        metadata: {
            integrativo_tipo: 'assinatura',
            usuario_id: '99',
            plano: 'pro'
        }
    }, {
        valorEsperado: 899,
        metadataEsperada: {
            integrativo_tipo: 'assinatura',
            usuario_id: 42,
            plano: 'pro'
        }
    });

    assert.equal(resultado.comprovado, false);
    assert.equal(resultado.motivo, 'metadata_invalida');
    assert.equal(resultado.campo, 'usuario_id');
});

test('aceita PaymentIntent aprovado para usuario, plano e valor esperados', () => {
    const resultado = avaliarPagamentoAssinatura({
        id: 'pi_valid',
        status: 'succeeded',
        amount_received: 89900,
        currency: 'brl',
        metadata: {
            integrativo_tipo: 'assinatura',
            usuario_id: '42',
            plano: 'pro'
        }
    }, {
        valorEsperado: 899,
        metadataEsperada: {
            integrativo_tipo: 'assinatura',
            usuario_id: 42,
            plano: 'pro'
        }
    });

    assert.equal(resultado.comprovado, true);
    assert.equal(resultado.motivo, 'pagamento_confirmado');
    assert.equal(resultado.gateway_id, 'pi_valid');
});
