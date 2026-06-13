const VOZ_SISTEMA = {
  idioma: 'pt-BR',

  suportaReconhecimento() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  iniciar(callbackSucesso, opcoes = {}) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge em HTTPS.');
      return null;
    }

    const recognition = new Recognition();
    recognition.lang = opcoes.idioma || this.idioma;
    recognition.continuous = Boolean(opcoes.continuous);
    recognition.interimResults = Boolean(opcoes.interimResults);

    recognition.onresult = (event) => {
      let textoFinal = '';
      let textoInterino = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const texto = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) textoFinal += texto;
        else textoInterino += texto;
      }

      textoFinal = textoFinal.trim();
      textoInterino = textoInterino.trim();

      if (textoInterino && opcoes.onInterim) opcoes.onInterim(textoInterino);
      if (textoFinal) callbackSucesso(this.normalizarTexto(textoFinal, opcoes));
    };

    recognition.onerror = (event) => {
      console.error('Erro na voz:', event.error);
      if (opcoes.onError) opcoes.onError(event);
    };

    recognition.onend = () => {
      if (opcoes.onEnd) opcoes.onEnd();
    };

    recognition.start();
    return recognition;
  },

  normalizarTexto(texto, opcoes = {}) {
    let saida = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!saida) return '';
    if (opcoes.capitalizar !== false) {
      saida = saida.charAt(0).toUpperCase() + saida.slice(1);
    }
    return saida;
  },

  inserirNoCampo(campo, texto) {
    const textoLimpo = String(texto || '').trim();
    if (!textoLimpo) return;

    const ehTextoLongo = campo.tagName === 'TEXTAREA';
    const separador = campo.value && !campo.value.endsWith(ehTextoLongo ? '\n' : ' ')
      ? (ehTextoLongo ? '\n' : ' ')
      : '';
    const inicio = typeof campo.selectionStart === 'number' ? campo.selectionStart : campo.value.length;
    const fim = typeof campo.selectionEnd === 'number' ? campo.selectionEnd : campo.value.length;
    const antes = campo.value.slice(0, inicio);
    const depois = campo.value.slice(fim);
    const novoTexto = `${antes}${separador}${textoLimpo}${depois}`;

    campo.value = novoTexto;
    const cursor = (antes + separador + textoLimpo).length;
    if (campo.setSelectionRange) campo.setSelectionRange(cursor, cursor);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.dispatchEvent(new Event('change', { bubbles: true }));
    campo.focus();
  },

  prepararCampo(campo) {
    if (!campo || campo.dataset.vozPreparada === 'true') return;
    campo.dataset.vozPreparada = 'true';

    const wrapper = document.createElement('span');
    wrapper.className = 'voz-campo-wrapper';
    campo.parentNode.insertBefore(wrapper, campo);
    wrapper.appendChild(campo);

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'voz-botao';
    botao.textContent = '🎙️ Falar';
    botao.title = 'Transcrever voz para este campo';
    wrapper.appendChild(botao);

    const status = document.createElement('span');
    status.className = 'voz-status';
    status.setAttribute('aria-live', 'polite');
    wrapper.appendChild(status);

    let recognition = null;

    botao.addEventListener('click', () => {
      if (recognition) {
        recognition.stop();
        recognition = null;
        return;
      }

      if (!this.suportaReconhecimento()) {
        alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge em HTTPS.');
        return;
      }

      botao.disabled = true;
      botao.classList.add('ouvindo');
      botao.textContent = '■ Parar';
      status.textContent = 'Ouvindo...';

      const ehTextoLongo = campo.tagName === 'TEXTAREA' || campo.dataset.vozContinuo === 'true';
      recognition = this.iniciar(
        (texto) => this.inserirNoCampo(campo, texto),
        {
          continuous: ehTextoLongo,
          interimResults: true,
          onInterim: (texto) => { status.textContent = texto ? `Ouvindo: ${texto}` : 'Ouvindo...'; },
          onEnd: () => {
            recognition = null;
            botao.disabled = false;
            botao.classList.remove('ouvindo');
            botao.textContent = '🎙️ Falar';
            status.textContent = '';
          },
          onError: () => {
            recognition = null;
            botao.disabled = false;
            botao.classList.remove('ouvindo');
            botao.textContent = '🎙️ Falar';
            status.textContent = 'Não foi possível transcrever. Tente novamente.';
          }
        }
      );

      if (!recognition) {
        botao.disabled = false;
        botao.classList.remove('ouvindo');
        botao.textContent = '🎙️ Falar';
        status.textContent = '';
      } else {
        botao.disabled = false;
      }
    });
  },

  anexar(seletor = '[data-voz], .campo-voz') {
    this.injetarEstilos();
    document.querySelectorAll(seletor).forEach((campo) => this.prepararCampo(campo));
  },

  injetarEstilos() {
    if (document.getElementById('voz-sistema-estilos')) return;
    const style = document.createElement('style');
    style.id = 'voz-sistema-estilos';
    style.textContent = `
      .voz-campo-wrapper {
        display: block;
        position: relative;
        width: 100%;
      }
      .voz-campo-wrapper input,
      .voz-campo-wrapper textarea {
        width: 100%;
        padding-right: 104px;
      }
      .voz-botao {
        position: absolute;
        right: 8px;
        top: 8px;
        border: 0;
        border-radius: 999px;
        padding: 6px 10px;
        background: #0F172A;
        color: #FFFFFF;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
      }
      .voz-botao.ouvindo {
        background: #10B981;
      }
      .voz-botao:disabled {
        cursor: wait;
        opacity: 0.85;
      }
      .voz-status {
        display: block;
        min-height: 16px;
        margin-top: 4px;
        color: #64748B;
        font-size: 11px;
        line-height: 1.35;
      }
    `;
    document.head.appendChild(style);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  VOZ_SISTEMA.anexar();
});
