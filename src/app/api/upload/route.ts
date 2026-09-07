import { NextResponse } from "next/server";
import { salvarImagem } from "@/lib/storage";

export async function POST(request: Request) {
  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (!arquivo.type.startsWith("image/")) {
    return NextResponse.json({ erro: "Envie apenas arquivos de imagem." }, { status: 400 });
  }

  const url = await salvarImagem(arquivo);
  return NextResponse.json({ url });
}
