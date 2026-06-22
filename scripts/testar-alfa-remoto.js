#!/usr/bin/env node
/**
 * Testes de integração remoto (alfa e/ou produção).
 *
 * Uso:
 *   node scripts/testar-alfa-remoto.js           # só alfa
 *   node scripts/testar-alfa-remoto.js --prod    # só produção
 *   node scripts/testar-alfa-remoto.js --todos   # alfa + produção
 */
const PERFIS = {
  alfa: {
    rotulo: 'ALFA',
    api: 'https://integrativoappespelho.onrender.com/api',
    frontend: 'https://integrativoapp-alfa.vercel.app',
    demoLogin: true,
    esperaModoTeste: true
  },
  prod: {
    rotulo: 'PRODUÇÃO',
    api: 'https://integra-backend-ynrd.onrender.com/api',
    frontend: 'https://integrativo.app',
    demoLogin: true,
    esperaModoTeste: false
  }
};

const args = process.argv.slice(2);
const rodar = args.includes('--todos')
  ? ['alfa', 'prod']
  : args.includes('--prod')
    ? ['prod']
    : ['alfa'];

let falhasTotais = 0;

function ok(n, pass, detalhe) {
  const status = pass ? 'PASS' : 'FAIL';
  console.log(`${pass ? '✅' : '❌'} [${status}] ${n}${detalhe ? ` — ${detalhe}` : ''}`);
  if (!pass) return 1;
  return 0;
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

async function rodarPerfil(perfil) {
  const API = perfil.api.replace(/\/$/, '');
  const ROOT = API.replace(/\/api\/?$/, '');
  const FRONTEND = perfil.frontend;
  let falhas = 0;
  const fail = (n, pass, det) => { falhas += ok(n, pass, det); };

  console.log(`\n=== Teste remoto — ${perfil.rotulo} ===`);
  console.log(`API: ${API}`);
  console.log(`Frontend: ${FRONTEND}\n`);

  try {
    const health = await get(`${ROOT}/`);
    fail('1. Health backend', health.status === 200 && health.json?.status === 'online',
      health.json ? `modo_teste=${health.json.modo_teste}` : health.text.slice(0, 120));
    if (health.json && typeof health.json.modo_teste === 'boolean') {
      fail('1b. modo_teste esperado', health.json.modo_teste === perfil.esperaModoTeste,
        `esperado=${perfil.esperaModoTeste}, atual=${health.json.modo_teste}`);
    }
  } catch (e) {
    fail('1. Health backend', false, e.message);
  }

  try {
    const cfg = await get(`${API}/config/publica`);
    const body = cfg.json || {};
    fail('1c. Config pública', cfg.status === 200 && typeof body.modo_lancamento === 'boolean',
      `ambiente_teste=${body.ambiente_teste}, ignorar_lgpd=${body.ignorar_lgpd}`);
    if (cfg.status === 200) {
      fail('1d. LGPD por ambiente', body.ignorar_lgpd === perfil.esperaModoTeste,
        `ignorar_lgpd=${body.ignorar_lgpd}`);
    }
  } catch (e) {
    fail('1c. Config pública', false, e.message);
  }

  try {
    const alertas = await get(`${API}/alertas-seguranca?termo=ginkgo%20varfarina`);
    const body = alertas.json || {};
    const regra = JSON.stringify(body).includes('FITOTERAPIA_ANTICOAGULANTE_001');
    fail('2. Alertas segurança', alertas.status === 200 && body.usa_ia === false && regra,
      `usa_ia=${body.usa_ia}, alertas=${body.total_alertas}`);
  } catch (e) {
    fail('2. Alertas segurança', false, e.message);
  }

  let profToken = null;
  if (perfil.demoLogin) {
    try {
      const login = await post(`${API}/auth/login`, { email: 'profissional@demo.com', senha: 'demo123' });
      profToken = login.json?.token;
      fail('3. Login profissional demo', login.status === 200 && !!profToken, login.json?.usuario?.tipo || login.text.slice(0, 80));
    } catch (e) {
      fail('3. Login profissional demo', false, e.message);
    }

    try {
      const login = await post(`${API}/auth/login`, { email: 'paciente@demo.com', senha: 'demo123' });
      fail('4. Login paciente demo', login.status === 200 && !!login.json?.token, login.json?.usuario?.tipo || login.text.slice(0, 80));
    } catch (e) {
      fail('4. Login paciente demo', false, e.message);
    }
  }

  try {
    const fe = await get(FRONTEND);
    fail('5. Frontend', fe.status === 200, `HTTP ${fe.status}`);
  } catch (e) {
    fail('5. Frontend', false, e.message);
  }

  if (profToken) {
    try {
      const ver = await fetch(`${API}/auth/verificar`, {
        headers: { Authorization: `Bearer ${profToken}` },
        signal: AbortSignal.timeout(120000)
      });
      fail('6. Verificar token demo prof', ver.status === 200, `HTTP ${ver.status}`);
    } catch (e) {
      fail('6. Verificar token demo prof', false, e.message);
    }

    try {
      const r = await fetch(`${API}/admin/logs?limite=5`, {
        headers: { Authorization: `Bearer ${profToken}` },
        signal: AbortSignal.timeout(120000)
      });
      fail('7. Admin logs (prof = 403 esperado)', r.status === 403, `HTTP ${r.status}`);
    } catch (e) {
      fail('7. Admin logs (prof)', false, e.message);
    }

    try {
      const normas = await fetch(`${API}/teleconsultas/normas`, {
        headers: { Authorization: `Bearer ${profToken}` },
        signal: AbortSignal.timeout(120000)
      });
      fail('8. Teleconsulta normas', normas.status === 200, `HTTP ${normas.status}`);
    } catch (e) {
      fail('8. Teleconsulta normas', false, e.message);
    }

    try {
      const lk = await post(`${API}/teleconsultas/livekit-token`, { agendamento_id: 1 }, profToken);
      const livekitOk = lk.status === 403 || lk.status === 200;
      const livekitCfg = lk.status !== 500;
      fail('9. LiveKit configurado', livekitCfg,
        lk.status === 500 ? (lk.json?.erro || lk.text.slice(0, 80)) : `HTTP ${lk.status} (403=TCLE pendente OK)`);
      fail('9b. LiveKit token (TCLE ou sala)', livekitOk, lk.json?.erro || `HTTP ${lk.status}`);
    } catch (e) {
      fail('9. LiveKit configurado', false, e.message);
    }
  } else {
    fail('6. Verificar token demo prof', false, 'sem token');
    fail('7. Admin logs (prof)', false, 'sem token');
    fail('8. Teleconsulta normas', false, 'sem token');
    fail('9. LiveKit configurado', false, 'sem token');
  }

  try {
    const regras = await get(`${API}/alertas-seguranca/regras`);
    fail('10. Regras fechadas sem token', regras.status === 401, `HTTP ${regras.status}`);
  } catch (e) {
    fail('10. Regras fechadas sem token', false, e.message);
  }

  console.log(`\n=== ${perfil.rotulo}: ${falhas === 0 ? 'SUCESSO' : `${falhas} falha(s)`} ===`);
  return falhas;
}

async function main() {
  for (const key of rodar) {
    falhasTotais += await rodarPerfil(PERFIS[key]);
  }
  console.log(`\n=== TOTAL: ${falhasTotais === 0 ? 'SUCESSO' : `${falhasTotais} falha(s)`} ===`);
  process.exit(falhasTotais === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
