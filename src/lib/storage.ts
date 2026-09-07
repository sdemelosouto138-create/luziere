import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_SUBDIR = "uploads/produtos";

/**
 * Salva um arquivo enviado e retorna a URL pública.
 * Em produção (com BLOB_READ_WRITE_TOKEN configurado) usa o Vercel Blob.
 * Em desenvolvimento local, salva em public/uploads/produtos para não exigir
 * nenhuma conta/serviço externo.
 */
export async function salvarImagem(arquivo: File): Promise<string> {
  const extensao = arquivo.name.split(".").pop() || "jpg";
  const nomeArquivo = `${randomUUID()}.${extensao}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${UPLOAD_SUBDIR}/${nomeArquivo}`, arquivo, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const diretorio = path.join(process.cwd(), "public", UPLOAD_SUBDIR);
  await mkdir(diretorio, { recursive: true });
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(path.join(diretorio, nomeArquivo), bytes);
  return `/${UPLOAD_SUBDIR}/${nomeArquivo}`;
}
