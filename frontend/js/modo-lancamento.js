/**
 * Modo lançamento — terapeutas integrativos sem conselho regulado.
 * Oculta prescrição, validação de conselhos, FHIR/TISS/SUS até certificações.
 */
(function (global) {
  const CONSELHOS_REGULADOS = new Set([
    'CRM', 'CRP', 'CREFITO', 'COREN', 'CRO', 'CRN', 'CRF', 'CREF', 'CRBM', 'CRBio', 'CRMV'
  ]);

  function cfg() {
    return global.CONFIG || {};
  }

  function ativo() {
    return cfg().MODO_LANCAMENTO?.ativo !== false;
  }

  function ehAlfa() {
    const h = (global.location?.hostname || '').toLowerCase();
    if (h.includes('alfa') || h.includes('alpha')) return true;
    if (h.includes('integrativoapp-alfa')) return true;
    try {
      if (global.localStorage?.getItem('integra_forcar_banner_teste') === '1') return true;
    } catch (_) { /* ignore */ }
    return false;
  }

  function ehEspecialidadeIntegrativa(esp) {
    if (!esp?.conselho) return true;
    if (esp.conselho === 'ABRATH') return true;
    return !CONSELHOS_REGULADOS.has(esp.conselho);
  }

  function especialidadesVisiveis(lista) {
    if (!ativo()) return lista || [];
    return (lista || []).filter(ehEspecialidadeIntegrativa);
  }

  function injetarCss() {
    if (document.getElementById('modo-lancamento-css')) return;
    const link = document.createElement('link');
    link.id = 'modo-lancamento-css';
    link.rel = 'stylesheet';
    link.href = '/css/modo-lancamento.css';
    document.head.appendChild(link);
  }

  const FRASES_BANNER_TESTE = [
    '⚠ MODO DE TESTE',
    'Ambiente não comercial',
    'Dados podem ser fictícios',
    'Não use para atendimento real',
    'Integrativo.App · Alfa'
  ];

  function montarTextoBannerRotativo() {
    const bloco = FRASES_BANNER_TESTE.map((t) => `<span class="banner-modo-teste-item">${t}</span>`).join('<span class="banner-modo-teste-sep">·</span>');
    return bloco + bloco;
  }

  function injetarBannerModoTeste() {
    if (document.getElementById('banner-modo-teste')) return;
    const banner = document.createElement('div');
    banner.id = 'banner-modo-teste';
    banner.className = 'banner-modo-teste';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <div class="banner-modo-teste-inner">
        <div class="banner-modo-teste-track">${montarTextoBannerRotativo()}</div>
      </div>`;
    document.body.prepend(banner);
    document.body.classList.add('com-banner-teste', 'ambiente-alfa');
  }

  async function detectarAmbienteTeste() {
    if (cfg().AMBIENTE_TESTE) return true;
    if (ehAlfa()) return true;
    const api = cfg().API_URL || '';
    if (/espelho|integrativoappespelho/i.test(api)) return true;
    try {
      const base = api.replace(/\/api\/?$/, '');
      if (!base) return false;
      const r = await fetch(`${base}/api/config/publica`, { signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const d = await r.json();
        return !!d.ambiente_teste;
      }
    } catch (_) { /* offline ou CORS */ }
    return false;
  }

  async function aplicarBannerTeste() {
    const isTest = await detectarAmbienteTeste();
    if (isTest) injetarBannerModoTeste();
  }

  function aplicarClasses() {
    document.body.classList.toggle('modo-lancamento', ativo());
  }

  function ocultarRecursosClinicos() {
    document.querySelectorAll('[data-recurso-clinico]').forEach((el) => {
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function inserirAvisoLancamento(seletor, html) {
    const alvo = typeof seletor === 'string' ? document.querySelector(seletor) : seletor;
    if (!alvo || alvo.querySelector('.aviso-modo-lancamento')) return;
    const div = document.createElement('div');
    div.className = 'aviso-modo-lancamento';
    div.innerHTML = html;
    alvo.prepend(div);
  }

  function bloquearPaginaPrescricao() {
    if (!/painel-prescricao\.html/i.test(global.location.pathname)) return;
    const cont = document.querySelector('.prescricao-container') || document.getElementById('conteudo') || document.body;
    cont.innerHTML = `
      <div class="pagina-recurso-dormante">
        <div class="icone">🔒</div>
        <h2>Prescrição eletrônica em preparação</h2>
        <p>
          Estamos concluindo certificações para habilitar prescrições, validação de conselhos
          e integrações regulatórias (FHIR/TISS). Enquanto isso, utilize as
          <a href="painel-bibliotecas.html">bibliotecas terapêuticas</a> para apoio ao seu trabalho
          como terapeuta integrativo.
        </p>
        <p style="margin-top:16px;"><a href="painel-terapeuta.html">← Voltar ao painel</a></p>
      </div>`;
  }

  function ajustarCadastroProfissional() {
    const sel = document.getElementById('temRegistroProfissional');
    if (!sel) return;

    const blocoRegistro = document.querySelector('.form-secao:nth-of-type(2)') || sel.closest('.form-secao');
    inserirAvisoLancamento(blocoRegistro, `
      <strong>Modo terapeuta integrativo.</strong>
      No lançamento inicial, o cadastro é voltado a profissionais sem conselho regulado (CRM, CRP, etc.).
      Informe sua ocupação principal nas práticas integrativas. Validação de conselho e prescrição eletrônica
      serão liberadas após certificações.`);

    sel.value = 'nao';
    sel.closest('.form-group')?.setAttribute('data-recurso-clinico', 'conselho');
    document.getElementById('painelRegistro')?.setAttribute('data-recurso-clinico', 'conselho');

    if (typeof global.CadastroProfissionalFlow !== 'undefined') {
      const evt = new Event('change');
      sel.dispatchEvent(evt);
    }
  }

  function substituirTextosPlanos() {
    if (!ativo()) return;
    document.querySelectorAll('[data-texto-plano-lancamento]').forEach((el) => {
      const txt = el.getAttribute('data-texto-plano-lancamento');
      if (txt) el.textContent = txt;
    });
  }

  function inserirAvisoGlobal() {
    const aviso = cfg().MODO_LANCAMENTO?.aviso;
    if (!aviso) return;
    const alvo =
      document.querySelector('.painel-conteudo') ||
      document.querySelector('.page-container') ||
      document.querySelector('main.fluxo-prof') ||
      document.querySelector('.hero');
    if (!alvo) return;
    inserirAvisoLancamento(alvo, `<strong>Modo lançamento — terapeutas integrativos.</strong> ${aviso}`);
  }

  async function aplicar() {
    if (typeof document === 'undefined') return;
    injetarCss();
    aplicarClasses();
    await aplicarBannerTeste();
    if (!ativo()) return;
    ocultarRecursosClinicos();
    bloquearPaginaPrescricao();
    ajustarCadastroProfissional();
    substituirTextosPlanos();
    inserirAvisoGlobal();
  }

  global.ModoLancamento = {
    ativo,
    ehAlfa,
    ehEspecialidadeIntegrativa,
    especialidadesVisiveis,
    CONSELHOS_REGULADOS,
    aplicar,
    mensagemBloqueio:
      'Recurso clínico regulado temporariamente indisponível. Bibliotecas terapêuticas permanecem ativas.'
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', aplicar);
    } else {
      aplicar();
    }
  }
})(typeof window !== 'undefined' ? window : global);
