/**
 * Fluxo de conformidade telessaúde — Lei 14.510/2022 · CFM 2.314/2022
 */
window.TeleconsultaConformidade = (function () {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function injetarEstilos() {
    if (document.getElementById('tcle-estilos')) return;
    var s = document.createElement('style');
    s.id = 'tcle-estilos';
    s.textContent = `
      #tcle-overlay { position:fixed; inset:0; z-index:99999; background:rgba(15,23,42,.78); display:flex; align-items:center; justify-content:center; padding:20px; }
      .tcle-card { background:#FFF; border-radius:20px; max-width:640px; width:100%; max-height:90vh; overflow:auto; padding:28px; box-shadow:0 24px 80px rgba(15,23,42,.35); }
      .tcle-card h2 { color:#0F172A; margin-bottom:12px; font-size:20px; }
      .tcle-card ul { margin:12px 0 12px 18px; color:#334155; font-size:13px; line-height:1.55; }
      .tcle-check { display:flex; gap:10px; align-items:flex-start; margin:10px 0; font-size:13px; color:#334155; }
      .tcle-check input { margin-top:3px; }
      .tcle-bases { background:#F0FDF4; border-left:4px solid #059669; padding:12px; border-radius:8px; font-size:12px; margin:12px 0; }
      .tcle-acoes { display:flex; flex-wrap:wrap; gap:10px; margin-top:18px; }
      .tcle-btn { border:0; border-radius:999px; padding:12px 18px; font-weight:700; cursor:pointer; }
      .tcle-btn-prim { background:#0F172A; color:#FFF; }
      .tcle-btn-sec { background:#F1F5F9; color:#0F172A; }
      .tcle-btn-presencial { background:#FEF3C7; color:#92400E; }
    `;
    document.head.appendChild(s);
  }

  function renderModal(preparacao) {
    injetarEstilos();
    var existente = document.getElementById('tcle-overlay');
    if (existente) existente.remove();

    var texto = preparacao.texto_consentimento || {};
    var itens = (texto.itens || []).map(function (i) { return '<li>' + escapeHtml(i) + '</li>'; }).join('');
    var limites = (preparacao.limites || []).map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'tcle-overlay';
    overlay.innerHTML = `
      <div class="tcle-card" role="dialog" aria-modal="true">
        <h2>${escapeHtml(texto.titulo || 'Consentimento — Telessaúde')}</h2>
        <p style="font-size:13px;color:#64748B;line-height:1.55;">${escapeHtml(texto.introducao || '')}</p>
        <div class="tcle-bases"><strong>Bases legais:</strong> ${escapeHtml((preparacao.bases_legais || []).join(' · '))}</div>
        <ul>${itens}</ul>
        <p style="font-size:13px;font-weight:700;color:#0F172A;margin-top:12px;">Limites do atendimento remoto</p>
        <ul>${limites}</ul>
        <label class="tcle-check"><input type="checkbox" id="tcle-aceite"> Li e concordo com o termo de telessaúde, incluindo transmissão de áudio/vídeo e dados clínicos necessários.</label>
        <label class="tcle-check"><input type="checkbox" id="tcle-limites"> Fui informado(a) sobre as limitações e meu direito de optar por atendimento presencial.</label>
        <div class="tcle-acoes">
          <button type="button" class="tcle-btn tcle-btn-prim" id="tcle-confirmar">Consentir e continuar</button>
          ${preparacao.papel === 'paciente' ? '<button type="button" class="tcle-btn tcle-btn-presencial" id="tcle-presencial">Prefiro atendimento presencial</button>' : ''}
          <button type="button" class="tcle-btn tcle-btn-sec" id="tcle-cancelar">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  async function prepararSala(agendamentoId, token) {
    var r = await fetch(CONFIG.API_URL + '/teleconsultas/agendamento/' + agendamentoId + '/preparacao', {
      headers: { Authorization: 'Bearer ' + token }
    });
    var dados = await r.json();
    if (!r.ok) throw new Error(dados.erro || 'Erro ao preparar teleconsulta.');
    return dados;
  }

  async function registrarConsentimento(agendamentoId, token) {
    var r = await fetch(CONFIG.API_URL + '/teleconsultas/agendamento/' + agendamentoId + '/consentir-telessaude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ limites_informados: true, direito_presencial_reconhecido: true })
    });
    var dados = await r.json();
    if (!r.ok) throw new Error(dados.erro || 'Erro ao registrar consentimento.');
    return dados;
  }

  function aguardarConsentimento(preparacao) {
    return new Promise(function (resolve, reject) {
      if (preparacao.pode_entrar) return resolve(preparacao);
      if (preparacao.optou_presencial) {
        return reject(new Error('Atendimento presencial solicitado. Teleconsulta não disponível.'));
      }
      if (preparacao.consentimento && preparacao.consentimento.meu_consentimento && !preparacao.consentimento.completo) {
        return reject(new Error('Aguardando consentimento da outra parte. Paciente e profissional devem aceitar o TCLE.'));
      }

      var overlay = renderModal(preparacao);
      overlay.querySelector('#tcle-cancelar').onclick = function () {
        overlay.remove();
        reject(new Error('Consentimento não concedido.'));
      };
      if (preparacao.papel === 'paciente') {
        overlay.querySelector('#tcle-presencial').onclick = function () {
          reject(new Error('__PRESENCIAL__'));
        };
      }
      overlay.querySelector('#tcle-confirmar').onclick = function () {
        if (!overlay.querySelector('#tcle-aceite').checked || !overlay.querySelector('#tcle-limites').checked) {
          alert('Marque os dois itens de ciência e consentimento para continuar.');
          return;
        }
        overlay.remove();
        resolve(preparacao);
      };
    });
  }

  async function fluxoEntrada(agendamentoId, token) {
    var prep = await prepararSala(agendamentoId, token);
    if (!prep.consentimento.meu_consentimento) {
      await aguardarConsentimento(prep);
      await registrarConsentimento(agendamentoId, token);
      prep = await prepararSala(agendamentoId, token);
    } else if (!prep.consentimento.completo) {
      await aguardarConsentimento(prep);
      prep = await prepararSala(agendamentoId, token);
    }
    if (!prep.consentimento.completo) {
      throw new Error('Aguardando consentimento da outra parte (paciente e profissional).');
    }
    return prep;
  }

  async function obterTokenLiveKit(agendamentoId, token, nome) {
    var r = await fetch(CONFIG.API_URL + '/teleconsultas/livekit-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ agendamento_id: agendamentoId, nome: nome })
    });
    var dados = await r.json();
    if (!r.ok) throw new Error(dados.erro || 'Erro ao entrar na sala.');
    return dados;
  }

  async function encerrarSessao(agendamentoId, token, notas) {
    try {
      await fetch(CONFIG.API_URL + '/teleconsultas/agendamento/' + agendamentoId + '/encerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ notas: notas || null })
      });
    } catch (e) { /* best effort */ }
  }

  async function optarPresencial(agendamentoId, token) {
    await fetch(CONFIG.API_URL + '/teleconsultas/agendamento/' + agendamentoId + '/optar-presencial', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token }
    });
  }

  return {
    fluxoEntrada: fluxoEntrada,
    obterTokenLiveKit: obterTokenLiveKit,
    encerrarSessao: encerrarSessao,
    optarPresencial: optarPresencial,
    prepararSala: prepararSala
  };
})();
