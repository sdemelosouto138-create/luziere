import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clienteSchema } from "@/lib/validations/cliente";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca")?.trim();

  const clientes = await prisma.cliente.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            { telefone: { contains: busca, mode: "insensitive" } },
            { email: { contains: busca, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = clienteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const dados = parsed.data;
  const cliente = await prisma.cliente.create({
    data: {
      nome: dados.nome,
      telefone: dados.telefone || null,
      email: dados.email || null,
      cpfCnpj: dados.cpfCnpj || null,
      cep: dados.cep || null,
      rua: dados.rua || null,
      numero: dados.numero || null,
      bairro: dados.bairro || null,
      cidade: dados.cidade || null,
      uf: dados.uf || null,
      observacoes: dados.observacoes || null,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
