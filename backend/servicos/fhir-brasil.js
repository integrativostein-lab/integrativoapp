/**
 * Mapeadores FHIR R4 — perfis HL7 Brasil / RNDS
 * Conversão entre registros do Integrativo.App e recursos FHIR
 */
const FHIR = require('../config/fhir');

const { PROFILES, NAMING_SYSTEMS, CODE_SYSTEMS } = FHIR;

function limparNumeros(valor) {
  if (valor == null || valor === '') return null;
  return String(valor).replace(/\D/g, '');
}

function buildMeta(...profiles) {
  return {
    profile: profiles.filter(Boolean),
    lastUpdated: new Date().toISOString()
  };
}

function mapearGeneroParaFhir(genero) {
  const g = String(genero || '').toLowerCase();
  const mapa = {
    masculino: 'male', m: 'male', male: 'male',
    feminino: 'female', f: 'female', female: 'female',
    outro: 'other', other: 'other',
    indeterminado: 'unknown', unknown: 'unknown'
  };
  return mapa[g] || 'unknown';
}

function mapearGeneroDeFhir(gender) {
  const mapa = { male: 'masculino', female: 'feminino', other: 'outro', unknown: null };
  return mapa[gender] || null;
}

function combinarDataHora(dataAgendamento, horario) {
  if (!dataAgendamento) return null;
  const data = String(dataAgendamento).split('T')[0];
  const hora = horario ? String(horario).slice(0, 5) : '00:00';
  return `${data}T${hora}:00-03:00`;
}

function mapearStatusAgendamento(status) {
  const mapa = {
    agendado: 'booked',
    confirmado: 'booked',
    em_andamento: 'arrived',
    realizado: 'fulfilled',
    cancelado: 'cancelled',
    faltou: 'noshow'
  };
  return mapa[String(status || '').toLowerCase()] || 'proposed';
}

function mapearStatusEncounter(status) {
  const mapa = {
    agendado: 'planned',
    confirmado: 'planned',
    em_andamento: 'in-progress',
    realizado: 'finished',
    cancelado: 'cancelled',
    faltou: 'cancelled'
  };
  return mapa[String(status || '').toLowerCase()] || 'planned';
}

function mapearModalidade(modalidade) {
  const mapa = {
    online: { code: '09', display: 'Teleconsulta' },
    presencial: { code: '01', display: 'Ambulatorial' },
    domicilio: { code: '02', display: 'Domiciliar' }
  };
  return mapa[String(modalidade || '').toLowerCase()] || mapa.presencial;
}

function identificadorCPF(cpf) {
  const valor = limparNumeros(cpf);
  if (!valor) return null;
  return { use: 'official', system: NAMING_SYSTEMS.CPF, value: valor };
}

function identificadorCNS(cns) {
  const valor = limparNumeros(cns);
  if (!valor) return null;
  return { use: 'official', system: NAMING_SYSTEMS.CNS, value: valor };
}

function identificadorCNES(cnes) {
  const valor = limparNumeros(cnes);
  if (!valor) return null;
  return { use: 'official', system: NAMING_SYSTEMS.CNES, value: valor };
}

function identificadorCNPJ(cnpj) {
  const valor = limparNumeros(cnpj);
  if (!valor) return null;
  return { use: 'official', system: NAMING_SYSTEMS.CNPJ, value: valor };
}

function identificadorConselho(conselho, uf, numero) {
  if (!conselho || !numero) return null;
  const sigla = String(conselho).toUpperCase();
  const ufSigla = uf ? String(uf).toUpperCase() : '';
  const valor = ufSigla ? `${sigla}-${ufSigla}-${numero}` : `${sigla}-${numero}`;
  return { use: 'official', system: NAMING_SYSTEMS.CONSELHO, value: valor };
}

function identificadorInterno(id, tipo) {
  return {
    use: 'secondary',
    system: NAMING_SYSTEMS.INTEGRATIVO,
    value: `${tipo}-${id}`
  };
}

function montarIdentificadores(registro, opcoes = {}) {
  const ids = [];
  const cpf = identificadorCPF(registro.cpf);
  const cns = identificadorCNS(registro.cns || registro.cns_profissional);
  const cnes = identificadorCNES(registro.cnes);
  const cnpj = identificadorCNPJ(registro.cnpj);
  const conselho = identificadorConselho(
    registro.conselho_classe || registro.conselho_profissional || registro.conselho,
    registro.uf_conselho,
    registro.registro_profissional || registro.numero_registro
  );

  if (cpf) ids.push(cpf);
  if (cns) ids.push(cns);
  if (cnes) ids.push(cnes);
  if (cnpj) ids.push(cnpj);
  if (conselho) ids.push(conselho);
  if (opcoes.incluirInterno !== false && registro.id) {
    ids.push(identificadorInterno(registro.id, opcoes.tipoInterno || 'usuario'));
  }
  return ids;
}

function montarNome(nome) {
  if (!nome) return [];
  const partes = String(nome).trim().split(/\s+/);
  const family = partes.length > 1 ? partes.slice(-1).join(' ') : partes[0];
  const given = partes.length > 1 ? partes.slice(0, -1) : [];
  return [{ use: 'official', text: nome, family, given }];
}

function montarTelecom(registro) {
  const telecom = [];
  if (registro.email) telecom.push({ system: 'email', value: registro.email, use: 'home' });
  if (registro.telefone) telecom.push({ system: 'phone', value: registro.telefone, use: 'mobile' });
  return telecom;
}

function montarEndereco(registro) {
  if (!registro.cidade && !registro.estado) return [];
  return [{
    use: 'home',
    type: 'physical',
    city: registro.cidade || undefined,
    state: registro.estado || undefined,
    country: 'BR'
  }];
}

function pacienteParaPatient(registro) {
  return {
    resourceType: 'Patient',
    id: String(registro.id),
    meta: buildMeta(PROFILES.Patient),
    identifier: montarIdentificadores(registro, { tipoInterno: 'paciente' }),
    active: registro.ativo !== 0 && registro.ativo !== false,
    name: montarNome(registro.nome),
    telecom: montarTelecom(registro),
    gender: mapearGeneroParaFhir(registro.genero),
    birthDate: registro.data_nascimento
      ? String(registro.data_nascimento).split('T')[0]
      : undefined,
    address: montarEndereco(registro)
  };
}

function profissionalParaPractitioner(registro) {
  const practitioner = {
    resourceType: 'Practitioner',
    id: String(registro.id),
    meta: buildMeta(PROFILES.Practitioner),
    identifier: montarIdentificadores(registro, { tipoInterno: 'profissional' }),
    active: registro.ativo !== 0 && registro.ativo !== false,
    name: montarNome(registro.nome),
    telecom: montarTelecom(registro),
    address: montarEndereco(registro)
  };

  if (registro.cbo) {
    practitioner.qualification = [{
      code: {
        coding: [{
          system: CODE_SYSTEMS.CBO,
          code: String(registro.cbo),
          display: registro.especialidades || undefined
        }]
      }
    }];
  }

  return practitioner;
}

function usuarioParaOrganization(registro) {
  const org = {
    resourceType: 'Organization',
    id: String(registro.id),
    meta: buildMeta(PROFILES.Organization),
    identifier: [],
    active: true,
    name: registro.nome_loja || registro.nome || 'Estabelecimento de Saúde',
    telecom: montarTelecom(registro),
    address: montarEndereco(registro)
  };

  const cnes = identificadorCNES(registro.cnes);
  const cnpj = identificadorCNPJ(registro.cnpj);
  if (cnes) org.identifier.push(cnes);
  if (cnpj) org.identifier.push(cnpj);
  org.identifier.push(identificadorInterno(registro.id, 'organizacao'));

  return org;
}

function agendamentoParaAppointment(agendamento, refs = {}) {
  const inicio = combinarDataHora(agendamento.data_agendamento, agendamento.horario_inicio);
  const fim = combinarDataHora(agendamento.data_agendamento, agendamento.horario_fim);
  const modalidade = mapearModalidade(agendamento.modalidade);
  const servico = agendamento.tipo_sessao || agendamento.especialidade || refs.especialidade;

  return {
    resourceType: 'Appointment',
    id: String(agendamento.id),
    meta: buildMeta(PROFILES.Appointment),
    identifier: [identificadorInterno(agendamento.id, 'agendamento')],
    status: mapearStatusAgendamento(agendamento.status),
    serviceType: servico ? [{
      coding: [{
        system: CODE_SYSTEMS.SERVICE_TYPE,
        code: String(servico).toLowerCase().replace(/\s+/g, '-'),
        display: servico
      }]
    }] : undefined,
    appointmentType: {
      coding: [{
        system: CODE_SYSTEMS.MODALIDADE,
        code: modalidade.code,
        display: modalidade.display
      }]
    },
    start: inicio,
    end: fim,
    participant: [
      {
        actor: {
          reference: `Practitioner/${agendamento.profissional_id}`,
          display: refs.profissionalNome || agendamento.prof_nome
        },
        status: 'accepted'
      },
      {
        actor: {
          reference: `Patient/${agendamento.paciente_id}`,
          display: refs.pacienteNome || agendamento.pac_nome
        },
        status: 'accepted'
      }
    ]
  };
}

function agendamentoParaEncounter(agendamento, refs = {}) {
  const modalidade = mapearModalidade(agendamento.modalidade);
  const inicio = combinarDataHora(agendamento.data_agendamento, agendamento.horario_inicio);
  const fim = combinarDataHora(agendamento.data_agendamento, agendamento.horario_fim);

  return {
    resourceType: 'Encounter',
    id: String(agendamento.id),
    meta: buildMeta(PROFILES.Encounter),
    identifier: [identificadorInterno(agendamento.id, 'encounter')],
    status: mapearStatusEncounter(agendamento.status),
    class: {
      system: CODE_SYSTEMS.ENCOUNTER_CLASS,
      code: modalidade.code === '09' ? 'VR' : 'AMB',
      display: modalidade.display
    },
    type: [{
      coding: [{
        system: CODE_SYSTEMS.TIPO_ATENDIMENTO,
        code: '01',
        display: agendamento.tipo_sessao || 'Consulta'
      }]
    }],
    subject: {
      reference: `Patient/${agendamento.paciente_id}`,
      display: refs.pacienteNome || agendamento.pac_nome
    },
    participant: [{
      individual: {
        reference: `Practitioner/${agendamento.profissional_id}`,
        display: refs.profissionalNome || agendamento.prof_nome
      }
    }],
    period: { start: inicio, end: fim },
    serviceProvider: refs.cnes
      ? { reference: `Organization/${refs.organizationId || agendamento.profissional_id}` }
      : undefined
  };
}

function prescricaoParaMedicationRequest(prescricao, refs = {}) {
  const itens = typeof prescricao.itens === 'string'
    ? JSON.parse(prescricao.itens || '[]')
    : (prescricao.itens || []);
  const primeiro = itens[0] || {};

  return {
    resourceType: 'MedicationRequest',
    id: String(prescricao.id),
    meta: buildMeta(PROFILES.MedicationRequest),
    identifier: [identificadorInterno(prescricao.id, 'prescricao')],
    status: 'active',
    intent: 'order',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/medicationrequest-category',
        code: prescricao.tipo === 'controle_especial' ? 'outpatient' : 'community',
        display: prescricao.tipo || 'prescricao'
      }]
    }],
    medicationCodeableConcept: {
      text: primeiro.nome || primeiro.medicamento || 'Medicamento não especificado',
      coding: primeiro.codigo_anvisa ? [{
        system: 'http://www.anvisa.gov.br/fhir/CodeSystem/medicamento',
        code: primeiro.codigo_anvisa,
        display: primeiro.nome
      }] : undefined
    },
    subject: {
      reference: `Patient/${prescricao.paciente_id}`,
      display: refs.pacienteNome
    },
    requester: {
      reference: `Practitioner/${prescricao.profissional_id}`,
      display: refs.profissionalNome
    },
    authoredOn: prescricao.data_prescricao
      ? new Date(prescricao.data_prescricao).toISOString()
      : new Date().toISOString(),
    dosageInstruction: itens.map(item => ({
      text: [item.nome, item.dosagem_padrao || item.dosagem, item.descricao]
        .filter(Boolean)
        .join(' — '),
      patientInstruction: item.observacoes || undefined
    })),
    note: prescricao.observacoes ? [{ text: prescricao.observacoes }] : undefined
  };
}

function observacaoDeTexto({ id, pacienteId, texto, codigo, display, profissionalId }) {
  return {
    resourceType: 'Observation',
    id: String(id),
    meta: buildMeta(PROFILES.Observation),
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'survey',
        display: 'Survey'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: codigo || '11450-4',
        display: display || 'Problem'
      }],
      text: display || texto
    },
    subject: { reference: `Patient/${pacienteId}` },
    performer: profissionalId ? [{ reference: `Practitioner/${profissionalId}` }] : undefined,
    valueString: texto
  };
}

function condicaoDeTexto({ id, pacienteId, texto, codigoCid }) {
  return {
    resourceType: 'Condition',
    id: String(id),
    meta: buildMeta(PROFILES.Condition),
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active'
      }]
    },
    code: {
      coding: codigoCid ? [{
        system: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRCID10',
        code: codigoCid
      }] : undefined,
      text: texto
    },
    subject: { reference: `Patient/${pacienteId}` }
  };
}

function criarBundle(tipo, recursos, identificador = null) {
  return {
    resourceType: 'Bundle',
    id: identificador || `bundle-${Date.now()}`,
    meta: buildMeta(PROFILES.Bundle),
    type: tipo || 'document',
    timestamp: new Date().toISOString(),
    entry: recursos.map(r => ({
      fullUrl: `${FHIR.BASE_URL}/${r.resourceType}/${r.id}`,
      resource: r
    }))
  };
}

function patientDeFhir(fhirPatient) {
  const cpf = (fhirPatient.identifier || []).find(i => i.system === NAMING_SYSTEMS.CPF);
  const cns = (fhirPatient.identifier || []).find(i => i.system === NAMING_SYSTEMS.CNS);
  const nome = fhirPatient.name?.[0]?.text || fhirPatient.name?.[0]?.family;
  const email = (fhirPatient.telecom || []).find(t => t.system === 'email')?.value;
  const telefone = (fhirPatient.telecom || []).find(t => t.system === 'phone')?.value;

  return {
    nome,
    cpf: cpf?.value,
    cns: cns?.value,
    email,
    telefone,
    genero: mapearGeneroDeFhir(fhirPatient.gender),
    data_nascimento: fhirPatient.birthDate,
    cidade: fhirPatient.address?.[0]?.city,
    estado: fhirPatient.address?.[0]?.state
  };
}

async function salvarExportacao(db, usuarioId, tipoRecurso, recursoId, fhirJson, urlFhir) {
  await db.query(
    `INSERT INTO fhir_exports (usuario_id, tipo_recurso, recurso_id, fhir_json, url_fhir, criado_em, atualizado_em)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [usuarioId, tipoRecurso, recursoId, JSON.stringify(fhirJson), urlFhir || null]
  );
}

function capabilityStatement() {
  return {
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    kind: 'instance',
    software: { name: 'Integrativo.App', version: '2.1.0' },
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      resource: [
        { type: 'Patient', profile: PROFILES.Patient },
        { type: 'Practitioner', profile: PROFILES.Practitioner },
        { type: 'Organization', profile: PROFILES.Organization },
        { type: 'Encounter', profile: PROFILES.Encounter },
        { type: 'Appointment', profile: PROFILES.Appointment },
        { type: 'MedicationRequest', profile: PROFILES.MedicationRequest },
        { type: 'Observation', profile: PROFILES.Observation },
        { type: 'Condition', profile: PROFILES.Condition },
        { type: 'Bundle', profile: PROFILES.Bundle }
      ]
    }],
    implementationGuide: ['http://www.saude.gov.br/fhir/r4/ImplementationGuide/br.gov.saude.rnds']
  };
}

module.exports = {
  FHIR,
  limparNumeros,
  buildMeta,
  mapearGeneroParaFhir,
  mapearGeneroDeFhir,
  pacienteParaPatient,
  profissionalParaPractitioner,
  usuarioParaOrganization,
  agendamentoParaAppointment,
  agendamentoParaEncounter,
  prescricaoParaMedicationRequest,
  observacaoDeTexto,
  condicaoDeTexto,
  criarBundle,
  patientDeFhir,
  salvarExportacao,
  capabilityStatement
};
