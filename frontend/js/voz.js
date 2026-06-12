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
      const texto = Array.from(event.results)
        .map((resultado) => resultado[0]?.transcript || '')
        .join(' ')
        .trim();
      if (texto) callbackSucesso(texto);
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

  inserirNoCampo(campo, texto) {
    const separador = campo.value && !campo.value.endsWith(' ') ? ' ' : '';
    const inicio = typeof campo.selectionStart === 'number' ? campo.selectionStart : campo.value.length;
    const fim = typeof campo.selectionEnd === 'number' ? campo.selectionEnd : campo.value.length;
    const antes = campo.value.slice(0, inicio);
    const depois = campo.value.slice(fim);
    const novoTexto = `${antes}${separador}${texto}${depois}`;

    campo.value = novoTexto;
    const cursor = (antes + separador + texto).length;
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
    botao.textContent = 'Falar';
    botao.title = 'Preencher este campo por voz';
    wrapper.appendChild(botao);

    botao.addEventListener('click', () => {
      if (!this.suportaReconhecimento()) {
        alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge em HTTPS.');
        return;
      }
      botao.disabled = true;
      botao.classList.add('ouvindo');
      botao.textContent = 'Ouvindo...';
      this.iniciar(
        (texto) => this.inserirNoCampo(campo, texto),
        {
          onEnd: () => {
            botao.disabled = false;
            botao.classList.remove('ouvindo');
            botao.textContent = 'Falar';
          },
          onError: () => {
            botao.disabled = false;
            botao.classList.remove('ouvindo');
            botao.textContent = 'Falar';
          }
        }
      );
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
        padding-right: 86px;
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
    `;
    document.head.appendChild(style);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  VOZ_SISTEMA.anexar();
});
