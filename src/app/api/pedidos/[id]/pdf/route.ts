import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { OrcamentoPdf, type OrcamentoPdfData } from "@/components/pdf/orcamento-pdf";
import { calcularSubtotalItens, calcularValorDesconto, calcularTotalPedido } from "@/lib/pedido";

export async function GET(_request: Request, { params }: RouteContext<"/api/pedidos/[id]/pdf">) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { cliente: true, itens: { include: { produto: true } } },
  });

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  const itens = pedido.itens.map((item) => ({
    quantidade: item.quantidade,
    precoUnitario: Number(item.precoUnitario),
    subtotal: Number(item.subtotal),
    produto: {
      nome: item.produto.nome,
      sku: item.produto.sku,
      unidade: item.produto.unidade,
    },
  }));

  const subtotal = calcularSubtotalItens(itens);
  const valorDesconto = calcularValorDesconto(subtotal, Number(pedido.desconto), pedido.descontoTipo);
  const total = calcularTotalPedido(itens, Number(pedido.desconto), pedido.descontoTipo, Number(pedido.frete));

  const dados: OrcamentoPdfData = {
    numero: pedido.numero,
    criadoEm: pedido.criadoEm,
    validadeDias: pedido.validadeDias,
    desconto: Number(pedido.desconto),
    descontoTipo: pedido.descontoTipo,
    frete: Number(pedido.frete),
    prazoEntrega: pedido.prazoEntrega,
    condicaoPagamento: pedido.condicaoPagamento,
    observacoes: pedido.observacoes,
    cliente: {
      nome: pedido.cliente.nome,
      telefone: pedido.cliente.telefone,
      email: pedido.cliente.email,
      rua: pedido.cliente.rua,
      numero: pedido.cliente.numero,
      bairro: pedido.cliente.bairro,
      cidade: pedido.cliente.cidade,
      uf: pedido.cliente.uf,
    },
    itens,
    loja: {
      nome: process.env.LOJA_NOME || "Luzière",
      telefone: process.env.LOJA_TELEFONE || "",
      email: process.env.LOJA_EMAIL || "",
      endereco: process.env.LOJA_ENDERECO || "",
      cnpj: process.env.LOJA_CNPJ || "",
    },
    subtotal,
    valorDesconto,
    total,
  };

  const buffer = await renderToBuffer(OrcamentoPdf({ dados }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-luziere-${pedido.numero}.pdf"`,
    },
  });
}
