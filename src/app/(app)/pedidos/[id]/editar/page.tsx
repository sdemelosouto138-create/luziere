import { notFound, redirect } from "next/navigation";
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

  if (pedido.status !== "ORCAMENTO") {
    redirect(`/pedidos/${id}`);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Editar orçamento #{pedido.numero}</h1>

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
