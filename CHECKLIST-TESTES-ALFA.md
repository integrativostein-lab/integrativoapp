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

- Confirmar que o backend alfa possui `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET`.
- Confirmar que o frontend alfa foi aberto depois do login e possui token `integra_token`.
- Confirmar no DevTools que `POST https://integrativoappespelho.onrender.com/api/reunioes/livekit-token` retorna `200`.
- Se retornar `401`, refazer login no frontend alfa e confirmar `JWT_SECRET` consistente no backend.
- Se retornar `500 LiveKit não configurado no ambiente.`, revisar variaveis LiveKit no Render.
- Se houver erro de CORS, confirmar `CORS_ORIGINS=https://integrativoapp-alfa.vercel.app`.
- Abrir `/reuniao.html?sala=teleconsulta-alfa` como profissional.
- Permitir camera e microfone no navegador.
- Abrir a mesma sala em outro navegador/dispositivo como paciente.
- Confirmar audio e video nos dois lados.
- Testar mutar microfone.
- Testar desligar camera.
- Testar compartilhamento de tela.
- Sair da sala e confirmar que a conexao encerra.

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
- Banco alfa separado dedicado, se os testes exigirem isolamento completo de dados.
