# Checklist de testes alfa

Use este roteiro depois de configurar as variaveis no Render e fazer deploy limpo.

## 1. Acesso basico

- Abrir a URL do frontend alfa.
- Entrar com usuario profissional de teste.
- Confirmar que o painel do terapeuta carrega.
- Sair e entrar com usuario paciente de teste.
- Confirmar que o painel do paciente carrega.

## 2. API e ambiente

- Confirmar que o frontend chama a API correta.
- A API alfa padrao e `https://integrativoappespelho.onrender.com/api`.
- Usar `https://integra-backend-ynrd.onrender.com/api` apenas como fallback temporario de contingencia.
- Confirmar que `https://integrativoappespelho.onrender.com/` responde `200`.
- Confirmar que `https://integrativoappespelho.onrender.com/api/alertas-seguranca?termo=ginkgo%20varfarina` retorna:
  - `usa_ia:false`
  - `total_alertas` maior que `0`
  - regra `FITOTERAPIA_ANTICOAGULANTE_001`
- Confirmar que `https://integrativoappespelho.onrender.com/api/alertas-seguranca/regras` retorna `401` sem token, pois as regras completas nao devem ficar publicas.

## 3. Teleconsulta LiveKit

- Abrir `/reuniao.html?sala=teleconsulta-alfa` como profissional.
- Permitir camera e microfone no navegador.
- Abrir a mesma sala em outro navegador/dispositivo como paciente.
- Confirmar audio e video nos dois lados.
- Testar mutar microfone.
- Testar desligar camera.
- Testar compartilhamento de tela.
- Sair da sala e confirmar que a conexao encerra.
- Conferir o runbook `arquitecture today/teleconsulta-livekit.md` antes de tratar gravacao, transcricao ou chat persistente como recurso disponivel.

## 4. Fluxos essenciais

- Cadastro de paciente.
- Cadastro/login de profissional.
- Ao abrir um painel profissional, confirmar modal de arquivamento obrigatorio, executar snapshot e verificar fechamento do modal.
- Busca de profissionais.
- Criacao de agendamento.
- Visualizacao do agendamento no painel.
- Inicio de teleconsulta a partir do painel.
- Busca em `painel-bibliotecas.html` por `ginkgo varfarina` e conferir alerta deterministico.
- Em `painel-prescricao.html`, inserir item com risco conhecido e confirmar que aparece alerta antes da emissao.
- Consultar `GET /api/arquivo-profissional/status` com token profissional e conferir `ultimo_arquivo`.

## 5. Recursos futuros fora deste ciclo

- Gravacao real da teleconsulta.
- Transcricao/STT da teleconsulta.
- Persistencia de chat da teleconsulta.
- Politica formal de retencao/exportacao do arquivo profissional.
- Banco alfa separado dedicado, se os testes exigirem isolamento completo de dados.
