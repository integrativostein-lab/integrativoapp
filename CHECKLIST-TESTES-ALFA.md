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

- Consultar o runbook `arquitecture today/teleconsulta-livekit.md` se houver erro de token, CORS ou permissao de camera/microfone.
- Abrir `/reuniao.html?sala=teleconsulta-alfa` como profissional.
- Permitir camera e microfone no navegador.
- Abrir a mesma sala em outro navegador/dispositivo como paciente.
- Confirmar audio e video nos dois lados.
- Testar mutar microfone.
- Testar desligar camera.
- Testar compartilhamento de tela.
- Sair da sala e confirmar que a conexao encerra.
- Confirmar que a gravacao nao foi tratada como persistente: o botao atual altera apenas o estado visual da pagina.
- Confirmar que o chat nao foi tratado como recurso em tempo real: a mensagem atual fica somente no DOM local da pagina.

## 4. Fluxos essenciais

- Cadastro de paciente.
- Cadastro/login de profissional.
- Busca de profissionais.
- Criacao de agendamento.
- Visualizacao do agendamento no painel.
- Inicio de teleconsulta a partir do painel.
- Busca em `painel-bibliotecas.html` por `ginkgo varfarina` e conferir alerta deterministico.
- Em `painel-prescricao.html`, inserir item com risco conhecido e confirmar que aparece alerta antes da emissao.

## 5. Recursos futuros fora deste ciclo

- Gravacao real da teleconsulta.
- Transcricao/STT da teleconsulta.
- Chat em tempo real persistente da teleconsulta.
- Atualizacao automatica de status do agendamento pela entrada/saida da sala.
- Banco alfa separado dedicado, se os testes exigirem isolamento completo de dados.
