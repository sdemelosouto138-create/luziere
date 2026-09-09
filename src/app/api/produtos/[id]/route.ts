import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { produtoSchema } from "@/lib/validations/produto";
import { serializarProduto } from "@/lib/serialize";

export async function GET(_request: Request, { params }: RouteContext<"/api/produtos/[id]">) {
  const { id } = await params;
  const produto = await prisma.produto.findUnique({
    where: { id },
    include: { categoria: true, fornecedor: true, imagens: { orderBy: { ordem: "asc" } } },
  });

  if (!produto) {
    return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  }

  return NextResponse.json(serializarProduto(produto));
}

export async function PUT(request: Request, { params }: RouteContext<"/api/produtos/[id]">) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = produtoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const dados = parsed.data;

  const produtoAtual = await prisma.produto.findUnique({ where: { id } });
  if (!produtoAtual) {
    return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  }

  // O SKU é opcional; só verificamos duplicidade quando for informado.
  if (dados.sku) {
    const skuEmUso = await prisma.produto.findFirst({ where: { sku: dados.sku, NOT: { id } } });
    if (skuEmUso) {
      return NextResponse.json({ erro: "Já existe outro produto com esse código." }, { status: 409 });
    }
  }

  const diferencaEstoque = dados.estoqueAtual - produtoAtual.estoqueAtual;

  const produto = await prisma.$transaction(async (tx) => {
    await tx.imagemProduto.deleteMany({ where: { produtoId: id } });

    const atualizado = await tx.produto.update({
      where: { id },
      data: {
        nome: dados.nome,
        sku: dados.sku || null,
        descricao: dados.descricao || null,
        categoriaId: dados.categoriaId,
        precoCusto: dados.precoCusto,
        precoVenda: dados.precoVenda,
        unidade: dados.unidade,
        potenciaW: dados.potenciaW ?? null,
        temperaturaCor: dados.temperaturaCor || null,
        estoqueAtual: dados.estoqueAtual,
        estoqueMinimo: dados.estoqueMinimo,
        fornecedorId: dados.fornecedorId || null,
        imagens: {
          create: dados.imagens.map((url, ordem) => ({ url, ordem })),
        },
      },
      include: { categoria: true, fornecedor: true, imagens: true },
    });

    if (diferencaEstoque !== 0) {
      await tx.movimentacaoEstoque.create({
        data: {
          produtoId: id,
          tipo: "AJUSTE",
          quantidade: Math.abs(diferencaEstoque),
          motivo: `Ajuste via edição de cadastro (${diferencaEstoque > 0 ? "+" : ""}${diferencaEstoque})`,
        },
      });
    }

    return atualizado;
  });

  return NextResponse.json(serializarProduto(produto));
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/produtos/[id]">) {
  const { id } = await params;

  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto) {
    return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  }

  const usadoEmPedidos = await prisma.itemPedido.findFirst({ where: { produtoId: id } });

  if (usadoEmPedidos) {
    await prisma.produto.update({ where: { id }, data: { ativo: false } });
    return NextResponse.json({ ok: true, desativado: true });
  }

  await prisma.imagemProduto.deleteMany({ where: { produtoId: id } });
  await prisma.movimentacaoEstoque.deleteMany({ where: { produtoId: id } });
  await prisma.produto.delete({ where: { id } });
  return NextResponse.json({ ok: true, desativado: false });
}
