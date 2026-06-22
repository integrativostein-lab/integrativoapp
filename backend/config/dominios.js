/**
 * Domínios oficiais de produção (2026).
 * Canônico: integrativo.app — demais fazem redirect na Vercel.
 */
const SITE_CANONICO = 'https://integrativo.app';

const ORIGENS_PRODUCAO = [
  'https://integrativo.app',
  'https://www.integrativo.app',
  'https://integrativo.app.br',
  'https://www.integrativo.app.br',
  'https://integrativoapp.com',
  'https://www.integrativoapp.com',
  'https://integrativoapp.com.br',
  'https://www.integrativoapp.com.br',
  'https://integra-saude-psi.vercel.app',
  'https://integra-saude-psi-iota.vercel.app'
];

/** Frontends do ambiente alfa / teste (banner + API espelho). */
const ORIGENS_ALFA = [
  'https://integrativoapp-alfa.vercel.app',
  'https://alfa.integrativoapp.com',
  'https://www.alfa.integrativoapp.com',
  'https://teste.integrativoapp.com',
  'https://www.teste.integrativoapp.com'
];

const CORS_PRODUCAO = ORIGENS_PRODUCAO.join(',');
const CORS_ALFA = ORIGENS_ALFA.join(',');

module.exports = {
  SITE_CANONICO,
  ORIGENS_PRODUCAO,
  ORIGENS_ALFA,
  CORS_PRODUCAO,
  CORS_ALFA
};
