/**
 * Configuração FHIR R4 — perfis e terminologias HL7 Brasil / RNDS
 */
module.exports = {
  HAPI_URL: process.env.FHIR_HAPI_URL || 'https://hapi.fhir.org.br/fhir',
  FIOCRUZ_API: process.env.FIOCRUZ_API_URL || 'https://arca.fiocruz.br/api',
  REDEPICS_API: process.env.REDEPICS_API_URL || 'https://redepicsbrasil.org.br/api',
  BIREME_API: process.env.BIREME_API_URL || 'https://www.bireme.org.br/api',
  BASE_URL: process.env.FHIR_BASE_URL || 'http://localhost:3000/api/fhir',
  RNDS_ENABLED: process.env.RNDS_ENABLED === 'true',
  RNDS_AUTH_URL: process.env.RNDS_AUTH_URL || 'https://ehr-services.saude.gov.br/api/auth/token',

  PROFILES: {
    Patient: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRIndividuo-1.0',
    Practitioner: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRProfissional-1.0',
    Organization: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BREstabelecimentoSaude-1.0',
    Encounter: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRAtendimentoRegistroAtendimentoClinico-1.0',
    Appointment: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRAgendamentoRegistroConsulta-1.0',
    Observation: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRObservacaoDescritiva-1.0',
    Condition: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRCondicao-1.0',
    MedicationRequest: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRMedicamentoPrescricaoMedicamento-1.0',
    Bundle: 'http://www.saude.gov.br/fhir/r4/StructureDefinition/BRDocumentoBundle-1.0'
  },

  NAMING_SYSTEMS: {
    CPF: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cpf',
    CNS: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cns',
    CNES: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cnes',
    CNPJ: 'http://www.saude.gov.br/fhir/r4/NamingSystem/cnpj',
    CONSELHO: 'http://www.saude.gov.br/fhir/r4/NamingSystem/conselho-profissional',
    INTEGRATIVO: 'https://integrativo.app/fhir/NamingSystem/recurso-interno'
  },

  CODE_SYSTEMS: {
    SEXO: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRSexo',
    MODALIDADE: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRModalidadeAssistencial',
    TIPO_ATENDIMENTO: 'http://www.terminologia.saude.gov.br/fhir/CodeSystem/BRTipoAtendimento',
    CBO: 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRCBO',
    SERVICE_TYPE: 'http://terminology.hl7.org/CodeSystem/service-type',
    APPOINTMENT_STATUS: 'http://hl7.org/fhir/appointmentstatus',
    ENCOUNTER_STATUS: 'http://hl7.org/fhir/encounter-status',
    ENCOUNTER_CLASS: 'http://terminology.hl7.org/CodeSystem/v3-ActCode'
  }
};
