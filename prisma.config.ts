// Configuração do Prisma CLI (migrations, db push, studio, seed).
// A aplicação em si NÃO lê este arquivo — ele é usado apenas pelo CLI do Prisma.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
