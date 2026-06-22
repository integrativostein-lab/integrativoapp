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
    const h = global.location?.hostname || '';
    return h.includes('alfa') || h.includes('alpha');
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
    link.href = 'css/modo-lancamento.css';
    document.head.appendChild(link);
  }

  function aplicarClasses() {
    document.body.classList.toggle('modo-lancamento', ativo());
    document.body.classList.toggle('ambiente-alfa', ehAlfa() && (cfg().MODO_LANCAMENTO?.marcaAguaAlfa !== false));
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

  function aplicar() {
    if (typeof document === 'undefined') return;
    injetarCss();
    aplicarClasses();
    if (!ativo()) return;
    ocultarRecursosClinicos();
    bloquearPaginaPrescricao();
    ajustarCadastroProfissional();
    substituirTextosPlanos();
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
