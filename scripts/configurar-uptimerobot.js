#!/usr/bin/env node
/**
 * Cria/atualiza monitors UptimeRobot para manter o backend Render acordado.
 * Requer UPTIMEROBOT_API_KEY no .env.alfa (ou env).
 *
 * Uso: node scripts/configurar-uptimerobot.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.alfa');

const MONITORS = [
  {
    friendly_name: 'Integrativo — Render alfa backend',
    url: process.env.ALFA_BACKEND_URL || 'https://integrativoappespelho.onrender.com/',
    keyword_type: 2,
    keyword_value: 'online'
  },
  {
    friendly_name: 'Integrativo — Render backend principal',
    url: process.env.PROD_BACKEND_URL || 'https://integra-backend-ynrd.onrender.com/',
    keyword_type: 2,
    keyword_value: 'online'
  }
];

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  fs.readFileSync(ENV_FILE, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (!val) return;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
}

async function uptimerobotApi(endpoint, body) {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) throw new Error('UPTIMEROBOT_API_KEY ausente. Crie em uptimerobot.com → My Settings → API Settings.');

  const params = new URLSearchParams({ api_key: apiKey, format: 'json', ...body });
  const r = await fetch(`https://api.uptimerobot.com/v2/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
    body: params.toString(),
    signal: AbortSignal.timeout(60000)
  });
  const json = await r.json();
  if (json.stat !== 'ok') {
    throw new Error(json.error?.message || json.message || JSON.stringify(json));
  }
  return json;
}

async function listarMonitors() {
  const data = await uptimerobotApi('getMonitors', {});
  return data.monitors || [];
}

async function criarMonitor(cfg) {
  const existentes = await listarMonitors();
  const dup = existentes.find((m) => m.url === cfg.url || m.friendly_name === cfg.friendly_name);
  if (dup) {
    console.log(`   ✓ Já existe: ${dup.friendly_name} (${dup.url}) — id ${dup.id}`);
    return dup;
  }

  const data = await uptimerobotApi('newMonitor', {
    type: '1',
    url: cfg.url,
    friendly_name: cfg.friendly_name,
    interval: '300',
    timeout: '30',
    keyword_type: String(cfg.keyword_type || 0),
    keyword_value: cfg.keyword_value || ''
  });
  console.log(`   ✓ Criado: ${cfg.friendly_name} — id ${data.monitor?.id}`);
  return data.monitor;
}

async function main() {
  loadEnv();
  const skipPrincipal = process.env.UPTIMEROBOT_SKIP_PRINCIPAL === 'true';
  const lista = skipPrincipal ? [MONITORS[0]] : MONITORS;

  console.log('\n📡 UptimeRobot — configurando pings Render (intervalo 5 min)\n');
  for (const cfg of lista) {
    await criarMonitor(cfg);
  }
  console.log('\n✅ Monitors configurados.\n');
}

main().catch((err) => {
  console.error('\n❌ UptimeRobot:', err.message);
  process.exit(1);
});
