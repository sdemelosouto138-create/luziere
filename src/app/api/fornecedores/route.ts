import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fornecedorSchema } from "@/lib/validations/fornecedor";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca")?.trim();

  const fornecedores = await prisma.fornecedor.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            { contato: { contains: busca, mode: "insensitive" } },
            { telefone: { contains: busca, mode: "insensitive" } },
            { email: { contains: busca, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { _count: { select: { produtos: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(fornecedores);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = fornecedorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const d = parsed.data;
  const fornecedor = await prisma.fornecedor.create({
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

  return NextResponse.json(fornecedor, { status: 201 });
}
