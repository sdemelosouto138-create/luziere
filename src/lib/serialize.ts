import type {
  ProdutoModel,
  ImagemProdutoModel,
  CategoriaModel,
  PedidoModel,
  ItemPedidoModel,
  ClienteModel,
} from "@/generated/prisma/models";

type ProdutoComRelacoes = ProdutoModel & {
  categoria?: CategoriaModel;
  imagens?: ImagemProdutoModel[];
};

/** Converte os campos Decimal do Prisma para number, para uso seguro no front-end. */
export function serializarProduto(produto: ProdutoComRelacoes) {
  return {
    ...produto,
    precoCusto: Number(produto.precoCusto),
    precoVenda: Number(produto.precoVenda),
  };
}

type ItemComProduto = ItemPedidoModel & { produto?: ProdutoModel };
type PedidoComRelacoes = PedidoModel & {
  cliente?: ClienteModel;
  itens?: ItemComProduto[];
};

/** Converte os campos Decimal de um pedido (e seus itens) para number. */
export function serializarPedido(pedido: PedidoComRelacoes) {
  return {
    ...pedido,
    desconto: Number(pedido.desconto),
    frete: Number(pedido.frete),
    itens: pedido.itens?.map((item) => ({
      ...item,
      precoUnitario: Number(item.precoUnitario),
      subtotal: Number(item.subtotal),
      produto: item.produto ? serializarProduto(item.produto) : undefined,
    })),
  };
}
