/**
 * Referências normativas — telessaúde / teleconsulta (Brasil)
 * Lei 14.510/2022 · Res. CFM 2.314/2022 · LGPD · Marco Civil
 */

const BASES_LEGAIS = [
  'Lei nº 14.510/2022 (telessaúde)',
  'Resolução CFM nº 2.314/2022 (telemedicina, quando aplicável ao médico)',
  'Lei nº 13.709/2018 (LGPD)',
  'Lei nº 12.965/2014 (Marco Civil da Internet)',
  'Resoluções dos conselhos profissionais aplicáveis à especialidade'
];

const TEXTO_CONSENTIMENTO = {
  titulo: 'Termo de Consentimento Livre e Esclarecido — Telessaúde',
  introducao: 'Antes de iniciar o atendimento remoto, leia e confirme os itens abaixo. Este termo integra o prontuário eletrônico do paciente.',
  itens: [
    'Autorizo o atendimento por telessaúde (consulta não presencial mediada por tecnologias digitais), com transmissão de áudio, vídeo e dados clínicos necessários.',
    'Fui informado(a) sobre as limitações do atendimento remoto, incluindo a impossibilidade de exame físico completo e a necessidade de comparecimento presencial quando indicado pelo profissional.',
    'Tenho direito de recusar a telessaúde e solicitar atendimento presencial, bem como de interromper o atendimento remoto a qualquer momento.',
    'Estou ciente de que minhas informações pessoais e de saúde serão tratadas conforme a LGPD, com finalidade assistencial, e que posso exercer meus direitos de titular.',
    'O profissional mantém autonomia para indicar presencial ou encerrar o atendimento remoto quando julgar necessário.',
    'Gravação de áudio/vídeo só ocorrerá com consentimento específico adicional de todos os participantes, salvo disposição legal distinta.'
  ],
  direitos: [
    'Recusar ou interromper a telessaúde',
    'Solicitar atendimento presencial',
    'Revogar consentimentos opcionais conforme LGPD',
    'Acessar registros do atendimento no prontuário'
  ]
};

const LIMITES_ATENDIMENTO = [
  'Não substitui emergência — em urgência, procure SAMU (192) ou pronto-socorro.',
  'Exame físico completo pode ser limitado; o profissional pode solicitar presencial.',
  'Conexão, qualidade de áudio/vídeo e ambiente do usuário podem afetar a consulta.',
  'Documentos com validade legal específica (ex.: receitas controladas) seguem normas ANVISA/CFM aplicáveis.'
];

module.exports = { BASES_LEGAIS, TEXTO_CONSENTIMENTO, LIMITES_ATENDIMENTO };
