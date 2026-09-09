-- Permite separar os itens de um pedido por ambiente (ex.: Quarto, Sacada).
-- Itens já existentes ficam sem ambiente e continuam listados normalmente.
ALTER TABLE "itens_pedido" ADD COLUMN "ambiente" TEXT;
ALTER TABLE "itens_pedido" ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;
