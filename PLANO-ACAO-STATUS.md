# Status do plano de acao

Atualizado em: 2026-06-12

## Feito automaticamente

- Ambiente local alfa documentado e testado.
- Backend local de teste em `http://localhost:3001`.
- Frontend local em `http://127.0.0.1:8000`.
- Login demo local:
  - `profissional@demo.com` / `demo123`
  - `paciente@demo.com` / `demo123`
- LiveKit integrado ao backend pela rota `POST /api/reunioes/livekit-token`.
- Tela `frontend/reuniao.html` conectada ao SDK WebRTC do LiveKit.
- Variaveis LiveKit previstas em `.env.example` e `render.yaml`.
- Arquivos sensiveis `.env` e `.env.teste` protegidos fora do Git.
- Frontend alfa configurado para usar temporariamente o backend existente enquanto `integra-backend-alfa` nao existir.
- Ultimo push para GitHub realizado no commit `7eeff69`.

## Falta fazer manualmente em painel externo

- No Render, adicionar as variaveis secretas no servico backend existente:
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
- No Render, fazer `Manual Deploy -> Clear build cache & deploy`.
- Criar o servico remoto `integra-backend-alfa`, se o ambiente alfa separado ainda for necessario.
- Criar/configurar banco alfa separado e preencher `TESTE_DATABASE_URL`.
- Confirmar URL publica atual do Vercel ou criar o projeto `integrativoapp-alfa`.
- Se usar frontend alfa com `integra-backend-ynrd`, incluir a URL do frontend alfa em `CORS_ORIGINS`.

## Falta testar

- Login remoto publicado.
- Teleconsulta com dois participantes reais.
- Fluxo profissional -> iniciar teleconsulta.
- Fluxo paciente -> entrar na sala.
- Cadastro, agendamento, painel terapeuta e painel paciente.

## Ainda nao implementado

- Gravacao real da teleconsulta.
- Transcricao/STT da teleconsulta.
- Resumo automatico de consulta.
- Armazenamento e expiracao real de gravacoes.
- Servidor BHServer para video/voz/processamento proprio.

## Proxima prioridade

1. Configurar variaveis LiveKit no Render.
2. Incluir a URL do frontend alfa em `CORS_ORIGINS`.
3. Fazer deploy limpo no Render.
4. Abrir a URL publica do frontend e testar `/reuniao.html?sala=teleconsulta-alfa`.
5. Criar ambiente alfa remoto separado antes de convidar testadores.
