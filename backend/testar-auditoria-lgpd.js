#!/usr/bin/env node
/**
 * Testes locais da auditoria LGPD (JSONL + sanitização).
 * Não exige DATABASE_URL para os testes de arquivo.
 */
require('dotenv').config();
process.env.AUDITORIA_LGPD_ATIVA = process.env.AUDITORIA_LGPD_ATIVA || 'true';

const fs = require('fs');
const auditoria = require('./servicos/auditoria-lgpd');

let falhas = 0;

function ok(nome, condicao, detalhe = '') {
  if (condicao) {
    console.log(`✅ ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
    return;
  }
  falhas += 1;
  console.error(`❌ ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

function assertIgual(nome, obtido, esperado) {
  ok(nome, obtido === esperado, `obtido=${obtido} esperado=${esperado}`);
}

async function main() {
  console.log('=== Testes auditoria LGPD ===\n');

  assertIgual(
    'mascararEmail',
    auditoria.mascararEmail('profissional@demo.com'),
    'pr***@demo.com'
  );

  const evento = auditoria.montarEvento({
    categoria: auditoria.CATEGORIAS.SISTEMA,
    acao: 'teste_local',
    finalidade: 'validacao do gravador',
    email: 'teste@integrativo.app',
    detalhes: { cpf: '12345678900', observacao: 'ok' }
  });

  ok('evento montado', !!evento.evento_id);
  assertIgual('cpf omitido nos detalhes', evento.detalhes.cpf, '[omitido]');
  assertIgual('email mascarado no ator', evento.ator.email_mascarado, 'te***@integrativo.app');

  await auditoria.garantirInfraestrutura();

  const resultado = await auditoria.registrarAguardar({
    categoria: auditoria.CATEGORIAS.SISTEMA,
    acao: 'teste_local',
    finalidade: 'validacao do gravador',
    email: 'teste@integrativo.app',
    detalhes: { origem: 'testar-auditoria-lgpd.js' }
  });

  ok('registro aguardado', !!resultado?.evento_id, resultado?.evento_id);
  ok('arquivo gravado', fs.existsSync(resultado.arquivo), resultado.arquivo);

  const hoje = new Date().toISOString().slice(0, 10);
  const leitura = auditoria.lerArquivoPorData(hoje);
  ok('leitura do arquivo do dia', leitura.eventos.length > 0, `${leitura.eventos.length} evento(s)`);

  const ultimo = leitura.eventos[leitura.eventos.length - 1];
  assertIgual('ultimo evento acao', ultimo.acao, 'teste_local');
  assertIgual('ultimo evento schema', ultimo.schema, auditoria.SCHEMA_VERSAO);

  const arquivos = auditoria.listarArquivosDisponiveis();
  ok('listagem de arquivos', arquivos.length > 0, `${arquivos.length} arquivo(s)`);

  if (auditoria.temBancoConfigurado()) {
    try {
      const rows = await auditoria.listar({ limite: 5 });
      ok('espelho PostgreSQL', Array.isArray(rows), `${rows.length} linha(s)`);
    } catch (error) {
      falhas += 1;
      console.error(`❌ espelho PostgreSQL — ${error.message}`);
    }
  } else {
    console.log('ℹ️ DATABASE_URL ausente — teste de arquivo concluído sem PostgreSQL.');
  }

  console.log(`\n=== Resultado: ${falhas === 0 ? 'SUCESSO' : `${falhas} falha(s)`} ===`);
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('Erro fatal nos testes:', error);
  process.exit(1);
});
