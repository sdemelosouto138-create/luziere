import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Remove uma compra do histórico. Nada mais é afetado: a compra é só documento. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/compras/avulsas/[id]">) {
  const { id } = await params;

  const compra = await prisma.compra.findUnique({ where: { id }, select: { id: true } });
  if (!compra) {
    return NextResponse.json({ erro: "Compra não encontrada." }, { status: 404 });
  }

  await prisma.compra.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
