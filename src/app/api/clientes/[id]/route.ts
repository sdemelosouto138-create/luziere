import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clienteSchema } from "@/lib/validations/cliente";

export async function GET(_request: Request, { params }: RouteContext<"/api/clientes/[id]">) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id } });

  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  return NextResponse.json(cliente);
}

export async function PUT(request: Request, { params }: RouteContext<"/api/clientes/[id]">) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = clienteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const dados = parsed.data;
  const cliente = await prisma.cliente.update({
    where: { id },
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

  return NextResponse.json(cliente);
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/clientes/[id]">) {
  const { id } = await params;

  const temPedidos = await prisma.pedido.findFirst({ where: { clienteId: id } });
  if (temPedidos) {
    return NextResponse.json(
      { erro: "Este cliente possui pedidos/orçamentos e não pode ser excluído." },
      { status: 409 },
    );
  }

  await prisma.cliente.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
