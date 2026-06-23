const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const express = require('express');

const ambiente = require('../config/ambiente');
const { analisar, anamneseParaContextoAlertas } = require('../servicos/auto-diagnostico');
const autoDiagnosticoRouter = require('../rotas/auto-diagnostico');

function regraIds(resultado) {
  return resultado.vertentes.map((item) => item.regra_id);
}

function alertaIds(resultado) {
  return resultado.seguranca.alertas.map((item) => item.regra_id);
}

function requestJson(app, payload) {
  const server = app.listen(0);
  const { port } = server.address();

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method: 'POST',
        host: '127.0.0.1',
        port,
        path: '/auto-diagnostico/analisar',
        headers: { 'Content-Type': 'application/json' }
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          server.close(() => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: raw ? JSON.parse(raw) : null
            });
          });
        });
      }
    );

    req.on('error', (err) => {
      server.close(() => reject(err));
    });
    req.write(JSON.stringify(payload));
    req.end();
  });
}

function montarApp() {
  const app = express();
  app.use(express.json());
  app.use('/auto-diagnostico', autoDiagnosticoRouter);
  return app;
}

test('analisar limpa campos desconhecidos, valores vazios e textos longos', () => {
  const textoLongo = `  ${'sono '.repeat(2000)}  `;

  const resultado = analisar({
    campo_inexistente: 'nao deve aparecer',
    qualidade_sono: '  Ruim  ',
    objetivos_paciente: textoLongo,
    medicamentos_uso: '   '
  });

  const resumoPorId = Object.fromEntries(resultado.resumo.map((item) => [item.id, item.valor]));

  assert.equal(resultado.motor, 'deterministico_if_then');
  assert.equal(resultado.usa_ia, false);
  assert.ok(regraIds(resultado).includes('OCIDENTAL_SONO_001'));
  assert.equal(resumoPorId.qualidade_sono, 'Ruim');
  assert.equal(resumoPorId.objetivos_paciente.length, 8000);
  assert.equal(resumoPorId.campo_inexistente, undefined);
  assert.equal(resumoPorId.medicamentos_uso, undefined);
});

test('analisar reconhece sinais urgentes com acentos nas orientacoes e alertas', () => {
  const resultado = analisar({
    queixa_principal: 'Dor torácica com falta de ar',
    hda_resumo: 'Paciente relata ideação suicida recente.'
  });

  assert.ok(regraIds(resultado).includes('INTEGRATIVA_URGENCIA_001'));
  assert.ok(alertaIds(resultado).includes('SINAIS_ALARME_URGENCIA_001'));
  assert.equal(resultado.seguranca.maior_gravidade, 'critica');
});

test('anamneseParaContextoAlertas normaliza medicamentos, condicoes e alergias', () => {
  const contexto = anamneseParaContextoAlertas({
    queixa_principal: 'Apiterapia',
    doencas_cronicas: 'Diabetes; Hipertensão',
    medicamentos_uso: 'Varfarina, AAS',
    alergias_medicamentos: 'Anafilaxia',
    alergias_alimentos: 'Mel'
  });

  assert.deepEqual(contexto.condicoes, ['diabetes', 'hipertensao', 'apiterapia']);
  assert.deepEqual(contexto.medicamentos, ['varfarina', 'aas']);
  assert.deepEqual(contexto.alergias, ['anafilaxia', 'mel']);
});

test('rota /auto-diagnostico/analisar bloqueia ambiente alfa', async () => {
  const modoTesteOriginal = ambiente.modoTeste;
  ambiente.modoTeste = true;

  try {
    const resposta = await requestJson(montarApp(), { respostas: { queixa_principal: 'sono ruim' } });

    assert.equal(resposta.statusCode, 404);
    assert.deepEqual(resposta.body, { erro: 'Autoavaliação indisponível neste ambiente.' });
  } finally {
    ambiente.modoTeste = modoTesteOriginal;
  }
});

test('rota /auto-diagnostico/analisar retorna no-store fora do alfa', async () => {
  const modoTesteOriginal = ambiente.modoTeste;
  ambiente.modoTeste = false;

  try {
    const resposta = await requestJson(montarApp(), { respostas: { qualidade_sono: 'ruim' } });

    assert.equal(resposta.statusCode, 200);
    assert.equal(resposta.headers['cache-control'], 'no-store');
    assert.equal(resposta.body.motor, 'deterministico_if_then');
    assert.ok(regraIds(resposta.body).includes('OCIDENTAL_SONO_001'));
  } finally {
    ambiente.modoTeste = modoTesteOriginal;
  }
});
