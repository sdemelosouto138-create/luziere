import { z } from "zod";

export const produtoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do produto."),
  sku: z.string().trim().min(1, "Informe o código/SKU."),
  categoriaId: z.string().min(1, "Selecione uma categoria."),
  descricao: z.string().trim().optional().nullable(),
  precoCusto: z.coerce.number().min(0, "O preço de custo não pode ser negativo."),
  precoVenda: z.coerce.number().min(0, "O preço de venda não pode ser negativo."),
  unidade: z.enum(["un", "m", "cx"]),
  potenciaW: z.coerce.number().nullable().optional(),
  temperaturaCor: z.string().trim().nullable().optional(),
  estoqueAtual: z.coerce.number().int("Deve ser um número inteiro.").min(0),
  estoqueMinimo: z.coerce.number().int("Deve ser um número inteiro.").min(0),
  fornecedorId: z.string().trim().optional().nullable(),
  imagens: z.array(z.string().min(1)).optional().default([]),
});

export type ProdutoInput = z.infer<typeof produtoSchema>;
