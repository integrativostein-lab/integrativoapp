# Status do plano de acao

Atualizado em: 2026-06-13

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
- Frontend alfa configurado para usar o backend espelho `integrativoappespelho`.
- Backend espelho `https://integrativoappespelho.onrender.com` online em `NODE_ENV=test` e `TEST_MODE=true`.
- Motor deterministico de alertas validado no espelho com `usa_ia:false`.
- Frontend alfa apontado para `https://integrativoappespelho.onrender.com/api`.
- Ultimo push para GitHub realizado no commit `053abf8`.

## Verificacoes finais em painel externo

- Confirmar no Render se as variaveis secretas de teleconsulta real estao preenchidas quando o LiveKit real for usado:
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
- Manter `integrativoappespelho` com branch `master`, root directory `backend`, build `npm install` e start `npm start`.
- Usar o backend principal apenas como fallback temporario se o espelho ficar indisponivel.
- Confirmar `CORS_ORIGINS=https://integrativoapp-alfa.vercel.app` no servico `integrativoappespelho`.
- Configurar banco alfa separado se os testes nao puderem usar o banco temporario atual.
- Confirmar URL publica atual do Vercel alfa.

## Testes finais recomendados

- Login remoto publicado.
- Teleconsulta com dois participantes reais.
- Fluxo profissional -> iniciar teleconsulta.
- Fluxo paciente -> entrar na sala.
- Cadastro, agendamento, painel terapeuta e painel paciente.

## Modulos futuros

- Gravacao real da teleconsulta.
- Transcricao/STT da teleconsulta.
- Resumo automatico de consulta.
- Armazenamento e expiracao real de gravacoes.
- Servidor BHServer para video/voz/processamento proprio.

## Proxima prioridade

1. Aguardar o deploy do frontend alfa com o endpoint `integrativoappespelho`.
2. Abrir a URL publica do frontend alfa e confirmar chamadas para `https://integrativoappespelho.onrender.com/api`.
3. Testar login, cadastro, biblioteca, prescricao e teleconsulta.
4. Validar LiveKit real quando as chaves finais estiverem no Render.
