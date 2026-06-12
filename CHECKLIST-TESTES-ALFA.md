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
- Enquanto `integra-backend-alfa` nao existir, a API remota temporaria e `https://integra-backend-ynrd.onrender.com/api`.
- Depois que `integra-backend-alfa` existir, trocar `frontend/js/config.js` para `https://integra-backend-alfa.onrender.com/api`.

## 3. Teleconsulta LiveKit

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

## 5. Pendencias conhecidas

- Gravacao real ainda nao implementada.
- Transcricao/STT ainda nao implementada.
- Banco alfa separado ainda precisa ser configurado.
- Backend alfa remoto separado ainda precisa ser criado se os testes nao puderem usar o backend existente.
