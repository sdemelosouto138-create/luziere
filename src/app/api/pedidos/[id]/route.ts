import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pedidoSchema } from "@/lib/validations/pedido";
import { serializarPedido } from "@/lib/serialize";

export async function GET(_request: Request, { params }: RouteContext<"/api/pedidos/[id]">) {
  const { id } = await params;
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { cliente: true, itens: { include: { produto: true }, orderBy: { ordem: "asc" } } },
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

  const pedidoAtual = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: true },
  });
  if (!pedidoAtual) {
    return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  if (pedidoAtual.status === "CANCELADO") {
    return NextResponse.json(
      { erro: "Um pedido cancelado não pode ser editado." },
      { status: 409 },
    );
  }

  const dados = parsed.data;

  // Em pedido aprovado/concluído o estoque já foi baixado, então a edição
  // precisa acertar apenas a diferença entre o que havia e o que passa a haver.
  const estoqueJaFoiBaixado = pedidoAtual.status === "APROVADO" || pedidoAtual.status === "CONCLUIDO";

  const somarPorProduto = (itens: { produtoId: string; quantidade: number }[]) => {
    const mapa = new Map<string, number>();
    for (const item of itens) {
      mapa.set(item.produtoId, (mapa.get(item.produtoId) ?? 0) + item.quantidade);
    }
    return mapa;
  };

  // O mesmo produto pode estar em vários ambientes, por isso somamos por produto.
  const quantidadesAntes = somarPorProduto(pedidoAtual.itens);
  const quantidadesDepois = somarPorProduto(dados.itens);

  const pedido = await prisma.$transaction(async (tx) => {
    if (estoqueJaFoiBaixado) {
      const produtos = new Set([...quantidadesAntes.keys(), ...quantidadesDepois.keys()]);
      for (const produtoId of produtos) {
        const antes = quantidadesAntes.get(produtoId) ?? 0;
        const depois = quantidadesDepois.get(produtoId) ?? 0;
        const diferenca = depois - antes;
        if (diferenca === 0) continue;

        await tx.produto.update({
          where: { id: produtoId },
          data: { estoqueAtual: { decrement: diferenca } },
        });
        await tx.movimentacaoEstoque.create({
          data: {
            produtoId,
            tipo: diferenca > 0 ? "VENDA" : "CANCELAMENTO",
            quantidade: Math.abs(diferenca),
            motivo:
              diferenca > 0
                ? `Ajuste por edição do pedido #${pedidoAtual.numero} (aumento de quantidade)`
                : `Devolução por edição do pedido #${pedidoAtual.numero} (redução de quantidade)`,
            pedidoId: id,
          },
        });
      }
    }

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
  });

  return NextResponse.json(serializarPedido(pedido));
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/pedidos/[id]">) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({ where: { id }, include: { itens: true } });
  if (!pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  // Se o estoque já foi baixado (aprovado/concluído), devolve os itens antes de excluir.
  const estoqueFoiBaixado = pedido.status === "APROVADO" || pedido.status === "CONCLUIDO";

  await prisma.$transaction(async (tx) => {
    if (estoqueFoiBaixado) {
      for (const item of pedido.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoqueAtual: { increment: item.quantidade } },
        });
        await tx.movimentacaoEstoque.create({
          data: {
            produtoId: item.produtoId,
            tipo: "CANCELAMENTO",
            quantidade: item.quantidade,
            motivo: `Devolução ao estoque por exclusão do pedido #${pedido.numero}`,
          },
        });
      }
    }

    // Movimentações antigas ligadas ao pedido ficam no histórico (o vínculo vira nulo).
    await tx.movimentacaoEstoque.updateMany({ where: { pedidoId: id }, data: { pedidoId: null } });
    await tx.pedido.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true, estoqueDevolvido: estoqueFoiBaixado });
}
