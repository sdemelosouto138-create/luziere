import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { StatusBadge } from "@/components/pedidos/status-badge";
import { formatarData, formatarMoeda } from "@/lib/format";
import { calcularTotalPedido } from "@/lib/pedido";

export default async function FichaClientePage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      pedidos: {
        include: { itens: true },
        orderBy: { criadoEm: "desc" },
      },
    },
  });

  if (!cliente) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">{cliente.nome}</h1>
      <p className="mt-1 text-muted-foreground">Ficha do cliente.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ClienteForm
          cliente={{
            id: cliente.id,
            nome: cliente.nome,
            telefone: cliente.telefone,
            email: cliente.email,
            cpfCnpj: cliente.cpfCnpj,
            cep: cliente.cep,
            rua: cliente.rua,
            numero: cliente.numero,
            bairro: cliente.bairro,
            cidade: cliente.cidade,
            uf: cliente.uf,
            observacoes: cliente.observacoes,
          }}
        />

        <div>
          <h2 className="font-serif text-xl text-foreground">Histórico de pedidos e orçamentos</h2>
          <div className="mt-4 space-y-3">
            {cliente.pedidos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum pedido registrado ainda.</p>
            )}
            {cliente.pedidos.map((pedido) => {
              const total = calcularTotalPedido(
                pedido.itens.map((i) => ({ subtotal: Number(i.subtotal) })),
                Number(pedido.desconto),
                pedido.descontoTipo,
                Number(pedido.frete),
              );
              return (
                <Link
                  key={pedido.id}
                  href={`/pedidos/${pedido.id}`}
                  className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-medium text-foreground">Pedido #{pedido.numero}</p>
                    <p className="text-sm text-muted-foreground">{formatarData(pedido.criadoEm)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatarMoeda(total)}</p>
                    <StatusBadge status={pedido.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
