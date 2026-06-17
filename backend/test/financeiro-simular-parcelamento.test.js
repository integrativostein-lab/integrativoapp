const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://teste:teste@localhost:5432/integrativo_teste';

const financeiroRouter = require('../rotas/financeiro');

function buscarHandler(method, path) {
  const layer = financeiroRouter.stack.find((item) => item.route?.path === path);
  assert.ok(layer, `rota ${path} registrada`);

  const routeLayer = layer.route.stack.find((item) => item.method === method);
  assert.ok(routeLayer, `metodo ${method.toUpperCase()} registrado em ${path}`);
  return routeLayer.handle;
}

const simularParcelamento = buscarHandler('post', '/simular-parcelamento');

function chamarSimulacao(body) {
  return new Promise((resolve, reject) => {
    const req = { body };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
      }
    };

    try {
      simularParcelamento(req, res);
    } catch (error) {
      reject(error);
    }
  });
}

test('simulacao de assinatura rejeita plano inexistente', async () => {
  const resposta = await chamarSimulacao({ plano: 'plano-inventado', parcelas: 1, forma_pagamento: 'pix' });

  assert.equal(resposta.statusCode, 400);
  assert.deepEqual(resposta.payload, { erro: 'Plano inválido' });
});

test('simulacao de assinatura freemium sempre retorna custo zero', async () => {
  const resposta = await chamarSimulacao({ plano: 'freemium', parcelas: 12, forma_pagamento: 'cartao' });

  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.payload, {
    plano: 'freemium',
    parcelas: 1,
    valorParcela: 0,
    valorTotal: 0,
    juros: 0,
    desconto_pix: 0
  });
});

test('simulacao de assinatura aplica desconto PIX para plano pro', async () => {
  const resposta = await chamarSimulacao({ plano: 'pro', parcelas: 1, forma_pagamento: 'pix' });

  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.payload, {
    plano: 'pro',
    parcelas: 1,
    valorParcela: 854.05,
    valorTotal: 854.05,
    juros: 0,
    desconto_pix: 44.95
  });
});

test('simulacao de assinatura nao aplica desconto PIX para Guardioes da Floresta', async () => {
  const resposta = await chamarSimulacao({ plano: 'guardioes_floresta', parcelas: 1, forma_pagamento: 'pix' });

  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.payload, {
    plano: 'guardioes_floresta',
    parcelas: 1,
    valorParcela: 200,
    valorTotal: 200,
    juros: 0,
    desconto_pix: 0
  });
});

test('simulacao de assinatura limita parcelamento a 12x e calcula juros Price', async () => {
  const resposta = await chamarSimulacao({ plano: 'premium', parcelas: 99, forma_pagamento: 'cartao' });

  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.payload, {
    plano: 'premium',
    parcelas: 12,
    valorParcela: 453.51,
    valorTotal: 5442.15,
    juros: 643.15,
    desconto_pix: 0
  });
});
