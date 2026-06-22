// Limites e metadados do catálogo — lidos de shared/catalogo-terapeutico.json.
// Atualize a matriz em frontend/js/config.js e execute: npm run catalogo:sync
const fs = require('fs');
const path = require('path');

const CAMINHO_JSON = path.join(__dirname, '../../shared/catalogo-terapeutico.json');

function carregarCatalogoJson() {
  if (!fs.existsSync(CAMINHO_JSON)) {
    throw new Error(
      `Arquivo ${CAMINHO_JSON} não encontrado. Execute: npm run catalogo:sync`
    );
  }
  return JSON.parse(fs.readFileSync(CAMINHO_JSON, 'utf8'));
}

const catalogo = carregarCatalogoJson();
const contagens = catalogo.contagens;
const { normalizarPlano } = require('./planos');

const LIMITES_BIBLIOTECAS_PLANO = {
  ...catalogo.limitesBibliotecasPlano,
  enterprise: contagens.bibliotecasPorPratica
};

const META_CATALOGO = {
  totalBibliotecas: contagens.totalBibliotecas,
  bibliotecasPorPratica: contagens.bibliotecasPorPratica,
  bibliotecasTransversais: contagens.bibliotecasTransversais,
  totalEspecialidadesCadastro: contagens.totalEspecialidadesCadastro,
  registrosBase: contagens.registrosBase,
  registrosBlocos: contagens.registrosBlocos,
  protocolosCriados: contagens.protocolosCriados,
  totalRegistros: contagens.totalRegistros,
  especialidadesBancoSeed: contagens.especialidadesBancoSeed,
  especialidadesProtocolos: contagens.especialidadesProtocolos
};

function limiteBibliotecasPorPlano(plano) {
  const chave = normalizarPlano(String(plano || 'freemium').trim());
  return LIMITES_BIBLIOTECAS_PLANO[chave] ?? LIMITES_BIBLIOTECAS_PLANO.freemium;
}

module.exports = {
  ...LIMITES_BIBLIOTECAS_PLANO,
  LIMITES_BIBLIOTECAS_PLANO,
  META_CATALOGO,
  limiteBibliotecasPorPlano,
  carregarCatalogoJson
};
