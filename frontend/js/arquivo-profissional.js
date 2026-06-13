(function () {
  const SESSION_KEY = 'integrativo_arquivo_profissional_sessao_ok';
  const LAST_KEY = 'integrativo_arquivo_profissional_ultimo';

  function usuarioAtual() {
    try {
      return JSON.parse(localStorage.getItem('integra_usuario') || '{}');
    } catch {
      return {};
    }
  }

  function deveArquivar() {
    const usuario = usuarioAtual();
    return usuario.tipo === 'profissional' && sessionStorage.getItem(SESSION_KEY) !== 'true';
  }

  function injetarEstilos() {
    if (document.getElementById('arquivo-profissional-estilos')) return;
    const style = document.createElement('style');
    style.id = 'arquivo-profissional-estilos';
    style.textContent = `
      #arquivo-profissional-modal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(6px);
        padding: 24px;
      }
      .arquivo-profissional-card {
        width: min(560px, 100%);
        background: #FFFFFF;
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
        color: #334155;
      }
      .arquivo-profissional-card h2 {
        margin-bottom: 12px;
        color: #0F172A;
      }
      .arquivo-profissional-card p {
        margin-bottom: 12px;
      }
      .arquivo-profissional-alerta {
        padding: 12px;
        border-radius: 12px;
        background: #ECFDF5;
        color: #065F46;
        font-size: 14px;
      }
      .arquivo-profissional-status {
        min-height: 44px;
        margin: 16px 0;
        padding: 12px;
        border-radius: 12px;
        background: #F8FAFC;
        font-size: 14px;
      }
      #arquivo-profissional-executar {
        width: 100%;
        border: 0;
        border-radius: 12px;
        padding: 14px 18px;
        background: #0F172A;
        color: #FFFFFF;
        font-weight: 800;
        cursor: pointer;
      }
      #arquivo-profissional-executar:disabled {
        opacity: 0.7;
        cursor: wait;
      }
    `;
    document.head.appendChild(style);
  }

  function criarModal() {
    if (document.getElementById('arquivo-profissional-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'arquivo-profissional-modal';
    overlay.innerHTML = `
      <div class="arquivo-profissional-card">
        <h2>Arquivamento obrigatório no servidor</h2>
        <p>
          Antes de continuar ou sair do painel, o Integrativo.App arquiva no servidor central
          uma cópia dos dados assistenciais vinculados ao profissional.
        </p>
        <p class="arquivo-profissional-alerta">
          Essa medida mantém histórico, rastreabilidade e continuidade do cuidado no servidor autorizado da plataforma.
        </p>
        <div id="arquivo-profissional-status" class="arquivo-profissional-status">
          Aguardando arquivamento no servidor...
        </div>
        <button type="button" id="arquivo-profissional-executar">Arquivar agora no servidor</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('arquivo-profissional-executar').addEventListener('click', arquivarAgora);
  }

  function atualizarStatus(mensagem, erro = false) {
    const el = document.getElementById('arquivo-profissional-status');
    if (!el) return;
    el.textContent = mensagem;
    el.style.background = erro ? '#FEE2E2' : '#F8FAFC';
    el.style.color = erro ? '#991B1B' : '#334155';
  }

  async function arquivarAgora() {
    const token = localStorage.getItem('integra_token');
    const botao = document.getElementById('arquivo-profissional-executar');
    if (!token || !botao) return;

    botao.disabled = true;
    atualizarStatus('Enviando dados para arquivamento no servidor...');

    try {
      const resp = await fetch(`${CONFIG.API_URL}/arquivo-profissional/snapshot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const dados = await resp.json();
      if (!resp.ok) throw new Error(dados.erro || 'Erro ao arquivar dados no servidor.');

      const agora = new Date().toISOString();
      localStorage.setItem(LAST_KEY, agora);
      sessionStorage.setItem(SESSION_KEY, 'true');
      atualizarStatus(`Arquivamento concluído em ${new Date(agora).toLocaleString('pt-BR')}.`);

      setTimeout(() => {
        const modal = document.getElementById('arquivo-profissional-modal');
        if (modal) modal.remove();
      }, 900);
    } catch (error) {
      atualizarStatus(`${error.message} Tente novamente antes de sair do painel.`, true);
    } finally {
      botao.disabled = false;
    }
  }

  function bloquearSaida() {
    window.addEventListener('beforeunload', (event) => {
      if (!deveArquivar()) return;
      event.preventDefault();
      event.returnValue = 'Finalize o arquivamento obrigatório antes de sair.';
    });

    const logoutOriginal = window.logout;
    window.logout = function () {
      if (deveArquivar()) {
        injetarEstilos();
        criarModal();
        atualizarStatus('Faça o arquivamento no servidor antes de sair do painel.', true);
        return false;
      }
      if (typeof logoutOriginal === 'function') return logoutOriginal();
      localStorage.clear();
      window.location.href = 'index.html';
      return true;
    };
  }

  function iniciar() {
    if (!deveArquivar()) return;
    injetarEstilos();
    criarModal();
    bloquearSaida();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  window.INTEGRATIVO_ARQUIVO_PROFISSIONAL = {
    arquivarAgora,
    deveArquivar
  };
})();
