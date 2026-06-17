# FHIR Brasil e RNDS

## Objetivo

A integração FHIR do Integrativo.App converte dados internos de pacientes, profissionais, organizações, agendamentos, atendimentos e prescrições para recursos FHIR R4 com perfis HL7 Brasil/RNDS. Ela existe para interoperabilidade, auditoria técnica e preparo de integrações futuras, sem substituir validação clínica ou homologação formal com a RNDS.

## Componentes

- `backend/config/fhir.js`: URLs externas, `FHIR_BASE_URL`, chaveamento `RNDS_ENABLED` e URIs de perfis, naming systems e code systems brasileiros.
- `backend/servicos/fhir-brasil.js`: mapeadores entre registros internos e recursos FHIR, criação de `Bundle`, importação parcial de `Patient`, `CapabilityStatement` e persistência em `fhir_exports`.
- `backend/rotas/fhir.js`: endpoints `/api/fhir/*`, consultas ao banco, exportação, importação, cache de protocolos e comparação de fontes científicas.
- `backend/rotas/entidades.js`: atalhos autenticados para gerar `Organization` e `Practitioner`.
- `backend/server.js`: registra `/api/fhir`, `/api/entidades` e agenda a atualização diária de protocolos Fiocruz às 2h.
- `migracao-v2.1.sql`: cria `fhir_exports`, `cache_protocolos` e `referencias_protocolos`.
- `backend/rotas/arquivo-profissional.js`: inclui `fhir_exports` no snapshot central do profissional.

## Recursos Mapeados

| Recurso FHIR | Origem interna | Observações |
| --- | --- | --- |
| `Patient` | `usuarios` com `tipo = 'paciente'` | CPF, CNS, nome, telecom, gênero, nascimento e endereço. |
| `Practitioner` | `usuarios` com `tipo IN ('profissional', 'admin')` | CPF, CNS profissional, CNES, conselho, CBO, telecom e endereço. |
| `Organization` | `usuarios` | CNES, CNPJ, nome e endereço do estabelecimento/usuário. |
| `Appointment` | `agendamentos` | Status interno convertido para status FHIR; modalidade online vira teleconsulta. |
| `Encounter` | `agendamentos` | Usa classe `VR` para teleconsulta e `AMB` para atendimento presencial/ambulatorial. |
| `MedicationRequest` | `prescricoes` | Usa o primeiro item como medicamento principal e lista itens em `dosageInstruction`. |
| `Bundle` | `agendamentos` + paciente/profissional relacionados | Bundle `document` com Patient, Practitioner, Organization quando aplicável, Encounter e Appointment. |

Os mapeadores também expõem helpers para `Observation` e `Condition`, mas as rotas atuais não possuem endpoints públicos dedicados para esses dois recursos.

## Endpoints

### Metadados

```txt
GET /api/fhir/metadata
```

Retorna um `CapabilityStatement` FHIR R4 com os perfis suportados. Não exige JWT no código atual.

### Exportações autenticadas

Todas as rotas abaixo exigem `Authorization: Bearer <jwt>` e persistem uma cópia em `fhir_exports` quando a tabela está disponível. Se a persistência falhar, a API registra aviso no log e ainda retorna o recurso gerado.

```txt
POST /api/fhir/export-patient
POST /api/fhir/export-practitioner
POST /api/fhir/export-organization
POST /api/fhir/export-appointment
POST /api/fhir/export-encounter
POST /api/fhir/export-medication-request
POST /api/fhir/export-bundle
GET  /api/fhir/exports/:tipo/:id
```

Campos aceitos:

- `export-patient`: `pacienteId` ou `patientId`.
- `export-practitioner`: `profissionalId` ou `practitionerId`.
- `export-organization`: `usuarioId`; quando ausente, usa `req.usuario.id`.
- `export-appointment`: `agendamentoId` ou `appointmentId`.
- `export-encounter`: `agendamentoId` ou `encounterId`.
- `export-medication-request`: `prescricaoId` ou `medicationRequestId`.
- `export-bundle`: `agendamentoId`.

Exemplo:

```bash
curl -X POST http://localhost:3000/api/fhir/export-bundle \
  -H "Authorization: Bearer seu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{"agendamentoId": 123}'
```

### Importação parcial autenticada

```txt
POST /api/fhir/import-patient
```

Exige `Authorization: Bearer <jwt>`. Recebe `{ "resource": { "resourceType": "Patient", ... } }`, valida apenas que o recurso é `Patient` e que contém nome mapeável, e retorna os dados convertidos para o modelo interno. O endpoint não cria usuário no banco.

### Protocolos e fontes científicas

```txt
GET  /api/fhir/protocolos-fiocruz?especialidade=fitoterapia&termo=sono
GET  /api/fhir/pesquisas-redepics?especialidade=fitoterapia&termo=sono
GET  /api/fhir/artigos-bireme?especialidade=fitoterapia&termo=sono
POST /api/fhir/comparar-protocolos
```

- Todas essas rotas exigem `Authorization: Bearer <jwt>`.
- Fiocruz usa `cache_protocolos` quando a chamada externa falha e já existe cache para a especialidade.
- RedePICS e BIREME retornam erro 500 quando a fonte externa falha; não há fallback local nessas rotas.
- `comparar-protocolos` consulta as três fontes em paralelo, tolera falha individual retornando lista vazia e hoje só compara quantidade Fiocruz vs. RedePICS.

## Configuração

```env
FHIR_BASE_URL=http://localhost:3000/api/fhir
FHIR_HAPI_URL=https://hapi.fhir.org.br/fhir
FIOCRUZ_API_URL=https://arca.fiocruz.br/api
REDEPICS_API_URL=https://redepicsbrasil.org.br/api
BIREME_API_URL=https://www.bireme.org.br/api
RNDS_ENABLED=false
RNDS_AUTH_URL=https://ehr-services.saude.gov.br/api/auth/token
FIOCRUZ_API_KEY=
REDEPICS_API_KEY=
BIREME_API_KEY=
```

`FHIR_HAPI_URL`, `RNDS_ENABLED` e `RNDS_AUTH_URL` ficam configurados, mas o código atual não envia recursos para HAPI/RNDS. As exportações retornam JSON local e salvam auditoria em `fhir_exports`.

## Persistência e Auditoria

`fhir_exports` grava:

- `usuario_id`: usuário autenticado que solicitou a exportação;
- `tipo_recurso`: tipo FHIR exportado;
- `recurso_id`: id interno do recurso;
- `fhir_json`: JSON completo retornado pela API;
- `url_fhir`: URL lógica montada com `FHIR_BASE_URL`;
- timestamps de criação/atualização.

`GET /api/fhir/exports/:tipo/:id` retorna a exportação mais recente daquele tipo/id. Não filtra por `usuario_id`, então deve permanecer atrás de JWT e ser usado com cuidado em telas administrativas ou profissionais.

## Operação

- Rodar `migracao-v2.1.sql` antes de usar exportações, cache ou referências de protocolos.
- Conferir `DATABASE_URL`, `JWT_SECRET` e URLs externas antes de subir o backend.
- O cron de Fiocruz roda às 2h e atualiza as especialidades fixas: `fitoterapia`, `ayurveda`, `mtc`, `yoga`, `massoterapia`, `aromaterapia`, `fisioterapia`, `reiki` e `acupuntura`.
- Em ambiente local, validar primeiro `GET /api/fhir/metadata`; depois testar uma exportação autenticada com registros reais do banco.

## Troubleshooting

**`Exportação FHIR não encontrada`**

O recurso ainda não foi exportado ou `fhir_exports` não existe/foi esvaziada. Gere a exportação novamente e verifique a migração.

**Exportação retorna JSON, mas nada aparece em `fhir_exports`**

A rota tolera falha de persistência. Verifique logs com prefixo `[fhir] Não foi possível salvar em fhir_exports`, permissões do banco e tipos de `recurso_id`.

**Protocolos Fiocruz retornam dados antigos**

A rota usa cache quando a fonte externa falha. Confirme `FIOCRUZ_API_URL`, `FIOCRUZ_API_KEY`, conectividade de rede e o campo `criado_em` em `cache_protocolos`.

**RedePICS/BIREME retornam 500**

Essas rotas não têm cache local. Confirme `REDEPICS_API_URL`, `BIREME_API_URL` e tokens quando exigidos.

## Limites Atuais

- Não há envio real para RNDS/HAPI apesar das variáveis de configuração.
- Não há validação estrutural FHIR via validador externo.
- `import-patient` apenas mapeia dados; não persiste paciente.
- `MedicationRequest` usa o primeiro item da prescrição como medicamento principal.
- `GET /api/fhir/metadata` está público no código atual.
