/**
 * Cliente mínimo da API Render (env vars, deploy, repo).
 */
const fs = require('fs');

function loadEnvFile(filePath, target = process.env) {
  if (!fs.existsSync(filePath)) return false;
  fs.readFileSync(filePath, 'utf8').split('\n').forEach((line) => {
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
    if (!target[key]) target[key] = val;
  });
  return true;
}

function createRenderClient({ apiKey, dryRun = false } = {}) {
  if (!apiKey) throw new Error('RENDER_API_KEY ausente');

  async function api(method, endpoint, body) {
    const r = await fetch(`https://api.render.com/v1${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(120000)
    });
    const text = await r.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    if (!r.ok) throw new Error(`Render API ${method} ${endpoint}: ${r.status} — ${text.slice(0, 400)}`);
    return json;
  }

  async function listServices(limit = 50) {
    const data = await api('GET', `/services?limit=${limit}`);
    return Array.isArray(data) ? data : (data?.items || data?.services || []);
  }

  async function findService(nomeOuId) {
    if (nomeOuId && nomeOuId.startsWith('srv-')) return nomeOuId;
    const alvo = String(nomeOuId || '').toLowerCase();
    const lista = await listServices(100);
    const found = lista.find((item) => {
      const svc = item.service || item;
      const n = (svc.name || '').toLowerCase();
      const s = (svc.slug || '').toLowerCase();
      return n === alvo || s === alvo || n.includes(alvo) || s.includes(alvo);
    });
    if (!found) throw new Error(`Serviço Render "${nomeOuId}" não encontrado`);
    const svc = found.service || found;
    return { id: svc.id, name: svc.name, slug: svc.slug };
  }

  async function getService(serviceId) {
    const data = await api('GET', `/services/${serviceId}`);
    return data.service || data;
  }

  async function upsertEnv(serviceId, key, value) {
    const val = String(value);
    if (dryRun) {
      console.log(`   [dry-run] ${key}=${val.slice(0, 50)}${val.length > 50 ? '…' : ''}`);
      return;
    }
    try {
      await api('PUT', `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`, { value: val });
      console.log(`   ✓ ${key}`);
    } catch (e) {
      if (String(e.message).includes('404')) {
        await api('POST', `/services/${serviceId}/env-vars`, { envVar: { key, value: val } });
        console.log(`   ✓ ${key} (criado)`);
      } else {
        throw e;
      }
    }
  }

  async function upsertEnvMap(serviceId, vars) {
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined || value === null || value === '') continue;
      await upsertEnv(serviceId, key, value);
    }
  }

  async function triggerDeploy(serviceId, { clearCache = false } = {}) {
    if (dryRun) {
      console.log(`   [dry-run] deploy ${serviceId}`);
      return;
    }
    await api('POST', `/services/${serviceId}/deploys`, {
      clearCache: clearCache ? 'clear' : 'do_not_clear'
    });
    console.log('   ✓ Redeploy disparado');
  }

  async function updateRepo(serviceId, { repo, branch = 'master', rootDir = 'backend' }) {
    const repoUrl = repo.includes('github.com') ? repo : `https://github.com/${repo}`;
    if (dryRun) {
      console.log(`   [dry-run] repo ${repoUrl} branch ${branch} root ${rootDir}`);
      return { ok: true, dryRun: true };
    }
    try {
      await api('PATCH', `/services/${serviceId}`, {
        repo: repoUrl,
        branch,
        rootDir,
        autoDeploy: 'yes'
      });
      console.log(`   ✓ Repositório → ${repo} (${branch}, ${rootDir}/)`);
      return { ok: true };
    } catch (e) {
      console.log(`   ⚠️ API não alterou repo: ${e.message.split('—')[0]}`);
      console.log(`   → Manual: Render → serviço → Settings → conectar ${repo}`);
      return { ok: false, error: e.message };
    }
  }

  return {
    api,
    listServices,
    findService,
    getService,
    upsertEnv,
    upsertEnvMap,
    triggerDeploy,
    updateRepo
  };
}

module.exports = { loadEnvFile, createRenderClient };
