/**
 * Rotas FHIR R4 — perfis HL7 Brasil / RNDS
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');
const { autenticar } = require('../middlewares/autenticar');
const FHIR_CONFIG = require('../config/fhir');
const {
  pacienteParaPatient,
  profissionalParaPractitioner,
  usuarioParaOrganization,
  agendamentoParaAppointment,
  agendamentoParaEncounter,
  prescricaoParaMedicationRequest,
  criarBundle,
  patientDeFhir,
  salvarExportacao,
  capabilityStatement
} = require('../servicos/fhir-brasil');

const COLUNAS_PACIENTE = `id, nome, email, telefone, cpf, cns, data_nascimento, genero,
  cidade, estado, ativo, tipo`;
const COLUNAS_PROFISSIONAL = `id, nome, email, telefone, cpf, cns, cns_profissional, cnes, cbo,
  registro_profissional, conselho_classe, conselho_profissional, uf_conselho,
  cnpj, cidade, estado, especialidades, ativo, tipo`;

async function buscarPaciente(pacienteId) {
  const result = await db.query(
    `SELECT ${COLUNAS_PACIENTE} FROM usuarios WHERE id = $1 AND tipo = 'paciente'`,
    [pacienteId]
  );
  return result.rows[0] || null;
}

async function buscarProfissional(profissionalId) {
  const result = await db.query(
    `SELECT ${COLUNAS_PROFISSIONAL} FROM usuarios WHERE id = $1 AND tipo IN ('profissional', 'admin')`,
    [profissionalId]
  );
  return result.rows[0] || null;
}

async function buscarAgendamento(agendamentoId) {
  const result = await db.query(
    `SELECT a.*, p.nome AS prof_nome, p.cnes AS prof_cnes,
            pac.nome AS pac_nome, pac.cns AS pac_cns
     FROM agendamentos a
     JOIN usuarios p ON a.profissional_id = p.id
     JOIN usuarios pac ON a.paciente_id = pac.id
     WHERE a.id = $1`,
    [agendamentoId]
  );
  return result.rows[0] || null;
}

async function buscarPrescricao(prescricaoId) {
  const result = await db.query(
    `SELECT pr.*, p.nome AS prof_nome, pac.nome AS pac_nome
     FROM prescricoes pr
     JOIN usuarios p ON pr.profissional_id = p.id
     JOIN usuarios pac ON pr.paciente_id = pac.id
     WHERE pr.id = $1`,
    [prescricaoId]
  );
  return result.rows[0] || null;
}

async function registrarExportacao(req, tipoRecurso, recursoId, fhirJson) {
  const urlFhir = `${FHIR_CONFIG.BASE_URL}/${tipoRecurso}/${recursoId}`;
  try {
    await salvarExportacao(db, req.usuario.id, tipoRecurso, recursoId, fhirJson, urlFhir);
  } catch (e) {
    console.warn('[fhir] Não foi possível salvar em fhir_exports:', e.message);
  }
  return urlFhir;
}

router.get('/metadata', (req, res) => {
  res.json(capabilityStatement());
});

router.post('/export-patient', autenticar, async (req, res) => {
  try {
    const pacienteId = req.body.pacienteId || req.body.patientId;
    if (!pacienteId) return res.status(400).json({ erro: 'pacienteId é obrigatório' });

    const paciente = await buscarPaciente(pacienteId);
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado' });

    const fhirPatient = pacienteParaPatient(paciente);
    await registrarExportacao(req, 'Patient', pacienteId, fhirPatient);
    res.json(fhirPatient);
  } catch (error) {
    console.error('Erro ao exportar paciente FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

router.post('/export-practitioner', autenticar, async (req, res) => {
  try {
    const profissionalId = req.body.profissionalId || req.body.practitionerId;
    if (!profissionalId) return res.status(400).json({ erro: 'profissionalId é obrigatório' });

    const profissional = await buscarProfissional(profissionalId);
    if (!profissional) return res.status(404).json({ erro: 'Profissional não encontrado' });

    const fhirPractitioner = profissionalParaPractitioner(profissional);
    await registrarExportacao(req, 'Practitioner', profissionalId, fhirPractitioner);
    res.json(fhirPractitioner);
  } catch (error) {
    console.error('Erro ao exportar profissional FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

router.post('/export-organization', autenticar, async (req, res) => {
  try {
    const usuarioId = req.body.usuarioId || req.usuario.id;
    const result = await db.query(
      `SELECT ${COLUNAS_PROFISSIONAL} FROM usuarios WHERE id = $1`,
      [usuarioId]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const fhirOrg = usuarioParaOrganization(result.rows[0]);
    await registrarExportacao(req, 'Organization', usuarioId, fhirOrg);
    res.json(fhirOrg);
  } catch (error) {
    console.error('Erro ao exportar organização FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

router.post('/export-appointment', autenticar, async (req, res) => {
  try {
    const agendamentoId = req.body.agendamentoId || req.body.appointmentId;
    if (!agendamentoId) return res.status(400).json({ erro: 'agendamentoId é obrigatório' });

    const agendamento = await buscarAgendamento(agendamentoId);
    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const fhirAppointment = agendamentoParaAppointment(agendamento, {
      pacienteNome: agendamento.pac_nome,
      profissionalNome: agendamento.prof_nome
    });
    await registrarExportacao(req, 'Appointment', agendamentoId, fhirAppointment);
    res.json(fhirAppointment);
  } catch (error) {
    console.error('Erro ao exportar agendamento FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

router.post('/export-encounter', autenticar, async (req, res) => {
  try {
    const agendamentoId = req.body.agendamentoId || req.body.encounterId;
    if (!agendamentoId) return res.status(400).json({ erro: 'agendamentoId é obrigatório' });

    const agendamento = await buscarAgendamento(agendamentoId);
    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const fhirEncounter = agendamentoParaEncounter(agendamento, {
      pacienteNome: agendamento.pac_nome,
      profissionalNome: agendamento.prof_nome,
      cnes: agendamento.prof_cnes,
      organizationId: agendamento.profissional_id
    });
    await registrarExportacao(req, 'Encounter', agendamentoId, fhirEncounter);
    res.json(fhirEncounter);
  } catch (error) {
    console.error('Erro ao exportar encounter FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

router.post('/export-medication-request', autenticar, async (req, res) => {
  try {
    const prescricaoId = req.body.prescricaoId || req.body.medicationRequestId;
    if (!prescricaoId) return res.status(400).json({ erro: 'prescricaoId é obrigatório' });

    const prescricao = await buscarPrescricao(prescricaoId);
    if (!prescricao) return res.status(404).json({ erro: 'Prescrição não encontrada' });

    const fhirMed = prescricaoParaMedicationRequest(prescricao, {
      pacienteNome: prescricao.pac_nome,
      profissionalNome: prescricao.prof_nome
    });
    await registrarExportacao(req, 'MedicationRequest', prescricaoId, fhirMed);
    res.json(fhirMed);
  } catch (error) {
    console.error('Erro ao exportar prescrição FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

router.post('/export-bundle', autenticar, async (req, res) => {
  try {
    const { agendamentoId } = req.body;
    if (!agendamentoId) return res.status(400).json({ erro: 'agendamentoId é obrigatório' });

    const agendamento = await buscarAgendamento(agendamentoId);
    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    const [paciente, profissional] = await Promise.all([
      buscarPaciente(agendamento.paciente_id),
      buscarProfissional(agendamento.profissional_id)
    ]);

    const refs = {
      pacienteNome: agendamento.pac_nome,
      profissionalNome: agendamento.prof_nome,
      cnes: agendamento.prof_cnes,
      organizationId: agendamento.profissional_id
    };

    const recursos = [];
    if (paciente) recursos.push(pacienteParaPatient(paciente));
    if (profissional) recursos.push(profissionalParaPractitioner(profissional));
    if (profissional?.cnes || profissional?.cnpj) {
      recursos.push(usuarioParaOrganization(profissional));
    }
    recursos.push(agendamentoParaEncounter(agendamento, refs));
    recursos.push(agendamentoParaAppointment(agendamento, refs));

    const bundle = criarBundle('document', recursos, `atendimento-${agendamentoId}`);
    await registrarExportacao(req, 'Bundle', agendamentoId, bundle);
    res.json(bundle);
  } catch (error) {
    console.error('Erro ao exportar bundle FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar bundle' });
  }
});

router.post('/import-patient', autenticar, async (req, res) => {
  try {
    const { resource } = req.body;
    if (!resource || resource.resourceType !== 'Patient') {
      return res.status(400).json({ erro: 'Recurso Patient FHIR é obrigatório' });
    }

    const dados = patientDeFhir(resource);
    if (!dados.nome) return res.status(400).json({ erro: 'Patient FHIR deve conter nome' });

    res.json({
      mensagem: 'Patient FHIR mapeado para modelo interno',
      dados,
      perfis: resource.meta?.profile || []
    });
  } catch (error) {
    console.error('Erro ao importar paciente FHIR:', error);
    res.status(500).json({ erro: 'Erro ao importar paciente' });
  }
});

router.get('/exports/:tipo/:id', autenticar, async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const result = await db.query(
      `SELECT fhir_json, url_fhir, criado_em
       FROM fhir_exports
       WHERE tipo_recurso = $1 AND recurso_id = $2
       ORDER BY criado_em DESC
       LIMIT 1`,
      [tipo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Exportação FHIR não encontrada' });
    }
    res.json(result.rows[0].fhir_json);
  } catch (error) {
    console.error('Erro ao buscar exportação FHIR:', error);
    res.status(500).json({ erro: 'Erro ao buscar exportação' });
  }
});

router.get('/protocolos-fiocruz', autenticar, async (req, res) => {
  try {
    const { especialidade, termo } = req.query;
    const response = await axios.get(`${FHIR_CONFIG.FIOCRUZ_API}/protocolos`, {
      params: { especialidade, termo, limit: 20 },
      headers: process.env.FIOCRUZ_API_KEY ? { Authorization: `Bearer ${process.env.FIOCRUZ_API_KEY}` } : {}
    });

    if (response.data.length > 0) {
      await db.query(
        `INSERT INTO cache_protocolos (especialidade, dados, criado_em)
         VALUES ($1, $2, NOW())
         ON CONFLICT (especialidade) DO UPDATE SET dados = $2, criado_em = NOW()`,
        [especialidade, JSON.stringify(response.data)]
      );
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar protocolos Fiocruz:', error);
    const cached = await db.query(
      'SELECT dados FROM cache_protocolos WHERE especialidade = $1',
      [req.query.especialidade]
    );
    if (cached.rows.length > 0) {
      return res.json(JSON.parse(cached.rows[0].dados));
    }
    res.status(500).json({ erro: 'Erro ao buscar protocolos' });
  }
});

router.get('/pesquisas-redepics', autenticar, async (req, res) => {
  try {
    const { especialidade, termo } = req.query;
    const response = await axios.get(`${FHIR_CONFIG.REDEPICS_API}/pesquisas`, {
      params: { especialidade, termo, limit: 20 },
      headers: process.env.REDEPICS_API_KEY ? { Authorization: `Bearer ${process.env.REDEPICS_API_KEY}` } : {}
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar pesquisas RedePICS:', error);
    res.status(500).json({ erro: 'Erro ao buscar pesquisas' });
  }
});

router.get('/artigos-bireme', autenticar, async (req, res) => {
  try {
    const { especialidade, termo } = req.query;
    const response = await axios.get(`${FHIR_CONFIG.BIREME_API}/artigos`, {
      params: { especialidade, termo, limit: 20 },
      headers: process.env.BIREME_API_KEY ? { Authorization: `Bearer ${process.env.BIREME_API_KEY}` } : {}
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar artigos BIREME:', error);
    res.status(500).json({ erro: 'Erro ao buscar artigos' });
  }
});

router.post('/comparar-protocolos', autenticar, async (req, res) => {
  try {
    const { especialidade } = req.body;
    const [fiocruzRes, redepicsRes, biremeRes] = await Promise.all([
      axios.get(`${FHIR_CONFIG.FIOCRUZ_API}/protocolos`, { params: { especialidade } }).catch(() => ({ data: [] })),
      axios.get(`${FHIR_CONFIG.REDEPICS_API}/pesquisas`, { params: { especialidade } }).catch(() => ({ data: [] })),
      axios.get(`${FHIR_CONFIG.BIREME_API}/artigos`, { params: { especialidade } }).catch(() => ({ data: [] }))
    ]);

    res.json({
      especialidade,
      fiocruz: { quantidade: fiocruzRes.data.length, protocolos: fiocruzRes.data.slice(0, 5) },
      redepics: { quantidade: redepicsRes.data.length, pesquisas: redepicsRes.data.slice(0, 5) },
      bireme: { quantidade: biremeRes.data.length, artigos: biremeRes.data.slice(0, 5) },
      diferencas: identificarDiferencas(fiocruzRes.data, redepicsRes.data)
    });
  } catch (error) {
    console.error('Erro ao comparar protocolos:', error);
    res.status(500).json({ erro: 'Erro ao comparar protocolos' });
  }
});

async function atualizarProtocolosFiocruz() {
  try {
    console.log('🔄 Iniciando atualização de protocolos Fiocruz...');
    const especialidades = [
      'fitoterapia', 'ayurveda', 'mtc', 'yoga', 'massoterapia',
      'aromaterapia', 'fisioterapia', 'reiki', 'acupuntura'
    ];

    for (const esp of especialidades) {
      try {
        const response = await axios.get(`${FHIR_CONFIG.FIOCRUZ_API}/protocolos`, {
          params: { especialidade: esp, limit: 50 }
        });
        await db.query(
          `INSERT INTO cache_protocolos (especialidade, dados, criado_em)
           VALUES ($1, $2, NOW())
           ON CONFLICT (especialidade) DO UPDATE SET dados = $2, criado_em = NOW()`,
          [esp, JSON.stringify(response.data)]
        );
        console.log(`✓ Atualizado: ${esp}`);
      } catch (error) {
        console.error(`✗ Erro ao atualizar ${esp}:`, error.message);
      }
    }
    console.log('✓ Atualização concluída');
  } catch (error) {
    console.error('Erro na atualização automática:', error);
  }
}

function identificarDiferencas(protocolosFiocruz, pesquisasRedepics) {
  const diferencas = [];
  if (protocolosFiocruz.length > pesquisasRedepics.length) {
    diferencas.push('Fiocruz possui mais protocolos que RedePICS');
  }
  return diferencas;
}

module.exports = {
  router,
  atualizarProtocolosFiocruz
};
