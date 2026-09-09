-- Cadastro de fornecedores.
-- Os nomes de fornecedor digitados livremente nos produtos viram registros
-- na tabela "fornecedores" e os produtos passam a apontar para eles (fornecedorId).

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "contato" TEXT,
    "site" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- AlterTable: nova coluna de vínculo (a coluna de texto antiga é removida no fim)
ALTER TABLE "produtos" ADD COLUMN "fornecedorId" TEXT;

-- Migração de dados: um fornecedor para cada nome distinto já usado nos produtos
INSERT INTO "fornecedores" ("id", "nome", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, trim("fornecedor"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT trim("fornecedor") AS "fornecedor"
    FROM "produtos"
    WHERE "fornecedor" IS NOT NULL AND trim("fornecedor") <> ''
) AS nomes;

UPDATE "produtos" p
SET "fornecedorId" = f."id"
FROM "fornecedores" f
WHERE p."fornecedor" IS NOT NULL AND trim(p."fornecedor") = f."nome";

-- Remove a coluna de texto antiga
ALTER TABLE "produtos" DROP COLUMN "fornecedor";

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
