/**
 * Mapeamento simplificado para FHIR QuestionnaireResponse (R4).
 * Preparado para interoperabilidade futura com prontuário / RNDS.
 */
const { QUESTIONNAIRE_URL } = require('../config/auto-diagnostico-publico');
const { campoPorId } = require('../config/anamnese-campos');

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

  return {
    resourceType: 'QuestionnaireResponse',
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/QuestionnaireResponse'],
      tag: [{ system: 'https://integrativo.app/fhir/tags', code: 'auto-diagnostico-orientativo' }]
    },
    questionnaire: QUESTIONNAIRE_URL,
    status: 'completed',
    authored: meta.gerado_em || new Date().toISOString(),
    item: items
  };
}

module.exports = { montarQuestionnaireResponse, respostaParaItem };
