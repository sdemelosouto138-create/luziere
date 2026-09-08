// Configuração do Prisma CLI (migrations, db push, studio, seed).
// A aplicação em si NÃO lê este arquivo — ele é usado apenas pelo CLI do Prisma.
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrações precisam de uma conexão DIRETA com o Postgres (advisory locks não
// funcionam bem através do pooler/PgBouncer do Neon). A aplicação continua usando
// a DATABASE_URL (pooler) em runtime. Se DIRECT_URL não estiver definida, deriva
// a URL direta removendo o sufixo "-pooler" do host (convenção do Neon).
const urlMigracoes =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL?.replace("-pooler.", ".");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: urlMigracoes,
  },
});
