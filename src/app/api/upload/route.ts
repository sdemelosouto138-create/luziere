import { NextResponse } from "next/server";
import { PASTA_NOTAS, PASTA_PRODUTOS, salvarArquivo } from "@/lib/storage";

/** Diagnóstico: informa se o armazenamento de arquivos está configurado (sem expor segredos). */
export async function GET() {
  return NextResponse.json({
    vercel: Boolean(process.env.VERCEL),
    blobConfigurado: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    variaveisBlob: Object.keys(process.env).filter((k) => k.includes("BLOB")),
  });
}

const TIPOS_DOCUMENTO = ["application/pdf", "text/xml", "application/xml"];

export async function POST(request: Request) {
  const formData = await request.formData();
  const arquivo = formData.get("arquivo");
  // "documento" aceita PDF/XML além de imagens (usado nas notas fiscais).
  const tipo = formData.get("tipo") === "documento" ? "documento" : "imagem";

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const ehImagem = arquivo.type.startsWith("image/");
  const ehDocumento = TIPOS_DOCUMENTO.includes(arquivo.type) || arquivo.name.toLowerCase().endsWith(".xml");

  if (tipo === "imagem" && !ehImagem) {
    return NextResponse.json({ erro: "Envie apenas arquivos de imagem." }, { status: 400 });
  }
  if (tipo === "documento" && !ehImagem && !ehDocumento) {
    return NextResponse.json({ erro: "Envie um PDF, XML ou imagem." }, { status: 400 });
  }

  try {
    const url = await salvarArquivo(arquivo, tipo === "documento" ? PASTA_NOTAS : PASTA_PRODUTOS);
    return NextResponse.json({ url, nome: arquivo.name });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha ao salvar o arquivo.";
    console.error("[upload]", erro);
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
