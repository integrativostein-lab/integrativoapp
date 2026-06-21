(function (global) {
  const path = typeof require !== 'undefined' ? require('path') : null;
  let metaCache = null;

  const LIMITES_FALLBACK = {
    freemium: 1,
    guardioes_floresta: 5,
    pro: 10,
    premium: 20
  };

  function resolverCaminhoJson() {
    if (path) {
      return path.join(__dirname, '../../shared/catalogo-terapeutico.json');
    }
    if (typeof window !== 'undefined' && window.location) {
      const base = window.location.pathname.replace(/\/[^/]*$/, '/');
      return `${base}catalogo-terapeutico.json`;
    }
    return 'catalogo-terapeutico.json';
  }

  function carregarMeta() {
    if (metaCache) return metaCache;

    if (typeof window !== 'undefined' && window.CATALOGO_TERAPEUTICO_META) {
      metaCache = window.CATALOGO_TERAPEUTICO_META;
      return metaCache;
    }

    if (typeof require !== 'undefined' && typeof window === 'undefined') {
      metaCache = require(resolverCaminhoJson());
      return metaCache;
    }

    if (typeof XMLHttpRequest !== 'undefined') {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', resolverCaminhoJson(), false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          metaCache = JSON.parse(xhr.responseText);
          return metaCache;
        }
      } catch (error) {
        console.warn('[CatalogoTerapeutico] Falha ao carregar JSON:', error.message);
      }
    }

    return null;
  }

  function getMeta() {
    return metaCache || carregarMeta();
  }

  function getCategoriaTransversal(meta) {
    return (meta || getMeta())?.categoriaTransversal || 'Biblioteca transversal';
  }

  function getAliases(meta) {
    return (meta || getMeta())?.aliasesBibliotecas || {};
  }

  function getLimitesBase(meta) {
    return (meta || getMeta())?.limitesBibliotecasPlano || LIMITES_FALLBACK;
  }

  function normalizarTexto(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function resolverNomesBibliotecas(nomes, aliases) {
    const mapa = aliases || getAliases();
    return (nomes || []).map((nome) => mapa[nome] || nome);
  }

  function bibliotecaCorresponde(item, nomes, aliases) {
    const alvo = normalizarTexto(item.especialidade);
    const nomesResolvidos = resolverNomesBibliotecas(nomes, aliases);
    return nomesResolvidos.some((nome) => {
      const comparacao = normalizarTexto(nome);
      return alvo === comparacao || alvo.includes(comparacao) || comparacao.includes(alvo);
    });
  }

  function isTransversal(item, meta) {
    return item.categoria === getCategoriaTransversal(meta);
  }

  function filtrarPorTermo(lista, termo, camposFn) {
    const busca = normalizarTexto(termo);
    if (!busca) return lista;
    return lista.filter((item) => normalizarTexto(camposFn(item)).includes(busca));
  }

  function aplicarContagensDaMatriz(config, bt) {
    bt.total_bibliotecas = bt.matriz.length;
    bt.total_especialidades = config.ESPECIALIDADES.length;
    bt.bibliotecas_transversais = bt.matriz.filter((item) => isTransversal(item)).length;
    bt.bibliotecas_por_pratica = bt.total_bibliotecas - bt.bibliotecas_transversais;
    bt.total_itens_catalogo = bt.itens.length;
    bt.total_registros = bt.registros_base + bt.registros_blocos + bt.protocolos_criados;
  }

  function aplicarContagensDoJson(bt, contagens) {
    bt.total_bibliotecas = contagens.totalBibliotecas;
    bt.total_especialidades = contagens.totalEspecialidadesCadastro;
    bt.bibliotecas_transversais = contagens.bibliotecasTransversais;
    bt.bibliotecas_por_pratica = contagens.bibliotecasPorPratica;
    bt.total_itens_catalogo = contagens.totalItensCatalogo;
    bt.registros_base = contagens.registrosBase;
    bt.registros_blocos = contagens.registrosBlocos;
    bt.protocolos_criados = contagens.protocolosCriados;
    bt.total_registros = contagens.totalRegistros;
    bt.especialidades_banco_seed = contagens.especialidadesBancoSeed;
    bt.especialidades_protocolos = contagens.especialidadesProtocolos;
  }

  function sincronizar(config, metaOptional) {
    if (!config || !config.BIBLIOTECAS_TERAPEUTICAS) return config;

    const meta = metaOptional || getMeta();
    const bt = config.BIBLIOTECAS_TERAPEUTICAS;

    if (meta?.contagens) {
      aplicarContagensDoJson(bt, meta.contagens);
      if (bt.matriz.length !== meta.contagens.totalBibliotecas) {
        console.warn(
          `[CatalogoTerapeutico] Matriz (${bt.matriz.length}) difere do JSON (${meta.contagens.totalBibliotecas}). Execute: npm run catalogo:sync`
        );
      }
    } else {
      aplicarContagensDaMatriz(config, bt);
    }

    config.LIMITES_BIBLIOTECAS_PLANO = {
      ...getLimitesBase(meta),
      enterprise: bt.bibliotecas_por_pratica
    };

    Object.entries(config.LIMITES_BIBLIOTECAS_PLANO).forEach(([plano, limite]) => {
      if (config.PLANOS[plano]) {
        config.PLANOS[plano].especialidades_inclusas = limite;
      }
    });

    return config;
  }

  function htmlMetricasResumo(bt) {
    return `
      <div class="metrica"><strong>${bt.total_bibliotecas}</strong><span>Bibliotecas</span></div>
      <div class="metrica"><strong>${bt.total_especialidades}</strong><span>Especialidades</span></div>
      <div class="metrica"><strong>${Number(bt.total_registros).toLocaleString('pt-BR')}</strong><span>Registros</span></div>
      <div class="metrica"><strong>${bt.fontes.length}</strong><span>Fontes-base</span></div>
    `;
  }

  function aplicarEstatisticasHome(config, ids = {}) {
    const bt = config.BIBLIOTECAS_TERAPEUTICAS;
    const map = {
      bibliotecas: bt.total_bibliotecas,
      especialidades: bt.total_especialidades,
      registros: Number(bt.total_registros).toLocaleString('pt-BR'),
      fontes: bt.fontes.length
    };
    Object.entries({
      bibliotecas: ids.bibliotecas || 'stat-bibliotecas',
      especialidades: ids.especialidades || 'stat-especialidades',
      registros: ids.registros || 'stat-registros',
      fontes: ids.fontes || 'stat-fontes'
    }).forEach(([chave, id]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = map[chave];
    });
  }

  function limitePlano(config, plano) {
    const chave = plano || 'freemium';
    return config.PLANOS[chave]?.especialidades_inclusas
      ?? config.LIMITES_BIBLIOTECAS_PLANO?.[chave]
      ?? 1;
  }

  function getMetricas(config) {
    const bt = config?.BIBLIOTECAS_TERAPEUTICAS || {};
    const limites = config?.LIMITES_BIBLIOTECAS_PLANO || {};
    return {
      bibliotecas: bt.total_bibliotecas || 0,
      especialidades: bt.total_especialidades || config?.ESPECIALIDADES?.length || 0,
      registros: bt.total_registros || 0,
      registrosFmt: Number(bt.total_registros || 0).toLocaleString('pt-BR'),
      transversais: bt.bibliotecas_transversais || 0,
      porPratica: bt.bibliotecas_por_pratica || 0,
      fontes: bt.fontes?.length || 0,
      limiteFreemium: limites.freemium ?? 1,
      limiteGuardioes: limites.guardioes_floresta ?? 5,
      limitePro: limites.pro ?? 10,
      limitePremium: limites.premium ?? 20,
      limiteEnterprise: limites.enterprise ?? bt.bibliotecas_por_pratica ?? 0
    };
  }

  function substituirTokens(texto, config) {
    const m = getMetricas(config);
    return String(texto || '')
      .replace(/\{\{bibliotecas\}\}/g, m.bibliotecas)
      .replace(/\{\{especialidades\}\}/g, m.especialidades)
      .replace(/\{\{registros\}\}/g, m.registrosFmt)
      .replace(/\{\{registros_num\}\}/g, m.registros)
      .replace(/\{\{transversais\}\}/g, m.transversais)
      .replace(/\{\{por_pratica\}\}/g, m.porPratica)
      .replace(/\{\{fontes\}\}/g, m.fontes)
      .replace(/\{\{limite_freemium\}\}/g, m.limiteFreemium)
      .replace(/\{\{limite_guardioes\}\}/g, m.limiteGuardioes)
      .replace(/\{\{limite_pro\}\}/g, m.limitePro)
      .replace(/\{\{limite_premium\}\}/g, m.limitePremium)
      .replace(/\{\{limite_enterprise\}\}/g, m.limiteEnterprise)
      .replace(/\{\{limites_planos\}\}/g, textoLimitesPlanos(config));
  }

  function textoLimitesPlanos(config) {
    const m = getMetricas(config);
    const plural = (n) => (Number(n) === 1 ? 'biblioteca' : 'bibliotecas');
    return [
      `O plano Freemium inclui ${m.limiteFreemium} ${plural(m.limiteFreemium)}.`,
      `Guardiões da Floresta inclui ${m.limiteGuardioes},`,
      `Pro inclui ${m.limitePro},`,
      `Premium inclui ${m.limitePremium}`,
      `e Enterprise inclui acesso às ${m.bibliotecas} bibliotecas (${m.porPratica} por prática + ${m.transversais} transversais).`
    ].join(' ');
  }

  function resolverBibliotecaVinculada(nomeEspecialidade, config) {
    const bt = config?.BIBLIOTECAS_TERAPEUTICAS;
    if (!bt?.matriz) return null;
    const porPratica = bt.matriz.filter((item) => !isTransversal(item));
    const match = porPratica.find((item) => bibliotecaCorresponde(item, [nomeEspecialidade]));
    return match ? match.especialidade : null;
  }

  function aplicarTokensDocumento(config, root) {
    if (typeof document === 'undefined') return;
    const scope = root || document;
    const m = getMetricas(config);

    scope.querySelectorAll('[data-catalogo]').forEach((el) => {
      const mapa = {
        bibliotecas: m.bibliotecas,
        especialidades: m.especialidades,
        registros: m.registrosFmt,
        transversais: m.transversais,
        por_pratica: m.porPratica,
        fontes: m.fontes
      };
      const valor = mapa[el.dataset.catalogo];
      if (valor !== undefined) el.textContent = valor;
    });

    scope.querySelectorAll('.catalogo-token, [data-catalogo-token]').forEach((el) => {
      const usarHtml = el.classList.contains('catalogo-token-html')
        || el.dataset.catalogoToken === 'html';
      const origem = usarHtml ? el.innerHTML : el.textContent;
      const atualizado = substituirTokens(origem, config);
      if (usarHtml) el.innerHTML = atualizado;
      else el.textContent = atualizado;
    });

    scope.querySelectorAll('meta[name="description"], meta[property="og:description"]').forEach((meta) => {
      if (meta.content && meta.content.includes('{{')) {
        meta.content = substituirTokens(meta.content, config);
      }
    });
  }

  function iniciarPagina(config, opcoes = {}) {
    if (!config) return config;
    aplicarEstatisticasHome(config, opcoes.ids);
    aplicarTokensDocumento(config, opcoes.root);
    return config;
  }

  function metricasI18n(config) {
    const m = getMetricas(config);
    return {
      especialidades: m.especialidades,
      bibliotecas: m.bibliotecas,
      registros: m.registrosFmt
    };
  }

  if (typeof window !== 'undefined') {
    carregarMeta();
  }

  const metaAtual = getMeta();

  const api = {
    CATEGORIA_TRANSVERSAL: getCategoriaTransversal(metaAtual),
    ALIASES_BIBLIOTECAS: getAliases(metaAtual),
    LIMITES_BIBLIOTECAS_PLANO: {
      ...getLimitesBase(metaAtual),
      enterprise: metaAtual?.contagens?.bibliotecasPorPratica
    },
    carregarMeta,
    getMeta,
    normalizarTexto,
    resolverNomesBibliotecas,
    bibliotecaCorresponde,
    isTransversal,
    filtrarPorTermo,
    sincronizar,
    htmlMetricasResumo,
    aplicarEstatisticasHome,
    limitePlano,
    getMetricas,
    substituirTokens,
    textoLimitesPlanos,
    resolverBibliotecaVinculada,
    aplicarTokensDocumento,
    iniciarPagina,
    metricasI18n
  };

  global.CatalogoTerapeutico = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : global);
