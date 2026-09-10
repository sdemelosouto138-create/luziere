import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/fornecedores/[id]/notas/[notaId]">,
) {
  const { id, notaId } = await params;

  const nota = await prisma.notaFiscal.findUnique({ where: { id: notaId } });
  if (!nota || nota.fornecedorId !== id) {
    return NextResponse.json({ erro: "Nota não encontrada." }, { status: 404 });
  }

  // O registro sai da lista; o arquivo em si continua no armazenamento.
  await prisma.notaFiscal.delete({ where: { id: notaId } });
  return NextResponse.json({ ok: true });
}
