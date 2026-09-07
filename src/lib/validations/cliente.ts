import { z } from "zod";

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  telefone: z.string().trim().optional().nullable(),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")).nullable(),
  cpfCnpj: z.string().trim().optional().nullable(),
  cep: z.string().trim().optional().nullable(),
  rua: z.string().trim().optional().nullable(),
  numero: z.string().trim().optional().nullable(),
  bairro: z.string().trim().optional().nullable(),
  cidade: z.string().trim().optional().nullable(),
  uf: z.string().trim().max(2).optional().nullable(),
  observacoes: z.string().trim().optional().nullable(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
