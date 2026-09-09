import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fornecedorSchema } from "@/lib/validations/fornecedor";

export async function GET(_request: Request, { params }: RouteContext<"/api/fornecedores/[id]">) {
  const { id } = await params;
  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id },
    include: { _count: { select: { produtos: true } } },
  });

  if (!fornecedor) {
    return NextResponse.json({ erro: "Fornecedor não encontrado." }, { status: 404 });
  }

  return NextResponse.json(fornecedor);
}

export async function PUT(request: Request, { params }: RouteContext<"/api/fornecedores/[id]">) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = fornecedorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const d = parsed.data;
  const fornecedor = await prisma.fornecedor.update({
    where: { id },
    data: {
      nome: d.nome,
      cnpj: d.cnpj || null,
      telefone: d.telefone || null,
      email: d.email || null,
      contato: d.contato || null,
      site: d.site || null,
      cep: d.cep || null,
      rua: d.rua || null,
      numero: d.numero || null,
      bairro: d.bairro || null,
      cidade: d.cidade || null,
      uf: d.uf || null,
      observacoes: d.observacoes || null,
    },
  });

  return NextResponse.json(fornecedor);
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/fornecedores/[id]">) {
  const { id } = await params;

  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id },
    include: { _count: { select: { produtos: true } } },
  });
  if (!fornecedor) {
    return NextResponse.json({ erro: "Fornecedor não encontrado." }, { status: 404 });
  }

  // Os produtos vinculados ficam sem fornecedor (onDelete: SetNull no schema).
  await prisma.fornecedor.delete({ where: { id } });
  return NextResponse.json({ ok: true, produtosDesvinculados: fornecedor._count.produtos });
}
