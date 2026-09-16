import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusPedidoSchema } from "@/lib/validations/pedido";
import { serializarPedido } from "@/lib/serialize";

const TRANSICOES_VALIDAS: Record<string, string[]> = {
  ORCAMENTO: ["APROVADO", "CANCELADO"],
  APROVADO: ["CONCLUIDO", "CANCELADO"],
  // Voltar de concluído para aprovado corrige um clique errado sem cancelar a venda.
  CONCLUIDO: ["APROVADO", "CANCELADO"],
  CANCELADO: [],
};

export async function PATCH(request: Request, { params }: RouteContext<"/api/pedidos/[id]/status">) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = statusPedidoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  }

  const novoStatus = parsed.data.status;

  const pedidoAtual = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: true },
  });

  if (!pedidoAtual) {
    return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  if (novoStatus === pedidoAtual.status) {
    return NextResponse.json(serializarPedido(pedidoAtual));
  }

  const permitido = TRANSICOES_VALIDAS[pedidoAtual.status]?.includes(novoStatus);
  if (!permitido) {
    return NextResponse.json(
      { erro: `Não é possível mudar de "${pedidoAtual.status}" para "${novoStatus}".` },
      { status: 409 },
    );
  }

  // A baixa acontece na CONCLUSÃO (entrega), não na aprovação: a loja trabalha
  // sob encomenda, então entre aprovar e entregar a mercadoria ainda nem chegou.
  const estoqueJaFoiBaixado = pedidoAtual.status === "CONCLUIDO";

  const pedido = await prisma.$transaction(async (tx) => {
    if (novoStatus === "CONCLUIDO" && !estoqueJaFoiBaixado) {
      for (const item of pedidoAtual.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoqueAtual: { decrement: item.quantidade } },
        });
        await tx.movimentacaoEstoque.create({
          data: {
            produtoId: item.produtoId,
            tipo: "VENDA",
            quantidade: item.quantidade,
            motivo: "Baixa automática por conclusão do pedido",
            pedidoId: id,
          },
        });
      }
    }

    // Sair de concluído (cancelar ou voltar para aprovado) estorna a baixa.
    if ((novoStatus === "CANCELADO" || novoStatus === "APROVADO") && estoqueJaFoiBaixado) {
      for (const item of pedidoAtual.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoqueAtual: { increment: item.quantidade } },
        });
        await tx.movimentacaoEstoque.create({
          data: {
            produtoId: item.produtoId,
            tipo: "CANCELAMENTO",
            quantidade: item.quantidade,
            motivo:
              novoStatus === "CANCELADO"
                ? "Devolução ao estoque por cancelamento de pedido"
                : "Estorno ao estoque: pedido deixou de estar concluído",
            pedidoId: id,
          },
        });
      }
    }

    return tx.pedido.update({
      where: { id },
      data: { status: novoStatus },
      include: { cliente: true, itens: { include: { produto: true }, orderBy: { ordem: "asc" } } },
    });
  });

  return NextResponse.json(serializarPedido(pedido));
}
