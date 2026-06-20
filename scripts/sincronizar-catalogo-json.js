#!/usr/bin/env node
/**
 * Gera shared/catalogo-terapeutico.json a partir de frontend/js/config.js.
 * Execute após alterar a matriz de bibliotecas ou limites de plano.
 */
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const caminhoConfig = path.join(raiz, 'frontend', 'js', 'config.js');
const caminhoJsonShared = path.join(raiz, 'shared', 'catalogo-terapeutico.json');
const caminhoJsonFrontend = path.join(raiz, 'frontend', 'catalogo-terapeutico.json');

function carregarConfig() {
  delete require.cache[require.resolve(caminhoConfig)];
  return require(caminhoConfig);
}

function carregarJsonAtual() {
  if (!fs.existsSync(caminhoJsonShared)) return null;
  return JSON.parse(fs.readFileSync(caminhoJsonShared, 'utf8'));
}

function montarJson(config, anterior) {
  const bt = config.BIBLIOTECAS_TERAPEUTICAS;
  const categoriaTransversal = anterior?.categoriaTransversal || 'Biblioteca transversal';
  const bibliotecasTransversais = bt.matriz.filter(
    (item) => item.categoria === categoriaTransversal
  ).length;
  const totalBibliotecas = bt.matriz.length;
  const bibliotecasPorPratica = totalBibliotecas - bibliotecasTransversais;

  const registrosBase = anterior?.contagens?.registrosBase ?? bt.registros_base ?? 781;
  const registrosBlocos = anterior?.contagens?.registrosBlocos ?? bt.registros_blocos ?? 170;
  const protocolosCriados = anterior?.contagens?.protocolosCriados ?? bt.protocolos_criados ?? 240;

  return {
    versao: new Date().toISOString().slice(0, 10),
    categoriaTransversal,
    limitesBibliotecasPlano: anterior?.limitesBibliotecasPlano || {
      freemium: 1,
      guardioes_floresta: 5,
      pro: 10,
      premium: 20
    },
    aliasesBibliotecas: anterior?.aliasesBibliotecas || {
      'Medicina Tradicional Chinesa': 'MTC',
      'Yoga (instrutor)': 'Yoga',
      'Médico (clínico geral)': 'Medicina Tradicional',
      'Psicólogo(a)': 'Saúde Mental',
      'Enfermeiro(a)': 'Enfermagem',
      'Odontólogo(a)': 'Odontologia',
      'Farmacêutico(a)': 'Farmacologia',
      'Educador Físico': 'Atividade Física'
    },
    contagens: {
      totalBibliotecas,
      bibliotecasTransversais,
      bibliotecasPorPratica,
      totalEspecialidadesCadastro: config.ESPECIALIDADES.length,
      totalItensCatalogo: bt.itens.length,
      registrosBase,
      registrosBlocos,
      protocolosCriados,
      totalRegistros: registrosBase + registrosBlocos + protocolosCriados,
      especialidadesBancoSeed: anterior?.contagens?.especialidadesBancoSeed ?? 30,
      especialidadesProtocolos: anterior?.contagens?.especialidadesProtocolos ?? 47
    }
  };
}

function main() {
  const config = carregarConfig();
  const anterior = carregarJsonAtual();
  const json = montarJson(config, anterior);
  const conteudo = `${JSON.stringify(json, null, 2)}\n`;

  fs.mkdirSync(path.dirname(caminhoJsonShared), { recursive: true });
  fs.writeFileSync(caminhoJsonShared, conteudo, 'utf8');
  fs.writeFileSync(caminhoJsonFrontend, conteudo, 'utf8');

  console.log('✅ Catálogo JSON sincronizado');
  console.log(`   shared/catalogo-terapeutico.json`);
  console.log(`   frontend/catalogo-terapeutico.json`);
  console.log(`   bibliotecas: ${json.contagens.totalBibliotecas} (${json.contagens.bibliotecasPorPratica} prática + ${json.contagens.bibliotecasTransversais} transversais)`);
  console.log(`   especialidades cadastro: ${json.contagens.totalEspecialidadesCadastro}`);
  console.log(`   enterprise (limite): ${json.contagens.bibliotecasPorPratica}`);
}

main();
