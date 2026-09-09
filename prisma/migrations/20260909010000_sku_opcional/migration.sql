-- O código/SKU passa a ser opcional: a loja não usa esse controle no momento.
-- O índice único continua (o Postgres permite vários valores nulos), então
-- quem quiser voltar a usar SKU segue protegido contra duplicidade.
ALTER TABLE "produtos" ALTER COLUMN "sku" DROP NOT NULL;
