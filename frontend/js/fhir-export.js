/**
 * Exportação FHIR — somente área do profissional.
 */
(function (global) {
  function token() {
    return localStorage.getItem('integra_token') || '';
  }

  function baixarJson(nomeArquivo, dados) {
    var blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/fhir+json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function fetchJson(url, options) {
    var r = await fetch(url, options);
    var data = {};
    try { data = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(data.erro || 'Falha na exportação FHIR.');
    return data;
  }

  async function exportarAnamnese(anamneseId, bundle) {
    if (!anamneseId) throw new Error('Salve a anamnese antes de exportar.');
    var base = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : '/api';
    var path = bundle
      ? '/anamneses/' + anamneseId + '/fhir-bundle'
      : '/anamneses/' + anamneseId + '/fhir';
    var dados = await fetchJson(base + path, {
      headers: { Authorization: 'Bearer ' + token() }
    });
    var sufixo = bundle ? '-bundle' : '-questionnaire';
    baixarJson('integrativo-anamnese-' + anamneseId + sufixo + '.json', dados);
    return dados;
  }

  async function exportarFhir(tipo, body) {
    var apiRoot = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : '/api';
    var rotas = (typeof CONFIG !== 'undefined' && CONFIG.FHIR && CONFIG.FHIR.rotas) ? CONFIG.FHIR.rotas : {};
    var mapa = {
      patient: rotas.exportPatient || '/api/fhir/export-patient',
      practitioner: rotas.exportPractitioner || '/api/fhir/export-practitioner',
      appointment: rotas.exportAppointment || '/api/fhir/export-appointment',
      encounter: rotas.exportEncounter || '/api/fhir/export-encounter',
      medication: rotas.exportMedicationRequest || '/api/fhir/export-medication-request',
      bundle: rotas.exportBundle || '/api/fhir/export-bundle'
    };
    var path = mapa[tipo];
    if (!path) throw new Error('Tipo de exportação FHIR inválido.');
    var url = path.startsWith('http') ? path : apiRoot.replace(/\/api$/, '') + path;
    return fetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token()
      },
      body: JSON.stringify(body || {})
    });
  }

  global.FhirExport = {
    baixarJson: baixarJson,
    exportarAnamnese: exportarAnamnese,
    exportarFhir: exportarFhir
  };
})(window);
