#!/usr/bin/env node
/**
 * Alinha repositórios GitHub com a infra (1 repo oficial + espelho arquivado).
 *
 * Pré-requisito: GITHUB_TOKEN no .env.alfa
 * Permissões: Contents (R/W), Administration (R/W) nos repos integrativoapp e integrativoappespelho
 *
 * Uso:
 *   node scripts/sincronizar-github.js
 *   node scripts/sincronizar-github.js --dry-run
 *   node scripts/sincronizar-github.js --skip-archive
 */
const path = require('path');
const { loadEnvFile, createGitHubClient } = require('./lib/github-api');
const { SITE_CANONICO } = require('../backend/config/dominios');

const ENV_FILE = path.join(__dirname, '..', '.env.alfa');

const FLAGS = {
  dryRun: process.argv.includes('--dry-run'),
  skipArchive: process.argv.includes('--skip-archive')
};

const OWNER = process.env.GITHUB_OWNER || 'integrativostein-lab';
const REPO_MAIN = process.env.GITHUB_REPO || 'integrativoapp';
const REPO_ESPELHOR = process.env.GITHUB_REPO_ESPELHOR || 'integrativoappespelho';

const README_ESPELHOR = `# Repositório arquivado

O código oficial do **Integrativo.App** está em:

**https://github.com/${OWNER}/${REPO_MAIN}**

- **Produção:** ${SITE_CANONICO}
- **Backend alfa (Render):** serviço \`integrativoappespelho\` — mesmo repo \`${REPO_MAIN}\`, pasta \`backend/\`

Este repositório (\`${REPO_ESPELHOR}\`) era um espelho vazio e foi arquivado para evitar confusão.
`;

async function configurarRepoPrincipal(gh) {
  console.log(`\n📦 Repositório principal — ${OWNER}/${REPO_MAIN}`);
  const repo = await gh.getRepo(OWNER, REPO_MAIN);
  console.log(`   Branch padrão: ${repo.default_branch} · arquivado: ${repo.archived}`);

  await gh.updateRepo(OWNER, REPO_MAIN, {
    description: 'Integrativo.App — plataforma de saúde integrativa (frontend + backend Node)',
    homepage: SITE_CANONICO,
    has_issues: true,
    has_wiki: false,
    allow_merge_commit: true,
    allow_squash_merge: true,
    delete_branch_on_merge: true
  });
}

async function arquivarRepoEspelho(gh) {
  console.log(`\n🗄️ Repositório espelho — ${OWNER}/${REPO_ESPELHOR}`);
  let repo;
  try {
    repo = await gh.getRepo(OWNER, REPO_ESPELHOR);
  } catch (e) {
    console.log(`   ℹ️ Repo não encontrado ou sem acesso — pulando (${e.message.split('—')[0]})`);
    return;
  }

  if (!repo.archived) {
    await gh.upsertFile(
      OWNER,
      REPO_ESPELHOR,
      'README.md',
      README_ESPELHOR,
      'docs: apontar para repositório oficial integrativoapp',
      repo.default_branch || 'master'
    );
    await gh.updateRepo(OWNER, REPO_ESPELHOR, {
      description: 'Arquivado — use integrativostein-lab/integrativoapp',
      homepage: `https://github.com/${OWNER}/${REPO_MAIN}`,
      archived: true
    });
    console.log('   ✓ Repositório arquivado');
  } else {
    console.log('   ✓ Já estava arquivado');
  }
}

async function main() {
  console.log('\n🐙 Sincronizar GitHub — Integrativo.App\n');
  loadEnvFile(ENV_FILE);

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error('❌ GITHUB_TOKEN ausente no .env.alfa');
    console.error('   GitHub → Settings → Developer settings → Fine-grained tokens');
    console.error('   Permissões: Contents + Administration nos repos integrativoapp e integrativoappespelho');
    process.exit(1);
  }

  const gh = createGitHubClient({ token, dryRun: FLAGS.dryRun });
  if (FLAGS.dryRun) console.log('   Modo dry-run\n');

  await configurarRepoPrincipal(gh);
  if (!FLAGS.skipArchive) await arquivarRepoEspelho(gh);

  console.log('\n✅ GitHub sincronizado.');
  console.log(`   Código oficial: https://github.com/${OWNER}/${REPO_MAIN}`);
  console.log(`   Site: ${SITE_CANONICO}\n');
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
