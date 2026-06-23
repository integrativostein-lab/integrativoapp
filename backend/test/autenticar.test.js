const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');

const { autenticar, exigirTipo } = require('../middlewares/autenticar');

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('autenticar rejeita requisicoes sem token Bearer', () => {
  const res = mockResponse();
  let nextChamado = false;

  autenticar({ headers: {} }, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { erro: 'Não autorizado' });
});

test('autenticar rejeita token invalido ou expirado', () => {
  const segredoOriginal = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'segredo-testes';

  const res = mockResponse();
  let nextChamado = false;

  try {
    autenticar(
      { headers: { authorization: 'Bearer token-invalido' } },
      res,
      () => {
        nextChamado = true;
      }
    );
  } finally {
    process.env.JWT_SECRET = segredoOriginal;
  }

  assert.equal(nextChamado, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { erro: 'Token inválido ou expirado' });
});

test('autenticar anexa usuario do JWT valido e chama next', () => {
  const segredoOriginal = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'segredo-testes';
  const token = jwt.sign({ id: 'usuario-1', tipo: 'admin' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextChamado = false;

  try {
    autenticar(req, res, () => {
      nextChamado = true;
    });
  } finally {
    process.env.JWT_SECRET = segredoOriginal;
  }

  assert.equal(nextChamado, true);
  assert.equal(res.statusCode, 200);
  assert.equal(req.usuario.id, 'usuario-1');
  assert.equal(req.usuario.tipo, 'admin');
});

test('exigirTipo aplica 401, 403 e permite tipos autorizados', () => {
  const middlewareAdmin = exigirTipo('admin');

  const semUsuario = mockResponse();
  middlewareAdmin({}, semUsuario, () => {
    throw new Error('next nao deve ser chamado sem usuario');
  });
  assert.equal(semUsuario.statusCode, 401);
  assert.deepEqual(semUsuario.body, { erro: 'Não autorizado' });

  const profissional = mockResponse();
  middlewareAdmin({ usuario: { tipo: 'profissional' } }, profissional, () => {
    throw new Error('next nao deve ser chamado para tipo nao autorizado');
  });
  assert.equal(profissional.statusCode, 403);
  assert.deepEqual(profissional.body, { erro: 'Acesso negado' });

  const admin = mockResponse();
  let nextChamado = false;
  middlewareAdmin({ usuario: { tipo: 'admin' } }, admin, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, true);
  assert.equal(admin.statusCode, 200);
  assert.equal(admin.body, null);
});
