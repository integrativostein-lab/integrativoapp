const test = require('node:test');
const assert = require('node:assert/strict');

const motor = require('../servicos/alertas-seguranca');

test('normalizarEntrada removes accents, separators, and empty values', () => {
  assert.deepEqual(
    motor.normalizarEntrada('  Epilepsia; Convulsão,  crise convulsiva |  '),
    ['epilepsia', 'convulsao', 'crise convulsiva']
  );
});

test('verificar flags documented fitoterapia and anticoagulant interaction', () => {
  const resultado = motor.verificar({
    pratica: 'Ginkgo biloba',
    medicamentos: ['Varfarina']
  });

  assert.equal(resultado.usa_ia, false);
  assert.equal(resultado.maior_gravidade, 'alta');
  assert.equal(resultado.total_alertas, 1);
  assert.equal(resultado.alertas[0].regra_id, 'FITOTERAPIA_ANTICOAGULANTE_001');
  assert.equal(resultado.alertas[0].decisao, 'alertar_e_revisar');
});

test('verificar does not match interaction when only the practice is present', () => {
  const resultado = motor.verificar({ pratica: 'Ginkgo biloba' });

  assert.equal(resultado.total_alertas, 0);
  assert.equal(resultado.maior_gravidade, 'sem_alerta_critico');
});

test('verificar applies the most restrictive decision when sources diverge', () => {
  const resultado = motor.verificar({
    pratica: 'Apiterapia com mel',
    alergias: ['própolis']
  });

  assert.equal(resultado.maior_gravidade, 'critica');
  assert.equal(resultado.alertas[0].regra_id, 'APITERAPIA_ALERGIA_001');
  assert.deepEqual(resultado.alertas[0].divergencia, {
    divergente: true,
    posicao_mais_restritiva: 'contraindicado'
  });
  assert.equal(resultado.alertas[0].decisao, 'prevalece_conduta_mais_restritiva');
});

test('verificar returns critical alerts before high-severity alerts deterministically', () => {
  const resultado = motor.verificar({
    pratica: 'Yoga e massoterapia',
    condicoes: ['dor torácica', 'trombose', 'hipertensão não controlada']
  });

  assert.deepEqual(
    resultado.alertas.map((alerta) => alerta.regra_id),
    [
      'MASSOTERAPIA_TROMBOSE_001',
      'SINAIS_ALARME_URGENCIA_001',
      'YOGA_CARDIOVASCULAR_001'
    ]
  );
  assert.equal(resultado.maior_gravidade, 'critica');
});
