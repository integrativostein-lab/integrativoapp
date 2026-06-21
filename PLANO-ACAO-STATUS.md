# Status do plano de acao

Atualizado em: 2026-06-20

## Feito automaticamente

- Ambiente local alfa documentado e testado.
- Backend local de teste em `http://localhost:3001`.
- Frontend local em `http://127.0.0.1:8000`.
- Login demo local:
  - `profissional@demo.com` / `demo123`
  - `paciente@demo.com` / `demo123`
- LiveKit integrado ao backend pela rota `POST /api/reunioes/livekit-token`.
- Tela `frontend/reuniao.html` conectada ao SDK WebRTC do LiveKit.
- Fluxo paciente: `painel-paciente.html` abre teleconsulta na mesma sala `teleconsulta-{id}`.
- Agendamento demo: valores padrão criados automaticamente (`utils/profissional-valores.js`).
- Bug corrigido em `POST /api/profissionais/valores` (UPDATE/INSERT SQL).
- Menu publico unificado (`nav-publico.js`) + paginas profissionais/bibliotecas alinhadas.
- Catalogo sincronizado: 88 bibliotecas, 70 especialidades, 76 por pratica + 12 transversais.
- Auditoria LGPD: gravacao JSONL testada localmente; PostgreSQL opcional via `DATABASE_URL`.
- Script `npm run demo:garantir` para recriar contas/valores demo no banco.

## Verificacoes finais em painel externo

- Confirmar no Render se as variaveis secretas de teleconsulta real estao preenchidas:
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
- Rodar no ambiente com banco: `cd backend && npm run demo:garantir`
- Confirmar `CORS_ORIGINS` no servico espelho/producao.
- Validar teleconsulta com 2 navegadores (terapeuta + paciente) apos chaves LiveKit.

## Testes finais recomendados

- Login remoto publicado.
- Busca → agendar → painel paciente → entrar na teleconsulta.
- Fluxo profissional → iniciar teleconsulta no painel terapeuta.
- Cadastro profissional com valores automaticos.
- Biblioteca, prescricao e consentimentos LGPD.

## Modulos futuros

- Gravacao real da teleconsulta.
- Transcricao/STT da teleconsulta.
- Integracoes reais PIX/WhatsApp/NF (hoje mock/simulado na alfa).

## Proxima prioridade

1. Ajustar conteudo visual de `profissionais.html` e `bibliotecas-especialidades.html` (em definicao).
2. Configurar LiveKit no Render e testar audio/video real.
3. Rodar `npm run demo:garantir` no banco do espelho antes de demonstracoes.
