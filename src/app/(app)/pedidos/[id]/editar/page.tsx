import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PedidoForm } from "@/components/pedidos/pedido-form";

export default async function EditarPedidoPage({ params }: PageProps<"/pedidos/[id]/editar">) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { itens: { include: { produto: true }, orderBy: { ordem: "asc" } } },
  });

  if (!pedido) {
    notFound();
  }

  // Pedido cancelado é histórico: não se edita.
  if (pedido.status === "CANCELADO") {
    redirect(`/pedidos/${id}`);
  }

  const estoqueJaFoiBaixado = pedido.status === "APROVADO" || pedido.status === "CONCLUIDO";

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">
        Editar {pedido.status === "ORCAMENTO" ? "orçamento" : "pedido"} #{pedido.numero}
      </h1>

      {estoqueJaFoiBaixado && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            Este pedido já teve baixa no estoque. Ao salvar, o estoque é acertado automaticamente: o que você
            aumentar sai do estoque e o que reduzir ou remover volta para ele, com registro no histórico.
          </span>
        </p>
      )}

      <div className="mt-8">
        <PedidoForm
          pedido={{
            id: pedido.id,
            clienteId: pedido.clienteId,
            desconto: Number(pedido.desconto),
            descontoTipo: pedido.descontoTipo as "VALOR" | "PERCENTUAL",
            frete: Number(pedido.frete),
            prazoEntrega: pedido.prazoEntrega,
            condicaoPagamento: pedido.condicaoPagamento,
            observacoes: pedido.observacoes,
            validadeDias: pedido.validadeDias,
            ambientes: pedido.ambientes,
            itens: pedido.itens.map((i) => ({
              produtoId: i.produtoId,
              produto: { nome: i.produto.nome, sku: i.produto.sku },
              ambiente: i.ambiente,
              quantidade: i.quantidade,
              precoUnitario: Number(i.precoUnitario),
            })),
          }}
        />
      </div>
    </div>
  );
}
