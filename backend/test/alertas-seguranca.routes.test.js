const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, describe, it } = require('node:test');

const express = require('express');
const jwt = require('jsonwebtoken');

const alertasSegurancaRouter = require('../rotas/alertas-seguranca');

describe('rotas de alertas de seguranca', () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.JWT_SECRET = 'segredo-testes-alertas';

    const app = express();
    app.use(express.json());
    app.use('/api/alertas-seguranca', alertasSegurancaRouter);

    server = app.listen(0);
    await once(server, 'listening');

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (!server) return;
    await new Promise((resolve, reject) => {
      server.close((erro) => (erro ? reject(erro) : resolve()));
    });
  });

  async function requisitar(path, options = {}) {
    const resposta = await fetch(`${baseUrl}${path}`, options);
    return {
      status: resposta.status,
      cacheControl: resposta.headers.get('cache-control'),
      body: await resposta.json()
    };
  }

  it('mantem consulta publica sem cache e com retorno deterministico', async () => {
    const resposta = await requisitar('/api/alertas-seguranca?termo=ginkgo%20varfarina');

    assert.equal(resposta.status, 200);
    assert.equal(resposta.cacheControl, 'no-store');
    assert.equal(resposta.body.usuario_id, null);
    assert.equal(resposta.body.usa_ia, false);
    assert.equal(resposta.body.total_alertas, 1);
    assert.equal(
      resposta.body.alertas[0].regra_id,
      'FITOTERAPIA_ANTICOAGULANTE_001'
    );
  });

  it('bloqueia catalogo de regras sem token', async () => {
    const resposta = await requisitar('/api/alertas-seguranca/regras');

    assert.equal(resposta.status, 401);
    assert.deepEqual(resposta.body, { erro: 'Não autorizado' });
  });

  it('bloqueia catalogo de regras para usuario nao administrador', async () => {
    const token = jwt.sign(
      { id: 'profissional-1', tipo: 'profissional' },
      process.env.JWT_SECRET
    );

    const resposta = await requisitar('/api/alertas-seguranca/regras', {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(resposta.status, 403);
    assert.deepEqual(resposta.body, { erro: 'Acesso restrito' });
  });

  it('permite catalogo de regras somente para administrador', async () => {
    const token = jwt.sign(
      { id: 'admin-1', tipo: 'admin' },
      process.env.JWT_SECRET
    );

    const resposta = await requisitar('/api/alertas-seguranca/regras', {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(resposta.status, 200);
    assert.equal(resposta.cacheControl, 'no-store');
    assert.equal(resposta.body.motor, 'deterministico_if_then');
    assert.equal(resposta.body.usa_ia, false);
    assert.ok(resposta.body.total >= 1);
    assert.ok(
      resposta.body.regras.some(
        (regra) => regra.id === 'FITOTERAPIA_ANTICOAGULANTE_001'
      )
    );
  });
});
