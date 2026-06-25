(function (global) {
  const PROVEDORES_UI = [
    { id: 'google', rotulo: 'Continuar com Google', icone: 'G', classe: 'google' },
    { id: 'apple', rotulo: 'Continuar com Apple', icone: '', classe: 'apple' },
    { id: 'microsoft', rotulo: 'Continuar com Microsoft', icone: '⊞', classe: 'microsoft' }
  ];

  function apiBase() {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_URL) {
      return CONFIG.API_URL.replace(/\/$/, '');
    }
    return '';
  }

  function urlRetornoOAuth() {
    return `${global.location.origin}/oauth-callback.html`;
  }

  function montarUrlInicio(provedor, opcoes) {
    const cfg = opcoes || {};
    const params = new URLSearchParams({
      acao: cfg.acao || 'login',
      tipo: cfg.tipo || 'paciente',
      retorno: urlRetornoOAuth()
    });
    if (cfg.plano) params.set('plano', cfg.plano);
    return `${apiBase()}/auth/oauth/${provedor}/iniciar?${params.toString()}`;
  }

  async function carregarProvedores() {
    const base = apiBase();
    if (!base) return [];
    try {
      const r = await fetch(`${base}/auth/oauth/provedores`, { cache: 'no-store' });
      if (!r.ok) return [];
      const d = await r.json();
      return d.provedores || [];
    } catch {
      return [];
    }
  }

  function renderizar(container, opcoes) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    el.innerHTML = `
      <div class="login-social-wrap">
        <div class="login-social-botoes" data-social-botoes></div>
        <p class="login-social-aviso" data-social-aviso></p>
      </div>
      <div class="login-social-divider">ou use email e senha</div>
    `;

    const botoes = el.querySelector('[data-social-botoes]');
    const aviso = el.querySelector('[data-social-aviso]');

    PROVEDORES_UI.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn-social ${p.classe}`;
      btn.dataset.provedor = p.id;
      btn.innerHTML = `<span class="icone" aria-hidden="true">${p.icone}</span><span>${p.rotulo}</span>`;
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        const url = montarUrlInicio(p.id, opcoes);
        if (!url.includes('/auth/oauth/')) {
          alert('API não configurada. Recarregue a página.');
          return;
        }
        global.location.href = url;
      });
      botoes.appendChild(btn);
    });

    carregarProvedores().then(function (lista) {
      const habilitados = new Set(lista.filter((x) => x.habilitado).map((x) => x.id));
      let algum = false;
      botoes.querySelectorAll('.btn-social').forEach(function (btn) {
        const id = btn.dataset.provedor;
        const ok = habilitados.has(id);
        btn.disabled = !ok;
        btn.classList.toggle('desabilitado', !ok);
        if (ok) algum = true;
      });
      if (algum) {
        aviso.textContent = 'Use a conta que preferir — Gmail, iCloud ou Outlook.';
      } else {
        aviso.textContent = 'Login social em configuração no servidor. Use email e senha por enquanto.';
      }
    });
  }

  global.LoginSocial = { renderizar, montarUrlInicio, urlRetornoOAuth };
})(window);
