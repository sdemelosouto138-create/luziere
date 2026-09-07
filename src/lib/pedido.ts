type ItemParaCalculo = { subtotal: number | string };

/** Soma dos subtotais dos itens de um pedido. */
export function calcularSubtotalItens(itens: ItemParaCalculo[]): number {
  return itens.reduce((soma, item) => soma + Number(item.subtotal), 0);
}

/** Valor do desconto em reais, considerando o tipo (VALOR ou PERCENTUAL). */
export function calcularValorDesconto(
  subtotalItens: number,
  desconto: number | string,
  descontoTipo: string,
): number {
  const valorDesconto = Number(desconto);
  return descontoTipo === "PERCENTUAL" ? (subtotalItens * valorDesconto) / 100 : valorDesconto;
}

/** Total final do pedido: subtotal dos itens - desconto + frete. */
export function calcularTotalPedido(
  itens: ItemParaCalculo[],
  desconto: number | string,
  descontoTipo: string,
  frete: number | string,
): number {
  const subtotalItens = calcularSubtotalItens(itens);
  const valorDesconto = calcularValorDesconto(subtotalItens, desconto, descontoTipo);
  return subtotalItens - valorDesconto + Number(frete);
}
