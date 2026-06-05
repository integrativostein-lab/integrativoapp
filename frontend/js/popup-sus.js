// Popup de cadastro SUS (CNES/CNS)
// Exibe ao logar se o profissional não tiver CNES cadastrado

document.addEventListener('DOMContentLoaded', function() {
  // Só executa se estiver logado como profissional
  var usuario = localStorage.getItem('integra_usuario');
  if (!usuario) return;
  
  try {
    usuario = JSON.parse(usuario);
  } catch(e) {
    return;
  }

  // Só para profissionais
  if (usuario.tipo !== 'profissional' && usuario.tipo !== 'admin') return;

  // Verificar se já tem CNES cadastrado
  var token = localStorage.getItem('integra_token');
  if (!token) return;

  fetch(CONFIG.API_URL + '/usuarios/perfil', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(function(r) { return r.json(); })
  .then(function(perfil) {
    // Se já tem CNES, não mostra o popup
    if (perfil.cnes && perfil.cnes.trim() !== '') return;

    // Se já foi mostrado hoje, não mostra de novo
    var hoje = new Date().toISOString().split('T')[0];
    var ultimoPopup = localStorage.getItem('popup_sus_data');
    if (ultimoPopup === hoje) return;

    // Criar o popup
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';

    var popup = document.createElement('div');
    popup.style.cssText = 'background:#FFF;border-radius:14px;padding:36px;max-width:500px;width:90%;box-shadow:0 20px 40px rgba(0,0,0,0.20);text-align:center;';

    popup.innerHTML = `
      <h3 style="color:#1A365D;font-size:22px;margin-bottom:16px;">🏥 Complete seu cadastro SUS</h3>
      <p style="color:#4A5568;line-height:1.8;margin-bottom:20px;">
        Você ainda não vinculou seu registro ao sistema público de saúde. 
        Isso leva menos de 2 minutos e traz vantagens importantes para sua prática.
      </p>
      <div style="text-align:left;background:#FEEBC8;padding:16px;border-radius:8px;margin-bottom:20px;">
        <p style="font-weight:600;color:#1A365D;margin-bottom:8px;">✅ Vantagens de cadastrar seu CNES:</p>
        <ul style="color:#4A5568;font-size:14px;line-height:1.8;padding-left:18px;">
          <li>Emita relatórios para o SUS em 1 clique</li>
          <li>Seus atendimentos ficam registrados no sistema público</li>
          <li>Diferencial competitivo — clínicas maiores exigem</li>
          <li>Organização fiscal e profissional</li>
        </ul>
      </div>
      <p style="color:#4A5568;font-size:13px;margin-bottom:20px;">
        📝 O que você precisa: número do CNES (obtido no site do DATASUS)<br>
        ⏱️ Tempo estimado: 2 minutos
      </p>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button id="btn-sus-agora" style="background:#DD6B20;color:#FFF;border:none;padding:12px 24px;border-radius:8px;font-weight:600;cursor:pointer;">Cadastrar Agora</button>
        <button id="btn-sus-depois" style="background:transparent;color:#4A5568;border:1px solid #E2E8F0;padding:12px 24px;border-radius:8px;cursor:pointer;">Lembrar Depois</button>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Eventos dos botões
    document.getElementById('btn-sus-agora').addEventListener('click', function() {
      overlay.remove();
      // Redirecionar para configurações do perfil
      window.location.href = 'painel-terapeuta.html#config';
    });

    document.getElementById('btn-sus-depois').addEventListener('click', function() {
      overlay.remove();
      // Salvar que já foi mostrado hoje
      localStorage.setItem('popup_sus_data', hoje);
    });
  });
});