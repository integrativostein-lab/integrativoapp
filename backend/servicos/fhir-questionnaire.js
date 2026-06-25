/**
 * Mapeamento simplificado para FHIR QuestionnaireResponse (R4).
 * Preparado para interoperabilidade futura com prontuário / RNDS.
 */
const { QUESTIONNAIRE_URL } = require('../config/auto-diagnostico-publico');
const { SCHEMA_ANAMNESE } = require('../../shared/versao');
const { campoPorId } = require('../config/anamnese-campos');

const QUESTIONNAIRE_URL_CLINICA =
  'https://integrativo.app/fhir/Questionnaire/anamnese-integrativa-v' + SCHEMA_ANAMNESE.replace('.', '-');

function respostaParaItem(linkId, valor) {
  if (valor === undefined || valor === null || String(valor).trim() === '') return null;
  const campo = campoPorId(linkId);
  const texto = String(valor).trim();
  const item = {
    linkId,
    text: campo?.nome || linkId
  };
  if (campo?.tipo === 'number' || campo?.tipo === 'escala') {
    const n = Number(texto);
    if (Number.isFinite(n)) {
      item.answer = [{ valueInteger: n }];
      return item;
    }
  }
  item.answer = [{ valueString: texto.slice(0, 8000) }];
  return item;
}

function montarQuestionnaireResponse(respostas = {}, meta = {}) {
  const items = Object.keys(respostas || {})
    .map((id) => respostaParaItem(id, respostas[id]))
    .filter(Boolean);

  const clinica = meta.finalidade === 'anamnese-clinica';
  const tagCode = clinica ? 'anamnese-clinica' : 'auto-diagnostico-orientativo';

  const out = {
    resourceType: 'QuestionnaireResponse',
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/QuestionnaireResponse'],
      tag: [{ system: 'https://integrativo.app/fhir/tags', code: tagCode }]
    },
    questionnaire: meta.questionnaire || (clinica ? QUESTIONNAIRE_URL_CLINICA : QUESTIONNAIRE_URL),
    status: meta.status || 'completed',
    authored: meta.gerado_em || new Date().toISOString(),
    item: items
  };

  if (meta.id) out.id = `anamnese-${meta.id}`;
  if (meta.subject) out.subject = meta.subject;
  if (meta.author) out.author = meta.author;
  if (meta.encounter) out.encounter = meta.encounter;

  return out;
}

module.exports = {
  montarQuestionnaireResponse,
  respostaParaItem,
  QUESTIONNAIRE_URL_CLINICA
};
