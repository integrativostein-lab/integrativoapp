/**
 * Garante email e conta do criador.
 * Padrão: integrativostein@gmail.com
 *
 * Uso completo (cria/atualiza senha):
 *   CRIADOR_SENHA=*** node backend/garantir-criador.js
 *
 * Só registrar email oficial (sem alterar senha):
 *   node backend/garantir-criador.js --apenas-email
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');
const {
  EMAIL_CRIADOR_PADRAO,
  emailCriadorFromEnv,
  salvarEmailCriadorConfig,
  obterEmailCriador
} = require('./utils/acesso-roles');

async function main() {
  const apenasEmail = process.argv.includes('--apenas-email');
  const email = emailCriadorFromEnv() || EMAIL_CRIADOR_PADRAO;
  const senha = String(process.env.CRIADOR_SENHA || '').trim();
  const nome = String(process.env.CRIADOR_NOME || 'Mauricio Stein').trim();

  await salvarEmailCriadorConfig(db, email);
  console.log('Email oficial do criador registrado:', email);

  if (apenasEmail) return;

  if (!senha || senha.length < 8) {
    const existente = await db.query('SELECT id, tipo FROM usuarios WHERE email = $1', [email]);
    if (existente.rows.length) {
      await db.query(
        `UPDATE usuarios SET tipo = 'super_admin', plano = 'enterprise', ativo = 1, nome = COALESCE(NULLIF(nome, ''), $2) WHERE id = $1`,
        [existente.rows[0].id, nome]
      );
      console.log('Conta existente promovida a super_admin (senha não alterada).');
      return;
    }
    console.log('Defina CRIADOR_SENHA (mín. 8 caracteres) para criar a conta de login.');
    return;
  }

  const hash = await bcrypt.hash(senha, 12);
  const existente = await db.query('SELECT id, tipo FROM usuarios WHERE email = $1', [email]);

  if (existente.rows.length) {
    const id = existente.rows[0].id;
    await db.query(
      `UPDATE usuarios
       SET nome = $2, senha = $3, tipo = 'super_admin', plano = 'enterprise', ativo = 1
       WHERE id = $1`,
      [id, nome, hash]
    );
    console.log('Conta do criador atualizada:', email);
    return;
  }

  await db.query(
    `INSERT INTO usuarios (nome, email, senha, tipo, plano, lgpd_consentimento, lgpd_data_consentimento, ativo)
     VALUES ($1, $2, $3, 'super_admin', 'enterprise', 1, NOW(), 1)`,
    [nome, email, hash]
  );
  console.log('Conta do criador criada:', email);

  const confirmado = await obterEmailCriador(db);
  console.log('Email ativo no sistema:', confirmado);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
