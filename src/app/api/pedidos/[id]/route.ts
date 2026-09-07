import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pedidoSchema } from "@/lib/validations/pedido";
import { serializarPedido } from "@/lib/serialize";

export async function GET(_request: Request, { params }: RouteContext<"/api/pedidos/[id]">) {
  const { id } = await params;
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { cliente: true, itens: { include: { produto: true } } },
  });

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json(serializarPedido(pedido));
}

export async function PUT(request: Request, { params }: RouteContext<"/api/pedidos/[id]">) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = pedidoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const pedidoAtual = await prisma.pedido.findUnique({ where: { id } });
  if (!pedidoAtual) {
    return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  if (pedidoAtual.status !== "ORCAMENTO") {
    return NextResponse.json(
      { erro: "Só é possível editar os itens enquanto o pedido está como orçamento." },
      { status: 409 },
    );
  }

  const dados = parsed.data;

  const pedido = await prisma.$transaction(async (tx) => {
    await tx.itemPedido.deleteMany({ where: { pedidoId: id } });

    return tx.pedido.update({
      where: { id },
      data: {
        clienteId: dados.clienteId,
        desconto: dados.desconto,
        descontoTipo: dados.descontoTipo,
        frete: dados.frete,
        prazoEntrega: dados.prazoEntrega || null,
        condicaoPagamento: dados.condicaoPagamento || null,
        observacoes: dados.observacoes || null,
        validadeDias: dados.validadeDias,
        itens: {
          create: dados.itens.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.quantidade * item.precoUnitario,
          })),
        },
      },
      include: { cliente: true, itens: { include: { produto: true } } },
    });
  });

  return NextResponse.json(serializarPedido(pedido));
}
