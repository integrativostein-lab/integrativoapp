/**
 * Hostnames oficiais de produção — compartilhado por config, landing e modo-lancamento.
 */
(function (global) {
  var HOSTNAMES_PRODUCAO = [
    'integrativo.app',
    'www.integrativo.app',
    'integrativo.app.br',
    'www.integrativo.app.br',
    'integrativoapp.com',
    'www.integrativoapp.com',
    'integrativoapp.com.br',
    'www.integrativoapp.com.br',
    'integra-saude-psi.vercel.app',
    'integra-saude-psi-iota.vercel.app'
  ];

  function normalizarHost(hostname) {
    return String(hostname || '').toLowerCase();
  }

  function ehProducao(hostname) {
    var h = normalizarHost(hostname);
    if (!h) return false;
    return HOSTNAMES_PRODUCAO.indexOf(h) >= 0;
  }

  global.SiteAmbiente = {
    HOSTNAMES_PRODUCAO: HOSTNAMES_PRODUCAO,
    ehProducao: ehProducao
  };
})(typeof window !== 'undefined' ? window : global);
