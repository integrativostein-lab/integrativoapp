(function (global) {
  const ITENS_BASE = [
    { id: 'inicio', href: 'index.html', i18n: 'nav.inicio' },
    { id: 'busca', href: 'busca.html', i18n: 'nav.busca' },
    { id: 'profissionais', href: 'profissionais', i18n: 'nav.profissionais' },
    { id: 'bibliotecas', href: 'bibliotecas-especialidades.html', i18n: 'nav.bibliotecas' }
  ];

  function t(key, fallback) {
    if (global.I18N?.t) return global.I18N.t(key);
    return fallback || key;
  }

  function parseExtras(nav) {
    try {
      const raw = nav.getAttribute('data-nav-extras');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('[NavPublico] data-nav-extras inválido:', e.message);
      return [];
    }
  }

  function render(nav) {
    const menu = nav.querySelector('[data-nav-menu]') || nav.querySelector('.menu');
    if (!menu) return;

    const ativo = nav.getAttribute('data-nav-ativo') || '';
    const extras = parseExtras(nav);

    let links = ITENS_BASE
      .filter((item) => item.id !== ativo)
      .map((item) => `<a href="${item.href}" data-i18n="${item.i18n}">${t(item.i18n)}</a>`)
      .join('');

    extras.forEach((extra) => {
      const i18nAttr = extra.i18n ? ` data-i18n="${extra.i18n}"` : '';
      links += `<a href="${extra.href}"${i18nAttr}>${extra.i18n ? t(extra.i18n) : extra.label}</a>`;
    });

    menu.innerHTML = `
      <div class="nav-links">${links}</div>
      <div class="nav-actions">
        <a href="login.html" class="btn btn-primario nav-entrar" data-i18n="nav.entrar">${t('nav.entrar')}</a>
        <div id="nav-lang-selector" class="nav-lang-select-container" data-i18n-no-translate aria-label="${t('lang.seletor', 'Idioma')}"></div>
      </div>
    `;
  }

  function init() {
    document.querySelectorAll('[data-nav="publico"]').forEach(render);
    if (global.I18N?.montarSeletorIdioma) global.I18N.montarSeletorIdioma();
    if (global.I18N?.aplicarTraducoes) global.I18N.aplicarTraducoes();
  }

  global.NavPublico = { init, render };
})(window);
