import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pedidoSchema } from "@/lib/validations/pedido";
import { serializarPedido } from "@/lib/serialize";
import type { StatusPedido } from "@/generated/prisma/enums";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const busca = searchParams.get("busca")?.trim();
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const pedidos = await prisma.pedido.findMany({
    where: {
      ...(status ? { status: status as StatusPedido } : {}),
      ...(busca ? { cliente: { nome: { contains: busca, mode: "insensitive" } } } : {}),
      ...(dataInicio || dataFim
        ? {
            criadoEm: {
              ...(dataInicio ? { gte: new Date(`${dataInicio}T00:00:00`) } : {}),
              ...(dataFim ? { lte: new Date(`${dataFim}T23:59:59`) } : {}),
            },
          }
        : {}),
    },
    include: { cliente: true, itens: true },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(pedidos.map(serializarPedido));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = pedidoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const dados = parsed.data;

  const pedido = await prisma.pedido.create({
    data: {
      clienteId: dados.clienteId,
      desconto: dados.desconto,
      descontoTipo: dados.descontoTipo,
      frete: dados.frete,
      prazoEntrega: dados.prazoEntrega || null,
      condicaoPagamento: dados.condicaoPagamento || null,
      observacoes: dados.observacoes || null,
      validadeDias: dados.validadeDias,
      ambientes: dados.ambientes,
      itens: {
        create: dados.itens.map((item, ordem) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          subtotal: item.quantidade * item.precoUnitario,
          ambiente: item.ambiente || null,
          ordem,
        })),
      },
    },
    include: { cliente: true, itens: { include: { produto: true }, orderBy: { ordem: "asc" } } },
  });

  return NextResponse.json(serializarPedido(pedido), { status: 201 });
}
