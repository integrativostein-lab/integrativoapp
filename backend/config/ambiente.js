const fs = require('fs');
const path = require('path');

const modoTeste = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test' || !!process.env.TESTE;
const testeDir = process.env.TESTE || null;

function caminhoDados(...partes) {
  if (testeDir) return path.join(testeDir, ...partes);
  return path.join(__dirname, '..', ...partes);
}

function garantirDiretorio(...partes) {
  const dir = caminhoDados(...partes);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Alfa / TEST_MODE: dados fictícios — fluxos de consentimento LGPD são dispensados. */
const ignorarLgpd = modoTeste;

module.exports = {
  modoTeste,
  ignorarLgpd,
  testeDir,
  caminhoDados,
  garantirDiretorio
};
