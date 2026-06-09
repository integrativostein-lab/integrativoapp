/**
 * ============================================
 * INTEGRAÇÃO FHIR BRASIL + BIBLIOTECAS CIENTÍFICAS
 * ============================================
 * 
 * Este arquivo implementa:
 * 1. Padrão FHIR Brasil (R4)
 * 2. Integração com HAPI FHIR BR
 * 3. Integração com Fiocruz (ARCA)
 * 4. Integração com RedePICS Brasil
 * 5. Integração com BIREME/OPAS
 * 
 * Para usar em backend/rotas/fhir.js
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');

// ============================================
// CONFIGURAÇÕES
// ============================================

const HAPI_FHIR_BR_URL = 'https://hapi.fhir.org.br/fhir';
const FIOCRUZ_ARCA_API = 'https://arca.fiocruz.br/api';
const REDEPICS_API = 'https://redepicsbrasil.org.br/api';
const BIREME_API = 'https://www.bireme.org.br/api';

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================

const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido' });
  }
};

// ============================================
// 1. EXPORTAR DADOS EM FORMATO FHIR
// ============================================

/**
 * POST /api/fhir/export-patient
 * Exporta dados do paciente em formato FHIR Patient
 */
router.post('/export-patient', autenticar, async (req, res) => {
  try {
    const { pacienteId } = req.body;

    // Buscar dados do paciente
    const result = await db.query(
      'SELECT id, nome, email, data_nascimento, genero, cpf FROM usuarios WHERE id = $1 AND tipo = $2',
      [pacienteId, 'paciente']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    const paciente = result.rows[0];

    // Construir recurso FHIR Patient
    const fhirPatient = {
      resourceType: 'Patient',
      id: paciente.id,
      meta: {
        profile: ['http://www.saude.gov.br/fhir/r4/StructureDefinition/BRPatient']
      },
      identifier: [
        {
          use: 'official',
          system: 'http://www.saude.gov.br/fhir/r4/NamingSystem/CPF',
          value: paciente.cpf
        }
      ],
      name: [
        {
          use: 'official',
          text: paciente.nome
        }
      ],
      telecom: [
        {
          system: 'email',
          value: paciente.email
        }
      ],
      birthDate: paciente.data_nascimento,
      gender: paciente.genero || 'unknown'
    };

    res.json(fhirPatient);
  } catch (error) {
    console.error('Erro ao exportar paciente FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

/**
 * POST /api/fhir/export-appointment
 * Exporta dados do agendamento em formato FHIR Appointment
 */
router.post('/export-appointment', autenticar, async (req, res) => {
  try {
    const { agendamentoId } = req.body;

    const result = await db.query(
      `SELECT a.*, p.nome as prof_nome, pac.nome as pac_nome 
       FROM agendamentos a
       JOIN usuarios p ON a.profissional_id = p.id
       JOIN usuarios pac ON a.paciente_id = pac.id
       WHERE a.id = $1`,
      [agendamentoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }

    const agendamento = result.rows[0];

    const fhirAppointment = {
      resourceType: 'Appointment',
      id: agendamento.id,
      meta: {
        profile: ['http://www.saude.gov.br/fhir/r4/StructureDefinition/BRAppointment']
      },
      status: agendamento.status || 'proposed',
      serviceType: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/service-type',
              code: agendamento.especialidade
            }
          ]
        }
      ],
      participant: [
        {
          actor: {
            reference: `Practitioner/${agendamento.profissional_id}`,
            display: agendamento.prof_nome
          },
          status: 'accepted'
        },
        {
          actor: {
            reference: `Patient/${agendamento.paciente_id}`,
            display: agendamento.pac_nome
          },
          status: 'accepted'
        }
      ],
      start: agendamento.data_hora,
      end: new Date(new Date(agendamento.data_hora).getTime() + 60 * 60000).toISOString()
    };

    res.json(fhirAppointment);
  } catch (error) {
    console.error('Erro ao exportar agendamento FHIR:', error);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

// ============================================
// 2. BUSCAR PROTOCOLOS FIOCRUZ
// ============================================

/**
 * GET /api/fhir/protocolos-fiocruz
 * Busca protocolos da Fiocruz por especialidade
 */
router.get('/protocolos-fiocruz', autenticar, async (req, res) => {
  try {
    const { especialidade, termo } = req.query;

    // Buscar na API da Fiocruz
    const response = await axios.get(`${FIOCRUZ_ARCA_API}/protocolos`, {
      params: {
        especialidade,
        termo,
        limit: 20
      }
    });

    // Armazenar em cache local
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
    
    // Tentar retornar do cache
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

// ============================================
// 3. BUSCAR PESQUISAS REDEPICS BRASIL
// ============================================

/**
 * GET /api/fhir/pesquisas-redepics
 * Busca pesquisas da RedePICS Brasil por especialidade
 */
router.get('/pesquisas-redepics', autenticar, async (req, res) => {
  try {
    const { especialidade, termo } = req.query;

    const response = await axios.get(`${REDEPICS_API}/pesquisas`, {
      params: {
        especialidade,
        termo,
        limit: 20
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar pesquisas RedePICS:', error);
    res.status(500).json({ erro: 'Erro ao buscar pesquisas' });
  }
});

// ============================================
// 4. BUSCAR ARTIGOS BIREME/OPAS
// ============================================

/**
 * GET /api/fhir/artigos-bireme
 * Busca artigos da BIREME/OPAS por especialidade
 */
router.get('/artigos-bireme', autenticar, async (req, res) => {
  try {
    const { especialidade, termo } = req.query;

    const response = await axios.get(`${BIREME_API}/artigos`, {
      params: {
        especialidade,
        termo,
        limit: 20
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar artigos BIREME:', error);
    res.status(500).json({ erro: 'Erro ao buscar artigos' });
  }
});

// ============================================
// 5. COMPARAR PROTOCOLOS
// ============================================

/**
 * POST /api/fhir/comparar-protocolos
 * Compara protocolos de diferentes fontes
 */
router.post('/comparar-protocolos', autenticar, async (req, res) => {
  try {
    const { especialidade } = req.body;

    const [fiocruzRes, redepicsRes, biremeRes] = await Promise.all([
      axios.get(`${FIOCRUZ_ARCA_API}/protocolos`, { params: { especialidade } }).catch(() => ({ data: [] })),
      axios.get(`${REDEPICS_API}/pesquisas`, { params: { especialidade } }).catch(() => ({ data: [] })),
      axios.get(`${BIREME_API}/artigos`, { params: { especialidade } }).catch(() => ({ data: [] }))
    ]);

    const comparacao = {
      especialidade,
      fiocruz: {
        quantidade: fiocruzRes.data.length,
        protocolos: fiocruzRes.data.slice(0, 5)
      },
      redepics: {
        quantidade: redepicsRes.data.length,
        pesquisas: redepicsRes.data.slice(0, 5)
      },
      bireme: {
        quantidade: biremeRes.data.length,
        artigos: biremeRes.data.slice(0, 5)
      },
      diferencas: identificarDiferencas(fiocruzRes.data, redepicsRes.data)
    };

    res.json(comparacao);
  } catch (error) {
    console.error('Erro ao comparar protocolos:', error);
    res.status(500).json({ erro: 'Erro ao comparar protocolos' });
  }
});

// ============================================
// 6. ATUALIZAÇÃO AUTOMÁTICA (CRON JOB)
// ============================================

/**
 * Função para executar atualização automática
 * Deve ser chamada por um job agendado (ex: node-cron)
 */
async function atualizarProtocolosFiocruz() {
  try {
    console.log('🔄 Iniciando atualização de protocolos Fiocruz...');

    const especialidades = [
      'fitoterapia', 'ayurveda', 'mtc', 'yoga', 'massoterapia',
      'aromaterapia', 'fisioterapia', 'reiki', 'acupuntura'
    ];

    for (const esp of especialidades) {
      try {
        const response = await axios.get(`${FIOCRUZ_ARCA_API}/protocolos`, {
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

// ============================================
// 7. FUNÇÕES AUXILIARES
// ============================================

function identificarDiferencas(protocolosFiocruz, pesquisasRedepics) {
  // Lógica para identificar diferenças entre protocolos
  const diferencas = [];

  if (protocolosFiocruz.length > pesquisasRedepics.length) {
    diferencas.push('Fiocruz possui mais protocolos que RedePICS');
  }

  return diferencas;
}

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  router,
  atualizarProtocolosFiocruz
};
