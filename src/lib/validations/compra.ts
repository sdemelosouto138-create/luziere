import { z } from "zod";

export const itemCompraSchema = z.object({
  produtoId: z.string().min(1),
  quantidade: z.coerce.number().int().min(1, "A quantidade deve ser pelo menos 1."),
  custoUnitario: z.coerce.number().min(0),
});

export const compraSchema = z.object({
  /** null = compra sem fornecedor definido. */
  fornecedorId: z.string().min(1).nullable().optional(),
  observacoes: z.string().trim().optional().nullable(),
  itens: z.array(itemCompraSchema).min(1, "Adicione pelo menos um produto à compra."),
});

export type CompraInput = z.infer<typeof compraSchema>;
