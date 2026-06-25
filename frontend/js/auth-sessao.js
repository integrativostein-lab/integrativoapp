(function (global) {
  const TOKEN_KEY = 'integra_token';
  const USER_KEY = 'integra_usuario';

  function obterToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function obterUsuario() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function estaLogado() {
    const usuario = obterUsuario();
    return !!(obterToken() && usuario && usuario.tipo);
  }

  function urlPainel(usuario) {
    const u = usuario || obterUsuario();
    if (!u) return 'login.html';
    const mapa = {
      paciente: 'painel-paciente.html',
      super_admin: 'painel-criador.html',
      admin: 'painel-admin.html',
      rh: 'painel-rh.html',
      recepcionista: 'painel-recepcao.html',
      financeiro: 'painel-financeiro.html',
      contador: 'painel-contador.html'
    };
    return mapa[u.tipo] || 'painel-terapeuta.html';
  }

  function limparSessaoLocal() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    try {
      sessionStorage.removeItem('integrativo_arquivo_profissional_sessao_ok');
    } catch (_) { /* ignore */ }
  }

  function encerrarSessao(destino) {
    limparSessaoLocal();
    if (destino !== false) {
      window.location.href = destino || 'index.html';
    }
  }

  async function validarTokenRemoto() {
    const token = obterToken();
    if (!token || !global.CONFIG?.API_URL) return false;
    try {
      const r = await fetch(`${global.CONFIG.API_URL}/auth/verificar`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!r.ok) return false;
      const d = await r.json();
      if (d.usuario) localStorage.setItem(USER_KEY, JSON.stringify(d.usuario));
      return true;
    } catch {
      return false;
    }
  }

  async function redirecionarSeLogado(opcoes) {
    const cfg = opcoes || {};
    if (!estaLogado()) return false;

    if (cfg.validarRemoto !== false) {
      const valido = await validarTokenRemoto();
      if (!valido) {
        limparSessaoLocal();
        return false;
      }
    }

    const destino = cfg.destino || urlPainel();
    window.location.replace(destino);
    return true;
  }

  function rotuloPainel(usuario) {
    const u = usuario || obterUsuario();
    if (!u) return 'Entrar';
    return u.tipo === 'paciente' ? 'Meu painel' : 'Painel';
  }

  function aplicarNavAutenticado(nav) {
    if (!nav || !estaLogado()) return;
    const actions = nav.querySelector('.nav-actions');
    if (!actions) return;

    const usuario = obterUsuario();
    const entrar = actions.querySelector('.nav-entrar');
    if (entrar) {
      entrar.href = urlPainel(usuario);
      entrar.textContent = rotuloPainel(usuario);
      entrar.classList.remove('btn-primario');
      entrar.classList.add('btn-secundario');
      entrar.removeAttribute('data-i18n');
    }

    let sair = actions.querySelector('.nav-sair');
    if (!sair) {
      sair = document.createElement('button');
      sair.type = 'button';
      sair.className = 'nav-sair btn btn-texto';
      sair.style.marginLeft = '8px';
      sair.addEventListener('click', function () {
        encerrarSessao();
      });
      const lang = actions.querySelector('#nav-lang-selector');
      if (lang) actions.insertBefore(sair, lang);
      else actions.appendChild(sair);
    }

    const primeiro = (usuario.nome || '').split(' ')[0];
    sair.textContent = primeiro ? `Sair (${primeiro})` : 'Sair';
  }

  global.AuthSessao = {
    obterToken,
    obterUsuario,
    estaLogado,
    urlPainel,
    limparSessaoLocal,
    encerrarSessao,
    validarTokenRemoto,
    redirecionarSeLogado,
    rotuloPainel,
    aplicarNavAutenticado
  };
})(window);
