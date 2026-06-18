const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  normalizarEntrada,
  verificar
} = require('../servicos/alertas-seguranca');

function buscarAlerta(resultado, regraId) {
  return resultado.alertas.find((alerta) => alerta.regra_id === regraId);
}

describe('servico de alertas de seguranca', () => {
  it('normaliza entradas removendo acentos, caixa e separadores comuns', () => {
    assert.deepEqual(
      normalizarEntrada('Ginkgo, VARFARÍNA\nAAS; Mel|'),
      ['ginkgo', 'varfarina', 'aas', 'mel']
    );
  });

  it('identifica interacao documentada entre ginkgo e varfarina sem usar IA', () => {
    const resultado = verificar({ termo: 'ginkgo varfarina' });

    assert.equal(resultado.motor, 'deterministico_if_then');
    assert.equal(resultado.usa_ia, false);
    assert.equal(resultado.total_alertas, 1);
    assert.equal(resultado.maior_gravidade, 'alta');

    const alerta = buscarAlerta(resultado, 'FITOTERAPIA_ANTICOAGULANTE_001');
    assert.ok(alerta);
    assert.equal(alerta.tipo, 'interacao');
    assert.equal(alerta.gravidade, 'alta');
    assert.equal(alerta.divergencia.divergente, false);
  });

  it('nao alerta somente pela pratica quando regra tambem exige medicamento, condicao ou alergia', () => {
    const resultado = verificar({ termo: 'ginkgo' });

    assert.equal(resultado.total_alertas, 0);
    assert.match(
      resultado.mensagem_geral,
      /Isso não significa liberação clínica automática/
    );
  });

  it('eleva alergia a produtos apicolas como alerta critico', () => {
    const resultado = verificar({
      pratica: 'apiterapia',
      alergias: ['mel']
    });

    assert.equal(resultado.total_alertas, 1);
    assert.equal(resultado.maior_gravidade, 'critica');

    const alerta = buscarAlerta(resultado, 'APITERAPIA_ALERGIA_001');
    assert.ok(alerta);
    assert.equal(alerta.gravidade, 'critica');
    assert.equal(alerta.decisao, 'prevalece_conduta_mais_restritiva');
  });

  it('aciona sinais de urgencia mesmo sem pratica especifica', () => {
    const resultado = verificar({ condicoes: ['dor toracica'] });

    assert.equal(resultado.total_alertas, 1);
    assert.equal(resultado.maior_gravidade, 'critica');
    assert.ok(buscarAlerta(resultado, 'SINAIS_ALARME_URGENCIA_001'));
  });

  it('marca divergencia quando fontes variam entre contraindicado e sem mencao', () => {
    const resultado = verificar({
      pratica: 'aromaterapia',
      condicoes: ['epilepsia']
    });

    const alerta = buscarAlerta(resultado, 'AROMATERAPIA_EPILEPSIA_001');
    assert.ok(alerta);
    assert.equal(alerta.divergencia.divergente, true);
    assert.equal(alerta.divergencia.posicao_mais_restritiva, 'contraindicado');
    assert.equal(alerta.decisao, 'prevalece_conduta_mais_restritiva');
  });

  it('ordena multiplos alertas por gravidade e depois por identificador', () => {
    const resultado = verificar({
      termo: 'ginkgo varfarina apiterapia mel dor toracica'
    });

    assert.deepEqual(
      resultado.alertas.map((alerta) => alerta.regra_id),
      [
        'APITERAPIA_ALERGIA_001',
        'SINAIS_ALARME_URGENCIA_001',
        'FITOTERAPIA_ANTICOAGULANTE_001'
      ]
    );
  });
});
