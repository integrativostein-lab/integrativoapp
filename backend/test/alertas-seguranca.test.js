const assert = require('node:assert/strict');
const test = require('node:test');

const motor = require('../servicos/alertas-seguranca');

test('normalizarEntrada remove acentos e separa listas por delimitadores aceitos', () => {
  assert.deepEqual(
    motor.normalizarEntrada('Gestação; Dor torácica | falta de ar\nAlergia grave'),
    ['gestacao', 'dor toracica', 'falta de ar', 'alergia grave']
  );
});

test('verificar exige pratica e fator de risco para alertas especificos de interacao', () => {
  const somentePratica = motor.verificar({
    pratica: 'Fitoterapia com ginkgo biloba'
  });

  assert.equal(somentePratica.total_alertas, 0);
  assert.equal(somentePratica.maior_gravidade, 'sem_alerta_critico');

  const comMedicamento = motor.verificar({
    pratica: 'Fitoterapia com ginkgo biloba',
    medicamentos: ['Varfarina']
  });

  assert.equal(comMedicamento.total_alertas, 1);
  assert.equal(comMedicamento.maior_gravidade, 'alta');
  assert.equal(comMedicamento.alertas[0].regra_id, 'FITOTERAPIA_ANTICOAGULANTE_001');
});

test('verificar combina campos aninhados do paciente e prioriza gravidade critica', () => {
  const resultado = motor.verificar({
    pratica: 'Massoterapia com aromaterapia',
    paciente: {
      condicoes: ['Histórico de trombose', 'epilepsia']
    }
  });

  assert.deepEqual(
    resultado.alertas.map((alerta) => alerta.regra_id),
    ['MASSOTERAPIA_TROMBOSE_001', 'AROMATERAPIA_EPILEPSIA_001']
  );
  assert.equal(resultado.maior_gravidade, 'critica');
  assert.equal(resultado.alertas[0].peso > resultado.alertas[1].peso, true);
});

test('verificar aplica regra transversal de urgencia mesmo sem pratica especifica', () => {
  const resultado = motor.verificar({
    observacoes: 'Paciente relata dispneia e febre alta durante triagem.'
  });

  assert.equal(resultado.total_alertas, 1);
  assert.equal(resultado.alertas[0].regra_id, 'SINAIS_ALARME_URGENCIA_001');
  assert.equal(resultado.alertas[0].decisao, 'prevalece_conduta_mais_restritiva');
  assert.equal(resultado.alertas[0].divergencia.posicao_mais_restritiva, 'contraindicado');
});
