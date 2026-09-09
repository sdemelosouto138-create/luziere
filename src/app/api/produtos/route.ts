import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { produtoSchema } from "@/lib/validations/produto";
import { serializarProduto } from "@/lib/serialize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca")?.trim();
  const categoriaId = searchParams.get("categoriaId");
  const apenasAtivos = searchParams.get("apenasAtivos") !== "false";

  const produtos = await prisma.produto.findMany({
    where: {
      ...(apenasAtivos ? { ativo: true } : {}),
      ...(categoriaId ? { categoriaId } : {}),
      ...(busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" } },
              { sku: { contains: busca, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { categoria: true, fornecedor: true, imagens: { orderBy: { ordem: "asc" } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(produtos.map(serializarProduto));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = produtoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const dados = parsed.data;

  const skuExistente = await prisma.produto.findUnique({ where: { sku: dados.sku } });
  if (skuExistente) {
    return NextResponse.json({ erro: "Já existe um produto com esse SKU." }, { status: 409 });
  }

  const produto = await prisma.produto.create({
    data: {
      nome: dados.nome,
      sku: dados.sku,
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
      ...(dados.estoqueAtual > 0
        ? {
            movimentacoes: {
              create: {
                tipo: "ENTRADA",
                quantidade: dados.estoqueAtual,
                motivo: "Estoque inicial (cadastro do produto)",
              },
            },
          }
        : {}),
    },
    include: { categoria: true, fornecedor: true, imagens: true },
  });

  return NextResponse.json(serializarProduto(produto), { status: 201 });
}
