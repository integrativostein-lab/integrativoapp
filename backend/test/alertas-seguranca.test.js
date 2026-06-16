const assert = require('node:assert/strict');
const test = require('node:test');

const { verificar, normalizarEntrada, REGRAS_SEGURANCA } = require('../servicos/alertas-seguranca');

test('normalizarEntrada handles delimiters, accents, whitespace, and empty values', () => {
  assert.deepEqual(
    normalizarEntrada('  Gestação; Varfarina\nPrópolis |  '),
    ['gestacao', 'varfarina', 'propolis']
  );

  assert.deepEqual(
    normalizarEntrada([' Óleo Essencial ', '', null, 'Convulsão']),
    ['oleo essencial', 'convulsao']
  );
});

test('verificar flags anticoagulant interaction only when practice and medication both match', () => {
  const semMedicamento = verificar({
    pratica: 'Fitoterapia com ginkgo biloba',
    medicamentos: 'vitamina d'
  });

  assert.equal(
    semMedicamento.alertas.some((alerta) => alerta.regra_id === 'FITOTERAPIA_ANTICOAGULANTE_001'),
    false
  );

  const resultado = verificar({
    pratica: 'Fitoterapia com Ginkgo Biloba',
    paciente: {
      medicamentos: ['Varfarina']
    }
  });

  const alerta = resultado.alertas.find(
    (item) => item.regra_id === 'FITOTERAPIA_ANTICOAGULANTE_001'
  );

  assert.ok(alerta);
  assert.equal(alerta.gravidade, 'alta');
  assert.equal(alerta.divergencia.divergente, false);
  assert.equal(alerta.divergencia.posicao_mais_restritiva, 'cautela');
  assert.equal(alerta.decisao, 'alertar_e_revisar');
});

test('verificar applies most restrictive source position when sources diverge', () => {
  const resultado = verificar({
    pratica: 'Aromaterapia com óleo essencial de alecrim',
    condicoes: 'Histórico de convulsão'
  });

  assert.equal(resultado.total_alertas, 1);
  assert.equal(resultado.maior_gravidade, 'alta');
  assert.deepEqual(resultado.alertas[0].divergencia, {
    divergente: true,
    posicao_mais_restritiva: 'contraindicado'
  });
  assert.equal(resultado.alertas[0].decisao, 'prevalece_conduta_mais_restritiva');
});

test('verificar sorts critical alerts before high-severity alerts deterministically', () => {
  const resultado = verificar({
    pratica: 'Massoterapia e fitoterapia com ginkgo',
    condicoes: 'suspeita de trombose',
    medicamentos: 'varfarina'
  });

  assert.equal(resultado.total_alertas, 2);
  assert.equal(resultado.maior_gravidade, 'critica');
  assert.deepEqual(
    resultado.alertas.map((alerta) => alerta.regra_id),
    ['MASSOTERAPIA_TROMBOSE_001', 'FITOTERAPIA_ANTICOAGULANTE_001']
  );
});

test('verificar catches generic urgent warning signs regardless of specific practice', () => {
  const resultado = verificar({
    pratica: 'consulta integrativa',
    observacoes: 'Paciente relata dor torácica e falta de ar.'
  });

  assert.equal(resultado.total_alertas, 1);
  assert.equal(resultado.alertas[0].regra_id, 'SINAIS_ALARME_URGENCIA_001');
  assert.equal(resultado.alertas[0].gravidade, 'critica');
  assert.equal(resultado.alertas[0].decisao, 'prevalece_conduta_mais_restritiva');
});

test('verificar returns explicit no-alert state without implying clinical clearance', () => {
  const resultado = verificar({
    pratica: 'meditacao',
    observacoes: 'relaxamento leve'
  });

  assert.equal(resultado.motor, 'deterministico_if_then');
  assert.equal(resultado.usa_ia, false);
  assert.equal(resultado.total_regras, REGRAS_SEGURANCA.length);
  assert.equal(resultado.total_alertas, 0);
  assert.equal(resultado.maior_gravidade, 'sem_alerta_critico');
  assert.match(resultado.mensagem_geral, /não significa liberação clínica automática/i);
  assert.deepEqual(resultado.alertas, []);
});
