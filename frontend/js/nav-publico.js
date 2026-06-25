(function (global) {
  const TOKEN_KEY = 'integra_token';
  const USER_KEY = 'integra_usuario';

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

  function obterUsuarioNav() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function urlPainelNav(usuario) {
    const mapa = {
      paciente: 'painel-paciente.html',
      super_admin: 'painel-criador.html',
      admin: 'painel-admin.html',
      rh: 'painel-rh.html',
      recepcionista: 'painel-recepcao.html',
      financeiro: 'painel-financeiro.html',
      contador: 'painel-contador.html'
    };
    return mapa[usuario?.tipo] || 'painel-terapeuta.html';
  }

  function aplicarNavAutenticado(nav) {
    const token = localStorage.getItem(TOKEN_KEY);
    const usuario = obterUsuarioNav();
    if (!token || !usuario?.tipo) return;

    const actions = nav.querySelector('.nav-actions');
    if (!actions) return;

    const entrar = actions.querySelector('.nav-entrar');
    if (entrar) {
      entrar.href = urlPainelNav(usuario);
      entrar.textContent = usuario.tipo === 'paciente' ? 'Meu painel' : 'Painel';
      entrar.classList.remove('btn-primario');
      entrar.classList.add('btn-secundario');
      entrar.removeAttribute('data-i18n');
    }

    if (!actions.querySelector('.nav-sair')) {
      const sair = document.createElement('button');
      sair.type = 'button';
      sair.className = 'nav-sair btn btn-texto';
      sair.style.marginLeft = '8px';
      sair.addEventListener('click', function () {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        try { sessionStorage.removeItem('integrativo_arquivo_profissional_sessao_ok'); } catch (_) {}
        window.location.href = 'index.html';
      });
      const lang = actions.querySelector('#nav-lang-selector');
      if (lang) actions.insertBefore(sair, lang);
      else actions.appendChild(sair);
    }

    const primeiro = (usuario.nome || '').split(' ')[0];
    actions.querySelector('.nav-sair').textContent = primeiro ? `Sair (${primeiro})` : 'Sair';
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

    if (global.AuthSessao?.aplicarNavAutenticado) {
      global.AuthSessao.aplicarNavAutenticado(nav);
    } else {
      aplicarNavAutenticado(nav);
    }
  }

  function init() {
    document.querySelectorAll('[data-nav="publico"]').forEach(render);
    if (global.I18N?.montarSeletorIdioma) global.I18N.montarSeletorIdioma();
    if (global.I18N?.aplicarTraducoes) global.I18N.aplicarTraducoes();
  }

  global.NavPublico = { init, render };
})(window);
