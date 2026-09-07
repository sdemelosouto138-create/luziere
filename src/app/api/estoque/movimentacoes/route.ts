import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const movimentacaoSchema = z.object({
  produtoId: z.string().min(1, "Selecione um produto."),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  quantidade: z.coerce.number().int().min(1, "A quantidade deve ser pelo menos 1."),
  motivo: z.string().trim().min(1, "Informe o motivo."),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const produtoId = searchParams.get("produtoId");

  const movimentacoes = await prisma.movimentacaoEstoque.findMany({
    where: produtoId ? { produtoId } : undefined,
    include: {
      produto: { select: { nome: true, sku: true } },
      pedido: { select: { numero: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 200,
  });

  return NextResponse.json(movimentacoes);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = movimentacaoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { produtoId, tipo, quantidade, motivo } = parsed.data;

  const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
  if (!produto) {
    return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  }

  if (tipo === "SAIDA" && produto.estoqueAtual < quantidade) {
    return NextResponse.json(
      { erro: `Estoque insuficiente. Estoque atual: ${produto.estoqueAtual}.` },
      { status: 409 },
    );
  }

  const movimentacao = await prisma.$transaction(async (tx) => {
    await tx.produto.update({
      where: { id: produtoId },
      data: { estoqueAtual: tipo === "ENTRADA" ? { increment: quantidade } : { decrement: quantidade } },
    });
    return tx.movimentacaoEstoque.create({
      data: { produtoId, tipo, quantidade, motivo },
      include: { produto: { select: { nome: true, sku: true } }, pedido: { select: { numero: true } } },
    });
  });

  return NextResponse.json(movimentacao, { status: 201 });
}
