import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularSubtotalItens, calcularTotalPedido, calcularValorDesconto } from "@/lib/pedido";
import { formatarData } from "@/lib/format";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const formato = searchParams.get("formato");

  const pedidos = await prisma.pedido.findMany({
    where: {
      status: { in: ["APROVADO", "CONCLUIDO"] },
      ...(dataInicio || dataFim
        ? {
            criadoEm: {
              ...(dataInicio ? { gte: new Date(`${dataInicio}T00:00:00`) } : {}),
              ...(dataFim ? { lte: new Date(`${dataFim}T23:59:59`) } : {}),
            },
          }
        : {}),
    },
    include: {
      cliente: true,
      itens: { include: { produto: { include: { categoria: true } } } },
    },
    orderBy: { criadoEm: "desc" },
  });

  const pedidosComTotal = pedidos.map((pedido) => {
    const itens = pedido.itens.map((i) => ({ ...i, subtotal: Number(i.subtotal) }));
    const subtotal = calcularSubtotalItens(itens);
    const valorDesconto = calcularValorDesconto(subtotal, Number(pedido.desconto), pedido.descontoTipo);
    const total = calcularTotalPedido(itens, Number(pedido.desconto), pedido.descontoTipo, Number(pedido.frete));
    const custo = pedido.itens.reduce((soma, i) => soma + Number(i.produto.precoCusto) * i.quantidade, 0);
    return { ...pedido, subtotal, valorDesconto, total, custo };
  });

  if (formato === "csv") {
    const linhas = [
      "Número;Cliente;Data;Status;Total (R$)",
      ...pedidosComTotal.map((p) =>
        [p.numero, `"${p.cliente.nome.replace(/"/g, '""')}"`, formatarData(p.criadoEm), p.status, p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })].join(";"),
      ),
    ];
    // BOM para o Excel abrir com acentuação correta.
    const csv = "﻿" + linhas.join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-vendas-luziere.csv"`,
      },
    });
  }

  const totalVendido = pedidosComTotal.reduce((s, p) => s + p.total, 0);
  const numPedidos = pedidosComTotal.length;
  const ticketMedio = numPedidos > 0 ? totalVendido / numPedidos : 0;
  const lucroEstimado = pedidosComTotal.reduce((s, p) => s + (p.subtotal - p.valorDesconto - p.custo), 0);

  const porCategoria = new Map<string, number>();
  const porProduto = new Map<string, { nome: string; quantidade: number; total: number }>();
  const porCliente = new Map<string, { nome: string; total: number; pedidos: number }>();

  for (const pedido of pedidosComTotal) {
    for (const item of pedido.itens) {
      const categoria = item.produto.categoria.nome;
      porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + Number(item.subtotal));

      const atual = porProduto.get(item.produtoId) ?? { nome: item.produto.nome, quantidade: 0, total: 0 };
      atual.quantidade += item.quantidade;
      atual.total += Number(item.subtotal);
      porProduto.set(item.produtoId, atual);
    }

    const cliente = porCliente.get(pedido.clienteId) ?? { nome: pedido.cliente.nome, total: 0, pedidos: 0 };
    cliente.total += pedido.total;
    cliente.pedidos += 1;
    porCliente.set(pedido.clienteId, cliente);
  }

  return NextResponse.json({
    totalVendido,
    numPedidos,
    ticketMedio,
    lucroEstimado,
    vendasPorCategoria: [...porCategoria.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total),
    produtosMaisVendidos: [...porProduto.values()].sort((a, b) => b.quantidade - a.quantidade).slice(0, 10),
    melhoresClientes: [...porCliente.values()].sort((a, b) => b.total - a.total).slice(0, 10),
  });
}
