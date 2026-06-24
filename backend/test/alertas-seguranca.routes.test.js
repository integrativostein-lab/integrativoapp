const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-enough-entropy-123456';

const router = require('../rotas/alertas-seguranca');

function criarApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/alertas-seguranca', router);
  return app;
}

async function comServidor(app, fn) {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const { port } = server.address();

  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((erro) => (erro ? reject(erro) : resolve()));
    });
  }
}

function token(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
}

test('GET /api/alertas-seguranca returns deterministic public alerts', async () => {
  await comServidor(criarApp(), async (baseUrl) => {
    const params = new URLSearchParams({
      pratica: 'aromaterapia',
      condicoes: 'histórico convulsivo'
    });

    const resposta = await fetch(`${baseUrl}/api/alertas-seguranca?${params}`);
    const body = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(resposta.headers.get('cache-control'), 'no-store');
    assert.equal(body.usuario_id, null);
    assert.equal(body.usa_ia, false);
    assert.equal(body.total_alertas, 1);
    assert.equal(body.alertas[0].regra_id, 'AROMATERAPIA_EPILEPSIA_001');
  });
});

test('GET /api/alertas-seguranca preserves optional authenticated user id', async () => {
  await comServidor(criarApp(), async (baseUrl) => {
    const params = new URLSearchParams({
      pratica: 'yoga',
      condicoes: 'dor torácica'
    });

    const resposta = await fetch(`${baseUrl}/api/alertas-seguranca?${params}`, {
      headers: {
        Authorization: `Bearer ${token({ id: 'usuario-123', tipo: 'paciente' })}`
      }
    });
    const body = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(body.usuario_id, 'usuario-123');
    assert.equal(body.maior_gravidade, 'critica');
  });
});

test('GET /api/alertas-seguranca/regras requires authentication', async () => {
  await comServidor(criarApp(), async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/alertas-seguranca/regras`);
    const body = await resposta.json();

    assert.equal(resposta.status, 401);
    assert.deepEqual(body, { erro: 'Não autorizado' });
  });
});

test('GET /api/alertas-seguranca/regras rejects non-admin users', async () => {
  await comServidor(criarApp(), async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/alertas-seguranca/regras`, {
      headers: {
        Authorization: `Bearer ${token({ id: 'prof-1', tipo: 'profissional' })}`
      }
    });
    const body = await resposta.json();

    assert.equal(resposta.status, 403);
    assert.deepEqual(body, { erro: 'Acesso restrito' });
  });
});

test('GET /api/alertas-seguranca/regras allows admins to inspect audit-safe metadata', async () => {
  await comServidor(criarApp(), async (baseUrl) => {
    const resposta = await fetch(`${baseUrl}/api/alertas-seguranca/regras`, {
      headers: {
        Authorization: `Bearer ${token({ id: 'admin-1', tipo: 'admin' })}`
      }
    });
    const body = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(resposta.headers.get('cache-control'), 'no-store');
    assert.equal(body.usa_ia, false);
    assert.equal(body.total, body.regras.length);
    assert.ok(body.regras.some((regra) => regra.id === 'APITERAPIA_ALERGIA_001'));
    assert.ok(body.regras.every((regra) => regra.id && regra.area && regra.tipo && regra.gravidade));
  });
});
