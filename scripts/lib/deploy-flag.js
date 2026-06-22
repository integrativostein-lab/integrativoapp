/**
 * Marca o bundle frontend como alfa ou produção (const INTEGRATIVO_DEPLOY em config.js).
 * Usado pelos scripts de deploy Vercel — o repositório local permanece em 'producao'.
 */
const fs = require('fs');
const path = require('path');

const CONFIG_JS = path.join(__dirname, '../../frontend/js/config.js');
const FLAG_RE = /const INTEGRATIVO_DEPLOY = '[^']*';/;

function lerFlagAtual() {
  const src = fs.readFileSync(CONFIG_JS, 'utf8');
  const m = src.match(FLAG_RE);
  if (!m) throw new Error('INTEGRATIVO_DEPLOY não encontrado em frontend/js/config.js');
  return m[0].match(/'([^']*)'/)[1];
}

function definirFlag(modo) {
  if (!['alfa', 'producao'].includes(modo)) {
    throw new Error(`Modo de deploy inválido: ${modo}`);
  }
  let src = fs.readFileSync(CONFIG_JS, 'utf8');
  if (!FLAG_RE.test(src)) {
    throw new Error('INTEGRATIVO_DEPLOY não encontrado em frontend/js/config.js');
  }
  src = src.replace(FLAG_RE, `const INTEGRATIVO_DEPLOY = '${modo}';`);
  fs.writeFileSync(CONFIG_JS, src, 'utf8');
  return modo;
}

/** Patch temporário — restaura o valor anterior ao chamar restore(). */
function patchTemporario(modo) {
  const anterior = lerFlagAtual();
  definirFlag(modo);
  return () => definirFlag(anterior);
}

module.exports = {
  CONFIG_JS,
  lerFlagAtual,
  definirFlag,
  patchTemporario
};
