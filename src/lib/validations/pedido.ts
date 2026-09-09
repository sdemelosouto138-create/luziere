import { z } from "zod";

export const itemPedidoSchema = z.object({
  produtoId: z.string().min(1),
  quantidade: z.coerce.number().int().min(1, "A quantidade deve ser pelo menos 1."),
  precoUnitario: z.coerce.number().min(0),
  ambiente: z.string().trim().optional().nullable(),
});

export const pedidoSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  itens: z.array(itemPedidoSchema).min(1, "Adicione pelo menos um item ao pedido."),
  desconto: z.coerce.number().min(0).default(0),
  descontoTipo: z.enum(["VALOR", "PERCENTUAL"]).default("VALOR"),
  frete: z.coerce.number().min(0).default(0),
  prazoEntrega: z.string().trim().optional().nullable(),
  condicaoPagamento: z.string().trim().optional().nullable(),
  observacoes: z.string().trim().optional().nullable(),
  validadeDias: z.coerce.number().int().min(1).default(7),
  /** Ambientes criados na montagem, mesmo os que ainda não têm itens. */
  ambientes: z.array(z.string().trim().min(1)).optional().default([]),
});

export type PedidoInput = z.infer<typeof pedidoSchema>;

export const statusPedidoSchema = z.object({
  status: z.enum(["ORCAMENTO", "APROVADO", "CONCLUIDO", "CANCELADO"]),
});
