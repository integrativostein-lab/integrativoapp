(function (global) {
  const CACHE_KEY = 'integra_tr_cache_v2';
  const MAX_CACHE = 800;
  const MAX_NODES = 120;
  const SELETORES = [
    'main', '.hero', '.hero-pro', '.secao', 'footer', '.form-login', '.form-grupo',
    '.diferencial-card', '.banner-planos', '.painel-conteudo', '.bibliotecas-secao', 'article',
    '.card', '.navbar .nav-links'
  ].join(',');

  const MAP_ALVO = {
    'pt-BR': 'pt',
    es: 'es', en: 'en', zh: 'zh-CN', ru: 'ru', hi: 'hi',
    ar: 'ar', fa: 'fa', id: 'id', ja: 'ja', ko: 'ko', af: 'af', zu: 'zu', fr: 'fr'
  };

  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch (e) {
    cache = {};
  }

  function salvarCache() {
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE) {
      keys.slice(0, keys.length - MAX_CACHE).forEach((k) => delete cache[k]);
    }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* quota */ }
  }

  function deveIgnorar(el) {
    if (!el || el.closest('[data-i18n-no-translate], script, style, noscript, #lang-selector, #nav-lang-selector, .nav-lang-select-wrap')) {
      return true;
    }
    if (el.hasAttribute('data-i18n')) return true;
    if (el.closest('.catalogo-token, .catalogo-token-html, [data-catalogo], [data-catalogo-token]')) {
      return true;
    }
    return false;
  }

  function guardarOriginal(el) {
    if (el.dataset.i18nOrig == null) {
      el.dataset.i18nOrig = el.textContent.trim();
    }
    return el.dataset.i18nOrig;
  }

  function protegerTokens(texto) {
    const tokens = [];
    const limpo = texto.replace(/\{\{[^}]+\}\}/g, (m) => {
      const id = `__TOK${tokens.length}__`;
      tokens.push({ id, val: m });
      return id;
    });
    return { limpo, tokens };
  }

  function restaurarTokens(texto, tokens) {
    let out = texto;
    tokens.forEach(({ id, val }) => {
      out = out.split(id).join(val);
    });
    return out;
  }

  async function traduzirTexto(texto, langAlvo) {
    const trimmed = texto.trim();
    if (!trimmed || langAlvo === 'pt-BR') return texto;
    if (trimmed.length < 2) return texto;
    if (/^[\d\s\W]+$/.test(trimmed)) return texto;

    const alvo = MAP_ALVO[langAlvo] || langAlvo;
    const chave = `${alvo}::${trimmed}`;
    if (cache[chave]) return cache[chave];

    const { limpo, tokens } = protegerTokens(trimmed);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(limpo)}&langpair=pt|${encodeURIComponent(alvo)}`;

    try {
      const r = await fetch(url);
      const j = await r.json();
      let traduzido = j?.responseData?.translatedText || trimmed;
      if (traduzido.toUpperCase() === trimmed.toUpperCase() && j?.matches?.[0]?.translation) {
        traduzido = j.matches[0].translation;
      }
      traduzido = restaurarTokens(traduzido, tokens);
      cache[chave] = traduzido;
      salvarCache();
      return traduzido;
    } catch (e) {
      return texto;
    }
  }

  function coletarElementos() {
    const lista = [];
    document.querySelectorAll(SELETORES).forEach((root) => {
      root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,button,label,li,th,td,span,small,strong,em').forEach((el) => {
        if (deveIgnorar(el)) return;
        if (el.children.length > 0 && el.tagName !== 'A' && el.tagName !== 'BUTTON') return;
        const txt = el.textContent.trim();
        if (txt.length < 2) return;
        if (lista.includes(el)) return;
        lista.push(el);
      });
    });
    return lista.slice(0, MAX_NODES);
  }

  async function aplicar(i18n) {
    const lang = i18n.currentLang;
    const elementos = coletarElementos();

    if (lang === 'pt-BR') {
      elementos.forEach((el) => {
        if (el.dataset.i18nOrig != null) el.textContent = el.dataset.i18nOrig;
      });
      if (global.CONFIG?.Catalogo?.iniciarPagina) global.CONFIG.Catalogo.iniciarPagina(global.CONFIG);
      return;
    }

    document.documentElement.classList.add('i18n-traduzindo');

    for (let i = 0; i < elementos.length; i += 1) {
      const el = elementos[i];
      const orig = guardarOriginal(el);
      const traduzido = await traduzirTexto(orig, lang);
      el.textContent = traduzido;
      if (i % 8 === 7) await new Promise((r) => setTimeout(r, 120));
    }

    document.documentElement.classList.remove('i18n-traduzindo');
    if (global.CONFIG?.Catalogo?.substituirTokens && global.CONFIG?.Catalogo?.iniciarPagina) {
      global.CONFIG.Catalogo.iniciarPagina(global.CONFIG);
    }
  }

  global.I18NAuto = { aplicar, traduzirTexto };
})(window);
