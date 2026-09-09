-- Guarda a lista de ambientes no próprio pedido, para que um ambiente criado
-- continue existindo mesmo antes de receber itens.
ALTER TABLE "pedidos" ADD COLUMN "ambientes" TEXT[] NOT NULL DEFAULT '{}';

-- Pedidos existentes herdam os ambientes que já aparecem nos seus itens.
UPDATE "pedidos" p
SET "ambientes" = COALESCE(sub.nomes, '{}')
FROM (
    SELECT i."pedidoId", array_agg(DISTINCT i."ambiente") AS nomes
    FROM "itens_pedido" i
    WHERE i."ambiente" IS NOT NULL AND i."ambiente" <> ''
    GROUP BY i."pedidoId"
) AS sub
WHERE sub."pedidoId" = p."id";
