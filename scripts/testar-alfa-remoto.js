#!/usr/bin/env node
/**
 * Testes de integração do ambiente alfa remoto.
 * Uso: node scripts/testar-alfa-remoto.js
 */
const API = process.env.ALFA_API_URL || 'https://integrativoappespelho.onrender.com/api';
const FRONTEND = process.env.ALFA_FRONTEND_URL || 'https://integrativoapp-alfa.vercel.app';
const ROOT = API.replace(/\/api\/?$/, '');

let falhas = 0;

function ok(n, pass, detalhe) {
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`${pass ? '✅' : '❌'} [${status}] ${n}${detalhe ? ` — ${detalhe}` : ''}`);
  if (!pass) falhas += 1;
}

async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* texto */ }
  return { status: r.status, json, text };
}

async function post(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000)
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* texto */ }
  return { status: r.status, json, text };
}

async function main() {
  console.log('=== Teste alfa remoto ===');
  console.log(`API: ${API}`);
  console.log(`Frontend: ${FRONTEND}\n`);

  try {
    const health = await get(`${ROOT}/`);
    ok('1. Health backend', health.status === 200 && health.json?.status === 'online',
      health.json ? `modo_teste=${health.json.modo_teste}` : health.text.slice(0, 120));
  } catch (e) {
    ok('1. Health backend', false, e.message);
  }

  try {
    const alertas = await get(`${API}/alertas-seguranca?termo=ginkgo%20varfarina`);
    const body = alertas.json || {};
    const regra = JSON.stringify(body).includes('FITOTERAPIA_ANTICOAGULANTE_001');
    ok('2. Alertas segurança', alertas.status === 200 && body.usa_ia === false && regra,
      `usa_ia=${body.usa_ia}, alertas=${body.total_alertas}`);
  } catch (e) {
    ok('2. Alertas segurança', false, e.message);
  }

  let profToken = null;
  try {
    const login = await post(`${API}/auth/login`, { email: 'profissional@demo.com', senha: 'demo123' });
    profToken = login.json?.token;
    ok('3. Login profissional demo', login.status === 200 && !!profToken, login.json?.usuario?.tipo || login.text.slice(0, 80));
  } catch (e) {
    ok('3. Login profissional demo', false, e.message);
  }

  try {
    const login = await post(`${API}/auth/login`, { email: 'paciente@demo.com', senha: 'demo123' });
    ok('4. Login paciente demo', login.status === 200 && !!login.json?.token, login.json?.usuario?.tipo || login.text.slice(0, 80));
  } catch (e) {
    ok('4. Login paciente demo', false, e.message);
  }

  try {
    const fe = await get(FRONTEND);
    ok('5. Frontend Vercel alfa', fe.status === 200, `HTTP ${fe.status}`);
  } catch (e) {
    ok('5. Frontend Vercel alfa', false, e.message);
  }

  if (profToken) {
    try {
      const logs = await get(`${API}/admin/logs?limite=5`);
      const headers = { Authorization: `Bearer ${profToken}` };
      const r = await fetch(`${API}/admin/logs?limite=5`, { headers, signal: AbortSignal.timeout(120000) });
      ok('6. Admin logs (prof = 403 esperado)', r.status === 403, `HTTP ${r.status}`);
    } catch (e) {
      ok('6. Admin logs (prof)', false, e.message);
    }
  } else {
    ok('6. Admin logs (prof)', false, 'sem token');
  }

  console.log(`\n=== Resultado: ${falhas === 0 ? 'SUCESSO' : `${falhas} falha(s)`} ===`);
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
