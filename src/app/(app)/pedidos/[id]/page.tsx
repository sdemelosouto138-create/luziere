import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/pedidos/status-badge";
import { PedidoStatusActions } from "@/components/pedidos/pedido-status-actions";
import { PedidoExcluirButton } from "@/components/pedidos/pedido-excluir-button";
import { formatarData, formatarMoeda } from "@/lib/format";
import { calcularSubtotalItens, calcularValorDesconto, calcularTotalPedido } from "@/lib/pedido";

export default async function DetalhePedidoPage({ params }: PageProps<"/pedidos/[id]">) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { cliente: true, itens: { include: { produto: true }, orderBy: { ordem: "asc" } } },
  });

  if (!pedido) {
    notFound();
  }

  const itens = pedido.itens.map((i) => ({
    ...i,
    precoUnitario: Number(i.precoUnitario),
    subtotal: Number(i.subtotal),
  }));
  // Agrupa por ambiente (Quarto, Sacada...) na ordem definida na montagem.
  // Ambientes ainda sem itens continuam listados, para o pedido não parecer incompleto.
  const grupos: { ambiente: string | null; itens: typeof itens }[] = pedido.ambientes.map((nome) => ({
    ambiente: nome,
    itens: itens.filter((i) => i.ambiente === nome),
  }));
  const semAmbiente = itens.filter((i) => !i.ambiente);
  if (semAmbiente.length > 0) grupos.unshift({ ambiente: null, itens: semAmbiente });
  const temAmbientes = pedido.ambientes.length > 0;

  const subtotal = calcularSubtotalItens(itens);
  const valorDesconto = calcularValorDesconto(subtotal, Number(pedido.desconto), pedido.descontoTipo);
  const total = calcularTotalPedido(itens, Number(pedido.desconto), pedido.descontoTipo, Number(pedido.frete));

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-foreground">Pedido #{pedido.numero}</h1>
            <StatusBadge status={pedido.status} />
          </div>
          <p className="mt-1 text-muted-foreground">
            <Link href={`/clientes/${pedido.clienteId}`} className="hover:text-primary">
              {pedido.cliente.nome}
            </Link>{" "}
            · {formatarData(pedido.criadoEm)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={`/api/pedidos/${pedido.id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" />
              Baixar PDF
            </a>
          </Button>
          {pedido.status === "ORCAMENTO" && (
            <Button variant="outline" asChild>
              <Link href={`/pedidos/${pedido.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
          )}
          <PedidoExcluirButton pedidoId={pedido.id} numero={pedido.numero} status={pedido.status} />
        </div>
      </div>

      <div className="mt-6">
        <PedidoStatusActions pedidoId={pedido.id} status={pedido.status} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Preço unit.</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.map((grupo) => (
              <Fragment key={grupo.ambiente ?? "__sem_ambiente__"}>
                {temAmbientes && (
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableCell colSpan={3} className="py-2 text-xs font-semibold uppercase tracking-wide">
                      {grupo.ambiente ?? "Sem ambiente"}
                    </TableCell>
                    <TableCell className="py-2 text-xs font-semibold">
                      {formatarMoeda(grupo.itens.reduce((soma, i) => soma + i.subtotal, 0))}
                    </TableCell>
                  </TableRow>
                )}
                {grupo.itens.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-3 text-center text-xs text-muted-foreground">
                      Nenhum item neste ambiente.
                    </TableCell>
                  </TableRow>
                )}
                {grupo.itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.produto.nome}</p>
                      {item.produto.sku && <p className="text-xs text-muted-foreground">{item.produto.sku}</p>}
                    </TableCell>
                    <TableCell>{item.quantidade}</TableCell>
                    <TableCell>{formatarMoeda(item.precoUnitario)}</TableCell>
                    <TableCell>{formatarMoeda(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          {pedido.prazoEntrega && (
            <p>
              <span className="text-muted-foreground">Prazo de entrega: </span>
              {pedido.prazoEntrega}
            </p>
          )}
          {pedido.condicaoPagamento && (
            <p>
              <span className="text-muted-foreground">Condição de pagamento: </span>
              {pedido.condicaoPagamento}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Validade do orçamento: </span>
            {pedido.validadeDias} dias
          </p>
          {pedido.observacoes && (
            <p>
              <span className="text-muted-foreground">Observações: </span>
              {pedido.observacoes}
            </p>
          )}
        </div>

        <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-xl border border-border p-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatarMoeda(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Desconto</span>
            <span>- {formatarMoeda(valorDesconto)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Frete</span>
            <span>{formatarMoeda(Number(pedido.frete))}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 font-serif text-lg text-foreground">
            <span>Total</span>
            <span className="text-primary">{formatarMoeda(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
