/**
 * Modo lançamento — recursos clínicos regulados (prescrição, validação de conselhos,
 * FHIR/TISS/SUS) ficam dormentes até certificações. Defina RECURSOS_CLINICOS_ATIVOS=true
 * no Render/Vercel quando estiver pronto.
 */
const recursosClinicosAtivos = process.env.RECURSOS_CLINICOS_ATIVOS === 'true';

const CONSELHOS_REGULADOS = new Set([
  'CRM', 'CRP', 'CREFITO', 'COREN', 'CRO', 'CRN', 'CRF', 'CREF', 'CRBM', 'CRBio', 'CRMV'
]);

function ehEspecialidadeIntegrativa(conselho) {
  if (!conselho) return true;
  if (conselho === 'ABRATH') return true;
  return !CONSELHOS_REGULADOS.has(conselho);
}

module.exports = {
  recursosClinicosAtivos,
  modoLancamento: !recursosClinicosAtivos,
  CONSELHOS_REGULADOS,
  ehEspecialidadeIntegrativa,
  mensagemBloqueio:
    'Este recurso clínico regulado está temporariamente indisponível enquanto concluímos certificações. ' +
    'As bibliotecas terapêuticas e ferramentas para terapeutas integrativos permanecem ativas.'
};
