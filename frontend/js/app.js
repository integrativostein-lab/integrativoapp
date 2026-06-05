const API_URL = CONFIG.API_URL;

function salvarToken(token) { localStorage.setItem('integra_token', token); }
function obterToken() { return localStorage.getItem('integra_token'); }
function salvarUsuario(u) { localStorage.setItem('integra_usuario', JSON.stringify(u)); }
function obterUsuario() { const u = localStorage.getItem('integra_usuario'); return u ? JSON.parse(u) : null; }
function logout() { localStorage.removeItem('integra_token'); localStorage.removeItem('integra_usuario'); window.location.href = '/index.html'; }

async function fazerLogin(email, senha) {
  const r = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
  const d = await r.json();
  if (r.ok) { salvarToken(d.token); salvarUsuario(d.usuario); }
  return { sucesso: r.ok, ...d };
}

async function buscarProfissionais(filtros = {}) {
  const p = new URLSearchParams(filtros).toString();
  const r = await fetch(`${API_URL}/profissionais/buscar?${p}`);
  return await r.json();
}

function formatarMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function formatarData(d) { return new Date(d).toLocaleDateString('pt-BR'); }

function mostrarMensagem(texto, tipo = 'info') {
  const msg = document.createElement('div');
  msg.textContent = texto;
  msg.style.cssText = `position:fixed;top:20px;right:20px;padding:14px 24px;border-radius:8px;color:white;font-weight:600;z-index:10000;font-size:14px;`;
  const cores = { sucesso: '#38A169', erro: '#E53E3E', info: '#1A365D' };
  msg.style.background = cores[tipo] || cores.info;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 4000);
}

window.Integra = { fazerLogin, logout, buscarProfissionais, obterToken, obterUsuario, formatarMoeda, formatarData, mostrarMensagem };