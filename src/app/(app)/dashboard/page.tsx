import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/pedidos/status-badge";
import { VendasChart } from "@/components/dashboard/vendas-chart";
import { formatarData, formatarMoeda } from "@/lib/format";
import { calcularTotalPedido } from "@/lib/pedido";

type PedidoParaTotal = {
  desconto: unknown;
  descontoTipo: string;
  frete: unknown;
  itens: { subtotal: unknown }[];
};

function totalDoPedido(pedido: PedidoParaTotal) {
  return calcularTotalPedido(
    pedido.itens.map((i) => ({ subtotal: Number(i.subtotal) })),
    Number(pedido.desconto),
    pedido.descontoTipo,
    Number(pedido.frete),
  );
}

export default async function DashboardPage() {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioSeisMeses = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);

  const [vendasSeisMeses, orcamentosAbertos, produtosAtivos, ultimosPedidos] = await Promise.all([
    prisma.pedido.findMany({
      where: { status: { in: ["APROVADO", "CONCLUIDO"] }, criadoEm: { gte: inicioSeisMeses } },
      include: { itens: true },
    }),
    prisma.pedido.findMany({
      where: { status: "ORCAMENTO" },
      include: { itens: true, cliente: true },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.produto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.pedido.findMany({
      include: { cliente: true, itens: true },
      orderBy: { criadoEm: "desc" },
      take: 5,
    }),
  ]);

  const vendasMes = vendasSeisMeses.filter((p) => p.criadoEm >= inicioMes);
  const totalMes = vendasMes.reduce((soma, p) => soma + totalDoPedido(p), 0);
  const ticketMedio = vendasMes.length > 0 ? totalMes / vendasMes.length : 0;
  const valorOrcamentosAbertos = orcamentosAbertos.reduce((soma, p) => soma + totalDoPedido(p), 0);
  const estoqueBaixo = produtosAtivos.filter((p) => p.estoqueAtual <= p.estoqueMinimo);

  const formatadorMes = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const dadosGrafico = Array.from({ length: 6 }, (_, i) => {
    const mes = new Date(agora.getFullYear(), agora.getMonth() - 5 + i, 1);
    const total = vendasSeisMeses
      .filter((p) => p.criadoEm.getFullYear() === mes.getFullYear() && p.criadoEm.getMonth() === mes.getMonth())
      .reduce((soma, p) => soma + totalDoPedido(p), 0);
    const rotulo = formatadorMes.format(mes).replace(".", "");
    return { mes: rotulo.charAt(0).toUpperCase() + rotulo.slice(1), total };
  });

  const cards = [
    { titulo: "Vendas no mês", valor: formatarMoeda(totalMes), destaque: true },
    { titulo: "Pedidos no mês", valor: String(vendasMes.length) },
    { titulo: "Ticket médio", valor: formatarMoeda(ticketMedio) },
    { titulo: "Orçamentos em aberto", valor: formatarMoeda(valorOrcamentosAbertos), sub: `${orcamentosAbertos.length} orçamento(s)` },
    { titulo: "Estoque baixo", valor: String(estoqueBaixo.length), sub: "produto(s) abaixo do mínimo", alerta: estoqueBaixo.length > 0 },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Visão geral da Luzière em {formatadorMes.format(agora).replace(".", "")}/{agora.getFullYear()}.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.titulo}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{card.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-sans text-2xl font-semibold tabular-nums tracking-tight ${card.destaque ? "text-primary" : card.alerta ? "text-destructive" : "text-foreground"}`}>
                {card.valor}
              </p>
              {card.sub && <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-serif text-lg font-normal">Vendas nos últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <VendasChart dados={dadosGrafico} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg font-normal">Últimos pedidos</CardTitle>
            <Link href="/pedidos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              Ver todos <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimosPedidos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>}
            {ultimosPedidos.map((pedido) => (
              <Link
                key={pedido.id}
                href={`/pedidos/${pedido.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    #{pedido.numero} · {pedido.cliente.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatarData(pedido.criadoEm)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatarMoeda(totalDoPedido(pedido))}</p>
                  <StatusBadge status={pedido.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg font-normal">Orçamentos pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orcamentosAbertos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum orçamento em aberto.</p>}
            {orcamentosAbertos.slice(0, 5).map((pedido) => (
              <Link
                key={pedido.id}
                href={`/pedidos/${pedido.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    #{pedido.numero} · {pedido.cliente.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(pedido.criadoEm)} · válido por {pedido.validadeDias} dias
                  </p>
                </div>
                <p className="text-sm font-medium">{formatarMoeda(totalDoPedido(pedido))}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {estoqueBaixo.length > 0 && (
        <Card className="mt-6 border-destructive/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="inline-flex items-center gap-2 font-serif text-lg font-normal text-destructive">
              <AlertTriangle className="size-4" />
              Alertas de estoque baixo
            </CardTitle>
            <Link href="/estoque" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              Ir para estoque <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {estoqueBaixo.map((produto) => (
                <li key={produto.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span>
                    <span className="font-medium">{produto.nome}</span>
                    {produto.sku && <span className="ml-2 text-xs text-muted-foreground">{produto.sku}</span>}
                  </span>
                  <span className="text-destructive">
                    {produto.estoqueAtual} / mín. {produto.estoqueMinimo}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
