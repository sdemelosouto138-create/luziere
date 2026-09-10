import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/** Pedidos aprovados que ainda geram compra (ou todos, se pedido). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const incluirComprados = searchParams.get("incluirComprados") === "true";

  const pedidos = await prisma.pedido.findMany({
    where: {
      status: "APROVADO",
      ...(incluirComprados ? {} : { compraRealizada: false }),
    },
    include: {
      cliente: { select: { nome: true } },
      itens: {
        orderBy: { ordem: "asc" },
        include: {
          produto: {
            select: {
              id: true,
              nome: true,
              sku: true,
              unidade: true,
              precoCusto: true,
              fornecedor: { select: { id: true, nome: true } },
            },
          },
        },
      },
    },
    orderBy: { criadoEm: "asc" },
  });

  // Decimal vira number para o front-end poder somar.
  return NextResponse.json(
    pedidos.map((pedido) => ({
      id: pedido.id,
      numero: pedido.numero,
      criadoEm: pedido.criadoEm,
      compraRealizada: pedido.compraRealizada,
      cliente: pedido.cliente,
      itens: pedido.itens.map((item) => ({
        quantidade: item.quantidade,
        produto: { ...item.produto, precoCusto: Number(item.produto.precoCusto) },
      })),
    })),
  );
}

const marcarSchema = z.object({
  pedidoIds: z.array(z.string().min(1)).min(1, "Selecione ao menos um pedido."),
  comprada: z.boolean(),
});

/** Marca (ou desmarca) os pedidos como já comprados junto aos fornecedores. */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = marcarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { pedidoIds, comprada } = parsed.data;
  const resultado = await prisma.pedido.updateMany({
    where: { id: { in: pedidoIds } },
    data: {
      compraRealizada: comprada,
      compraRealizadaEm: comprada ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, atualizados: resultado.count });
}
