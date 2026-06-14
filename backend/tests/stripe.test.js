const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const backendDir = path.join(__dirname, '..');

function runStripeSnippet(envOverrides, snippet) {
  const env = { ...process.env, ...envOverrides };
  if (envOverrides.STRIPE_SECRET_KEY === null) {
    delete env.STRIPE_SECRET_KEY;
  }

  return spawnSync(process.execPath, ['-e', snippet], {
    cwd: backendDir,
    env,
    encoding: 'utf8'
  });
}

test('accepts simulated subscription payments only in explicit test mode', () => {
  const result = runStripeSnippet(
    { TEST_MODE: 'true', STRIPE_SECRET_KEY: null },
    `
      const assert = require('node:assert/strict');
      const { verificarPagamentoAssinatura } = require('./config/stripe');
      verificarPagamentoAssinatura({
        paymentIntentId: 'test_pi_subscription',
        valorEsperado: 899,
        usuarioId: 123
      }).then((res) => {
        assert.equal(res.valido, true);
        assert.equal(res.simulated, true);
      }).catch((err) => {
        console.error(err);
        process.exit(1);
      });
    `
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('rejects simulated subscription payments outside test mode', () => {
  const result = runStripeSnippet(
    { TEST_MODE: 'false', STRIPE_SECRET_KEY: null },
    `
      const assert = require('node:assert/strict');
      const { verificarPagamentoAssinatura } = require('./config/stripe');
      verificarPagamentoAssinatura({
        paymentIntentId: 'test_pi_subscription',
        valorEsperado: 899,
        usuarioId: 123
      }).then((res) => {
        assert.equal(res.valido, false);
        assert.match(res.motivo, /modo de teste/);
      }).catch((err) => {
        console.error(err);
        process.exit(1);
      });
    `
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('does not simulate refunds from a test_ prefix in production', () => {
  const result = runStripeSnippet(
    { TEST_MODE: 'false', STRIPE_SECRET_KEY: null },
    `
      const assert = require('node:assert/strict');
      const { estornarPagamento } = require('./config/stripe');
      estornarPagamento({
        paymentIntentId: 'test_pi_subscription',
        valor: 899
      }).then(() => {
        throw new Error('refund should not be simulated in production');
      }).catch((err) => {
        assert.match(err.message, /Stripe não configurado/);
      });
    `
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
});
