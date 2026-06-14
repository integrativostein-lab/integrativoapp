const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

const motor = require('../servicos/alertas-seguranca');
const alertasRouter = require('../rotas/alertas-seguranca');

const RULE_CASES = [
  {
    name: 'fitoterapia with anticoagulant medication',
    contexto: { termo: 'Ginkgo Biloba; Varfarina' },
    regraId: 'FITOTERAPIA_ANTICOAGULANTE_001',
    gravidade: 'alta'
  },
  {
    name: 'aromatherapy with seizure history',
    contexto: { pratica: 'oleo essencial de alecrim', condicoes: ['epilepsia'] },
    regraId: 'AROMATERAPIA_EPILEPSIA_001',
    gravidade: 'alta'
  },
  {
    name: 'bee products with severe allergy',
    contexto: { produto: 'propolis', alergias: ['anafilaxia'] },
    regraId: 'APITERAPIA_ALERGIA_001',
    gravidade: 'critica'
  },
  {
    name: 'massage with thrombosis signs',
    contexto: { pratica: 'massagem', condicoes: ['suspeita de trombose'] },
    regraId: 'MASSOTERAPIA_TROMBOSE_001',
    gravidade: 'critica'
  },
  {
    name: 'acupuncture during pregnancy',
    contexto: { pratica: 'moxabustao', condicoes: ['gestacao'] },
    regraId: 'ACUPUNTURA_GESTACAO_001',
    gravidade: 'alta'
  },
  {
    name: 'complementary practice with mental health crisis',
    contexto: { pratica: 'reiki', condicoes: ['ideacao suicida'] },
    regraId: 'SAUDE_MENTAL_RISCO_001',
    gravidade: 'critica'
  },
  {
    name: 'intense yoga with unstable cardiovascular condition',
    contexto: { pratica: 'pranayama', condicoes: ['hipertensao nao controlada'] },
    regraId: 'YOGA_CARDIOVASCULAR_001',
    gravidade: 'alta'
  },
  {
    name: 'generic urgent clinical warning',
    contexto: { pratica: 'consulta integrativa', condicoes: ['dor toracica'] },
    regraId: 'SINAIS_ALARME_URGENCIA_001',
    gravidade: 'critica'
  }
];

function findAlerta(resultado, regraId) {
  return resultado.alertas.find((alerta) => alerta.regra_id === regraId);
}

async function request(app, path, options = {}) {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
    const body = await response.json();
    return { status: response.status, body, headers: response.headers };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function createAlertasApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/alertas-seguranca', alertasRouter);
  return app;
}

test('verificar exposes deterministic, no-AI contract for alpha fixture', () => {
  const resultado = motor.verificar({ termo: 'ginkgo varfarina' });
  const alerta = findAlerta(resultado, 'FITOTERAPIA_ANTICOAGULANTE_001');

  assert.equal(resultado.motor, 'deterministico_if_then');
  assert.equal(resultado.usa_ia, false);
  assert.equal(resultado.total_regras, motor.REGRAS_SEGURANCA.length);
  assert.ok(resultado.total_alertas > 0);
  assert.ok(alerta, 'expected documented ginkgo + varfarina rule to match');
  assert.equal(alerta.gravidade, 'alta');
});

test('verificar matches every configured safety rule with a representative risk fixture', () => {
  for (const caso of RULE_CASES) {
    const resultado = motor.verificar(caso.contexto);
    const alerta = findAlerta(resultado, caso.regraId);

    assert.ok(alerta, `expected ${caso.regraId} to match ${caso.name}`);
    assert.equal(alerta.gravidade, caso.gravidade);
    assert.ok(alerta.fontes.length > 0, `${caso.regraId} should remain source-traceable`);
    assert.ok(alerta.conduta, `${caso.regraId} should include a clinical conduct`);
  }
});

test('verificar normalizes accents and separates comma, semicolon, pipe, and newline input', () => {
  assert.deepEqual(motor.normalizarEntrada('Ginkgo Biloba, Varfarina; AAS|Própolis\nGestação'), [
    'ginkgo biloba',
    'varfarina',
    'aas',
    'propolis',
    'gestacao'
  ]);
});

test('verificar sorts critical alerts ahead of lower severity matches', () => {
  const resultado = motor.verificar({
    pratica: 'consulta integrativa com ginkgo',
    medicamentos: ['varfarina'],
    condicoes: ['dor toracica']
  });

  assert.equal(resultado.maior_gravidade, 'critica');
  assert.equal(resultado.alertas[0].gravidade, 'critica');
  assert.deepEqual(
    resultado.alertas.map((alerta) => alerta.regra_id),
    ['SINAIS_ALARME_URGENCIA_001', 'FITOTERAPIA_ANTICOAGULANTE_001']
  );
});

test('verificar does not imply clinical clearance when no rule matches', () => {
  const resultado = motor.verificar({
    pratica: 'respiracao leve',
    condicoes: ['sem queixas relevantes']
  });

  assert.equal(resultado.total_alertas, 0);
  assert.equal(resultado.maior_gravidade, 'sem_alerta_critico');
  assert.match(resultado.mensagem_geral, /nao significa liberacao clinica automatica/i);
});

test('/api/alertas-seguranca/regras rejects anonymous and non-admin access', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-alertas';

  try {
    const app = createAlertasApp();
    const anonymous = await request(app, '/api/alertas-seguranca/regras');
    assert.equal(anonymous.status, 401);

    const token = jwt.sign({ id: 123, tipo: 'profissional' }, process.env.JWT_SECRET);
    const nonAdmin = await request(app, '/api/alertas-seguranca/regras', {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(nonAdmin.status, 403);
  } finally {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  }
});

test('/api/alertas-seguranca/regras returns source summaries for admin access only', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-alertas';

  try {
    const app = createAlertasApp();
    const token = jwt.sign({ id: 1, tipo: 'admin' }, process.env.JWT_SECRET);
    const response = await request(app, '/api/alertas-seguranca/regras', {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.usa_ia, false);
    assert.equal(response.body.total, motor.REGRAS_SEGURANCA.length);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(
      Object.keys(response.body.regras[0]).sort(),
      ['area', 'fontes', 'gravidade', 'id', 'tipo']
    );
  } finally {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  }
});
