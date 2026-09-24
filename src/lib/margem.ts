import { calcularValorDesconto } from "@/lib/pedido";

/**
 * Cálculo de margem dos produtos.
 *
 * A Luziére vende com nota fiscal e o imposto incide sobre o FATURAMENTO
 * (Simples Nacional), ou seja, sobre o preço de venda — não sobre o lucro.
 * Por isso a conta é:
 *
 *   imposto = preçoVenda × alíquota
 *   lucro   = preçoVenda − preçoCusto − imposto
 *   margem  = lucro ÷ preçoVenda   (quanto sobra de cada real vendido)
 *   markup  = lucro ÷ preçoCusto   (quanto rende cada real investido na compra)
 */

/**
 * Alíquota padrão: 4,5% sobre o valor da nota.
 *
 * A faixa do Simples Nacional sobe conforme o faturamento anual, então dá para
 * trocar sem mexer no código: basta definir NEXT_PUBLIC_ALIQUOTA_IMPOSTO com a
 * porcentagem nova (ex.: "6" para 6%) nas variáveis de ambiente da Vercel e
 * refazer o deploy.
 */
export const ALIQUOTA_IMPOSTO = lerAliquota();

function lerAliquota(): number {
  const bruto = process.env.NEXT_PUBLIC_ALIQUOTA_IMPOSTO;
  const numero = Number(bruto);
  // Só aceita número válido entre 0 e 100; qualquer outra coisa usa o padrão.
  if (bruto && Number.isFinite(numero) && numero >= 0 && numero < 100) {
    return numero / 100;
  }
  return 0.045;
}

/** A alíquota em porcentagem, para exibir na tela: 4,5 */
export const ALIQUOTA_IMPOSTO_PERCENTUAL = ALIQUOTA_IMPOSTO * 100;

export type Margem = {
  /** Quanto do preço de venda vai para o imposto, em R$. */
  imposto: number;
  /** O que sobra depois de pagar o produto e o imposto, em R$. */
  lucro: number;
  /** Margem sobre o preço de venda, em % (ex.: 34,1). null se não dá para calcular. */
  percentual: number | null;
  /** Retorno sobre o custo, em % (ex.: 55,5). null se não dá para calcular. */
  markup: number | null;
};

/** Calcula o resultado líquido de um produto, já descontado o imposto da nota. */
export function calcularMargem(precoCusto: number, precoVenda: number): Margem {
  const imposto = precoVenda * ALIQUOTA_IMPOSTO;
  const lucro = precoVenda - precoCusto - imposto;

  return {
    imposto,
    lucro,
    percentual: precoVenda > 0 ? (lucro / precoVenda) * 100 : null,
    markup: precoCusto > 0 ? (lucro / precoCusto) * 100 : null,
  };
}

/**
 * Piso de margem usado só como sinalização visual (não bloqueia nada).
 * O catálogo atual fica entre 25% e 56%, então 20% funciona bem como
 * "algo aqui saiu do padrão, vale conferir".
 */
export const MARGEM_MINIMA_SAUDAVEL = 20;

export type FaixaMargem = "prejuizo" | "baixa" | "saudavel";

export function faixaDaMargem(percentual: number | null): FaixaMargem | null {
  if (percentual === null) return null;
  if (percentual < 0) return "prejuizo";
  if (percentual < MARGEM_MINIMA_SAUDAVEL) return "baixa";
  return "saudavel";
}

/** Classe de cor para cada faixa. Verde fica de fora de propósito: só destacamos o que precisa de atenção. */
export function corDaFaixa(faixa: FaixaMargem | null): string {
  if (faixa === "prejuizo") return "text-destructive";
  if (faixa === "baixa") return "text-amber-600 dark:text-amber-500";
  return "text-foreground";
}

type ProdutoComPrecos = { nome: string; precoCusto: number; precoVenda: number };

/** Resumo das margens de uma lista de produtos, para o painel no topo da tela. */
export function resumirMargens(produtos: ProdutoComPrecos[]) {
  const calculados = produtos
    .map((produto) => ({ produto, margem: calcularMargem(produto.precoCusto, produto.precoVenda) }))
    .filter((item) => item.margem.percentual !== null);

  if (calculados.length === 0) {
    return { media: null, menor: null, abaixoDoMinimo: 0, emPrejuizo: 0, total: 0 };
  }

  const soma = calculados.reduce((total, item) => total + (item.margem.percentual ?? 0), 0);
  const menor = calculados.reduce((pior, item) =>
    (item.margem.percentual ?? 0) < (pior.margem.percentual ?? 0) ? item : pior,
  );

  return {
    media: soma / calculados.length,
    menor: { nome: menor.produto.nome, percentual: menor.margem.percentual as number },
    abaixoDoMinimo: calculados.filter((i) => (i.margem.percentual as number) < MARGEM_MINIMA_SAUDAVEL).length,
    emPrejuizo: calculados.filter((i) => (i.margem.percentual as number) < 0).length,
    total: calculados.length,
  };
}

/** Formata uma porcentagem no padrão brasileiro: 34,1% */
export function formatarPercentual(valor: number, casas = 1): string {
  return `${valor.toFixed(casas).replace(".", ",")}%`;
}

type ItemParaMargem = {
  quantidade: number;
  subtotal: number | string;
  produto: { precoCusto: number | string };
};

export type MargemPedido = {
  /** O que entra de produto, já descontado o desconto do pedido. */
  receita: number;
  /** O que sai para pagar os fornecedores, pelo custo atual cadastrado. */
  custo: number;
  /** Imposto sobre o valor da nota (produtos + frete). */
  imposto: number;
  lucro: number;
  percentual: number | null;
  /** Quantos itens estão com custo zerado — nesses a margem fica otimista. */
  itensSemCusto: number;
};

/**
 * Margem estimada de um pedido inteiro.
 *
 * Duas decisões que valem registrar:
 * - O custo vem do cadastro ATUAL do produto, porque o ItemPedido guarda só o
 *   preço de venda. Se o fornecedor reajustar depois, a margem de um pedido
 *   antigo muda junto — por isso "estimada".
 * - O frete é tratado como repasse: não vira lucro, mas entra na base do
 *   imposto, já que sai na nota.
 */
export function calcularMargemPedido(
  itens: ItemParaMargem[],
  desconto: number | string,
  descontoTipo: string,
  frete: number | string,
): MargemPedido {
  const subtotalItens = itens.reduce((soma, item) => soma + Number(item.subtotal), 0);
  const valorDesconto = calcularValorDesconto(subtotalItens, desconto, descontoTipo);
  const receita = subtotalItens - valorDesconto;

  const custo = itens.reduce((soma, item) => soma + item.quantidade * Number(item.produto.precoCusto), 0);
  const imposto = (receita + Number(frete)) * ALIQUOTA_IMPOSTO;
  const lucro = receita - custo - imposto;

  return {
    receita,
    custo,
    imposto,
    lucro,
    percentual: receita > 0 ? (lucro / receita) * 100 : null,
    itensSemCusto: itens.filter((item) => Number(item.produto.precoCusto) <= 0).length,
  };
}
