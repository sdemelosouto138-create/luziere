import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categorias = await prisma.categoria.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(categorias);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const nome = body?.nome?.trim();

  if (!nome) {
    return NextResponse.json({ erro: "Informe o nome da categoria." }, { status: 400 });
  }

  const existente = await prisma.categoria.findUnique({ where: { nome } });
  if (existente) {
    return NextResponse.json(existente);
  }

  const categoria = await prisma.categoria.create({ data: { nome } });
  return NextResponse.json(categoria, { status: 201 });
}
