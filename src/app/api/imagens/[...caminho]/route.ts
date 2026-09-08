import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

/**
 * Serve imagens guardadas em um store Vercel Blob PRIVADO.
 * O arquivo é lido com o token do servidor e repassado ao navegador.
 * A rota fica atrás do login (proxy.ts), como o restante do sistema.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/imagens/[...caminho]">) {
  const { caminho } = await params;
  const pathname = caminho.join("/");

  if (!pathname.startsWith("uploads/")) {
    return NextResponse.json({ erro: "Caminho inválido." }, { status: 400 });
  }

  const resultado = await get(pathname, { access: "private" });
  if (!resultado || !resultado.stream) {
    return NextResponse.json({ erro: "Imagem não encontrada." }, { status: 404 });
  }

  return new NextResponse(resultado.stream, {
    headers: {
      "Content-Type": resultado.blob.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
