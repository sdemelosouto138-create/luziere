/** Um pedido aprovado, no formato mínimo necessário para montar a lista de compras. */
export type PedidoParaCompra = {
  id: string;
  numero: number;
  itens: {
    quantidade: number;
    produto: {
      id: string;
      nome: string;
      sku: string | null;
      unidade: string;
      precoCusto: number;
      fornecedor: { id: string; nome: string } | null;
    };
  }[];
};

export type ItemDeCompra = {
  produtoId: string;
  nome: string;
  sku: string | null;
  unidade: string;
  quantidade: number;
  custoUnitario: number;
  /** Números dos pedidos que geraram essa necessidade. */
  pedidos: number[];
};

export type GrupoDeCompra = {
  fornecedorId: string | null;
  fornecedorNome: string;
  itens: ItemDeCompra[];
  custoEstimado: number;
};

const SEM_FORNECEDOR = "__sem_fornecedor__";

/**
 * Junta os itens de vários pedidos aprovados, somando a quantidade do mesmo
 * produto, e separa por fornecedor. É o que vira a lista de compra.
 */
export function agruparComprasPorFornecedor(pedidos: PedidoParaCompra[]): GrupoDeCompra[] {
  const grupos = new Map<string, GrupoDeCompra>();

  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      const fornecedor = item.produto.fornecedor;
      const chaveGrupo = fornecedor?.id ?? SEM_FORNECEDOR;

      let grupo = grupos.get(chaveGrupo);
      if (!grupo) {
        grupo = {
          fornecedorId: fornecedor?.id ?? null,
          fornecedorNome: fornecedor?.nome ?? "Sem fornecedor",
          itens: [],
          custoEstimado: 0,
        };
        grupos.set(chaveGrupo, grupo);
      }

      const existente = grupo.itens.find((i) => i.produtoId === item.produto.id);
      if (existente) {
        existente.quantidade += item.quantidade;
        if (!existente.pedidos.includes(pedido.numero)) existente.pedidos.push(pedido.numero);
      } else {
        grupo.itens.push({
          produtoId: item.produto.id,
          nome: item.produto.nome,
          sku: item.produto.sku,
          unidade: item.produto.unidade,
          quantidade: item.quantidade,
          custoUnitario: item.produto.precoCusto,
          pedidos: [pedido.numero],
        });
      }
    }
  }

  const lista = [...grupos.values()];
  for (const grupo of lista) {
    grupo.itens.sort((a, b) => a.nome.localeCompare(b.nome));
    grupo.itens.forEach((i) => i.pedidos.sort((a, b) => a - b));
    grupo.custoEstimado = grupo.itens.reduce((soma, i) => soma + i.quantidade * i.custoUnitario, 0);
  }

  // Fornecedores em ordem alfabética; "Sem fornecedor" por último.
  return lista.sort((a, b) => {
    if (a.fornecedorId === null) return 1;
    if (b.fornecedorId === null) return -1;
    return a.fornecedorNome.localeCompare(b.fornecedorNome);
  });
}
