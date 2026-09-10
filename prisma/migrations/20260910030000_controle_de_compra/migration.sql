-- Marca se a compra com os fornecedores já foi feita para aquele pedido.
-- É independente do status de venda: um pedido aprovado pode estar comprado ou não.
ALTER TABLE "pedidos" ADD COLUMN "compraRealizada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pedidos" ADD COLUMN "compraRealizadaEm" TIMESTAMP(3);
