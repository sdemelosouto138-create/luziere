-- Notas fiscais (e outros documentos) anexadas a um fornecedor.
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "numero" TEXT,
    "descricao" TEXT,
    "dataEmissao" TIMESTAMP(3),
    "valor" DECIMAL(65,30),
    "arquivoUrl" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- Excluir o fornecedor leva junto os documentos dele.
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_fornecedorId_fkey"
    FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "notas_fiscais_fornecedorId_idx" ON "notas_fiscais"("fornecedorId");
