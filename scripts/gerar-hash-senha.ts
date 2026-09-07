// Gera o hash de senha para colocar em ADMIN_PASSWORD_HASH no .env.
// Uso: npx tsx scripts/gerar-hash-senha.ts "minha-senha-aqui"
import { hashPassword } from "../src/lib/auth";

const senha = process.argv[2];

if (!senha) {
  console.error('Uso: npx tsx scripts/gerar-hash-senha.ts "minha-senha-aqui"');
  process.exit(1);
}

hashPassword(senha).then((hash) => {
  console.log("\nAdicione esta linha ao seu arquivo .env:\n");
  console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
});
