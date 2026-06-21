/**
 * Cliente mínimo da GitHub REST API.
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

function createGitHubClient({ token, dryRun = false } = {}) {
  if (!token) throw new Error('GITHUB_TOKEN ausente');

  async function api(method, path, body) {
    const r = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(120000)
    });
    const text = await r.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    if (!r.ok) throw new Error(`GitHub ${method} ${path}: ${r.status} — ${text.slice(0, 400)}`);
    return json;
  }

  async function getRepo(owner, repo) {
    return api('GET', `/repos/${owner}/${repo}`);
  }

  async function updateRepo(owner, repo, fields) {
    if (dryRun) {
      console.log(`   [dry-run] PATCH ${owner}/${repo}`, fields);
      return;
    }
    await api('PATCH', `/repos/${owner}/${repo}`, fields);
    console.log(`   ✓ ${owner}/${repo} atualizado`);
  }

  async function upsertFile(owner, repo, filePath, content, message, branch = 'master') {
    let sha;
    try {
      const existing = await api('GET', `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`);
      sha = existing.sha;
    } catch {
      sha = undefined;
    }
    if (dryRun) {
      console.log(`   [dry-run] ${filePath} em ${owner}/${repo}`);
      return;
    }
    await api('PUT', `/repos/${owner}/${repo}/contents/${filePath}`, {
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
      ...(sha ? { sha } : {})
    });
    console.log(`   ✓ ${owner}/${repo}/${filePath}`);
  }

  return { api, getRepo, updateRepo, upsertFile };
}

module.exports = { loadEnvFile, createGitHubClient };
