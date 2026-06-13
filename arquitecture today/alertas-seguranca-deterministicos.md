# Alertas de Segurança Determinísticos

## Objetivo

O mecanismo de alertas de segurança do Integrativo.App existe para sinalizar contraindicações graves, interações, sinais de alarme e divergências entre fontes públicas confiáveis. Ele funciona como apoio profissional e não substitui diagnóstico, prescrição, responsabilidade técnica, conselho profissional ou encaminhamento médico.

## Decisão Arquitetural

O sistema não usa IA decisória, modelo generativo, rede neural, rede bayesiana ou inferência probabilística para contraindicações graves.

A arquitetura adotada é um motor determinístico de regras IF/THEN, com:

- regras explícitas;
- fontes vinculadas;
- gravidade fixa;
- conduta conservadora;
- rastreabilidade por `regra_id`;
- ausência de linguagem de liberação clínica automática.

## Princípio de Segurança

Quando fontes divergem, prevalece a posição mais restritiva:

```txt
contraindicado > cautela > sem_mencao > permitido
```

Se uma fonte confiável aponta contraindicação e outra não menciona o risco, o sistema trata como divergência por omissão e mantém alerta.

## Fluxo

```mermaid
flowchart TD
  contextoClinico["Contexto: prática, produto, medicamentos, condições, alergias"] --> normalizacao["Normalização de termos"]
  normalizacao --> motorRegras["Motor IF/THEN determinístico"]
  regrasCriticas["Regras críticas com fontes"] --> motorRegras
  motorRegras --> comparadorFontes["Comparação de posições das fontes"]
  comparadorFontes --> classificador["Classificação de gravidade"]
  classificador --> alerta["Alerta rastreável"]
  alerta --> profissional["Revisão pelo profissional"]
```

## Componentes

- `backend/servicos/alertas-seguranca.js`: regras, normalização, comparação de fontes e geração de alertas.
- `backend/rotas/alertas-seguranca.js`: endpoints de consulta.
- `backend/server.js`: registro da rota `/api/alertas-seguranca`.
- `frontend/painel-prescricao.html`: consulta automática antes da emissão de prescrição/recomendação.
- `frontend/painel-bibliotecas.html`: consulta de alertas durante busca profissional nas bibliotecas.
- `frontend/bibliotecas-especialidades.html`: consulta pública de alertas durante navegação no mapa de bibliotecas.

## Proteção do Arquivo de Regras

As regras ficam exclusivamente no backend, fora do diretório `frontend`, portanto não são empacotadas como JavaScript público do navegador.

O navegador não recebe o arquivo de regras. Ele chama uma função JavaScript local que envia o contexto para a API e recebe apenas o resultado da avaliação.

```txt
Frontend JS -> /api/alertas-seguranca/verificar -> motor backend -> alerta resumido
```

O endpoint administrativo `/api/alertas-seguranca/regras` exige usuário autenticado com perfil `admin` ou `super_admin`. Ele não deve ser usado em páginas públicas.

Observação: isso protege contra acesso web comum. Quem tiver acesso administrativo ao servidor, ao repositório ou ao ambiente de build ainda poderá ver os arquivos. Para sigilo maior, manter o repositório privado e restringir acesso ao servidor.

## Endpoints

### `GET /api/alertas-seguranca`

Consulta simples por termo, prática, produto, condições, medicamentos e alergias.

### `POST /api/alertas-seguranca/verificar`

Consulta estruturada para formulários profissionais, prescrições e recomendações.

### `GET /api/alertas-seguranca/regras`

Lista regras cadastradas com gravidade e fontes, para auditoria. Restrito a `admin` e `super_admin`.

## Exemplo de Alerta

```json
{
  "regra_id": "FITOTERAPIA_ANTICOAGULANTE_001",
  "area": "Fitoterapia",
  "tipo": "interacao",
  "gravidade": "alta",
  "mensagem": "Possível aumento de risco de sangramento ou interação medicamentosa com fitoterápicos.",
  "conduta": "Não recomendar sem validação médica ou farmacêutica; checar medicação, dose, indicação e sinais de sangramento.",
  "fontes": [
    { "nome": "ANVISA", "posicao": "cautela" },
    { "nome": "WHO Monographs", "posicao": "cautela" },
    { "nome": "NCCIH", "posicao": "cautela" }
  ]
}
```

## Frase Padrão Sem Alerta

O sistema deve usar:

```txt
Nenhum alerta crítico encontrado nas regras cadastradas. Isso não significa liberação clínica automática.
```

O sistema não deve usar:

```txt
Está seguro.
```

## Manutenção

Novas regras devem ser adicionadas apenas quando houver fonte rastreável e texto de conduta conservadora. Alterações em gravidade ou conduta devem preservar o `regra_id` antigo em histórico documental ou criar novo identificador versionado.
