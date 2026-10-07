import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compraSchema } from "@/lib/validations/compra";

/** Histórico de compras avulsas, da mais recente para a mais antiga. */
export async function GET() {
  const compras = await prisma.compra.findMany({
    include: {
      itens: {
        orderBy: { ordem: "asc" },
        include: { produto: { select: { id: true, nome: true, sku: true, unidade: true } } },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(
    compras.map((compra) => ({
      ...compra,
      itens: compra.itens.map((item) => ({ ...item, custoUnitario: Number(item.custoUnitario) })),
      custoTotal: compra.itens.reduce((soma, i) => soma + i.quantidade * Number(i.custoUnitario), 0),
    })),
  );
}

/** Registra uma compra avulsa. Não mexe em estoque: é documento de compra, não entrada. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = compraSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const dados = parsed.data;

  // O nome fica gravado junto para o histórico sobreviver à exclusão do fornecedor.
  let fornecedorNome = "Sem fornecedor";
  if (dados.fornecedorId) {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id: dados.fornecedorId },
      select: { nome: true },
    });
    if (!fornecedor) {
      return NextResponse.json({ erro: "Fornecedor não encontrado." }, { status: 404 });
    }
    fornecedorNome = fornecedor.nome;
  }

  const compra = await prisma.compra.create({
    data: {
      fornecedorId: dados.fornecedorId ?? null,
      fornecedorNome,
      observacoes: dados.observacoes || null,
      itens: {
        create: dados.itens.map((item, ordem) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          custoUnitario: item.custoUnitario,
          ordem,
        })),
      },
    },
    include: { itens: { include: { produto: true }, orderBy: { ordem: "asc" } } },
  });

  return NextResponse.json({ id: compra.id, numero: compra.numero }, { status: 201 });
}
