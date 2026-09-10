import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** Pastas usadas dentro de "uploads". */
export const PASTA_PRODUTOS = "uploads/produtos";
export const PASTA_NOTAS = "uploads/notas";

/** Prefixo das URLs servidas pelo próprio app quando o store Blob é privado. */
export const PREFIXO_ARQUIVOS_PRIVADOS = "/api/imagens/";

/**
 * Salva um arquivo enviado e retorna a URL para acessá-lo.
 * Em produção (com BLOB_READ_WRITE_TOKEN configurado) usa o Vercel Blob:
 *  - store público  → retorna a URL direta do Blob;
 *  - store privado  → salva como privado e retorna /api/imagens/<caminho>, rota
 *    do próprio app que lê o arquivo com o token (ver src/app/api/imagens).
 * Em desenvolvimento local, salva dentro de public/uploads.
 */
export async function salvarArquivo(arquivo: File, pasta: string = PASTA_PRODUTOS): Promise<string> {
  const extensao = arquivo.name.split(".").pop() || "bin";
  const nomeArquivo = `${randomUUID()}.${extensao}`;
  const caminho = `${pasta}/${nomeArquivo}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    try {
      const blob = await put(caminho, arquivo, { access: "public" });
      return blob.url;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      if (!/private/i.test(mensagem)) throw erro;
      // Store configurado como privado: guarda como privado e serve pelo app.
      await put(caminho, arquivo, { access: "private", addRandomSuffix: false });
      return `${PREFIXO_ARQUIVOS_PRIVADOS}${caminho}`;
    }
  }

  if (process.env.VERCEL) {
    // Na Vercel o sistema de arquivos é somente leitura: sem o Blob não há onde salvar.
    const definidaMasVazia = "BLOB_READ_WRITE_TOKEN" in process.env;
    throw new Error(
      definidaMasVazia
        ? "A variável BLOB_READ_WRITE_TOKEN existe na Vercel mas está VAZIA. Edite-a em Settings → Environment Variables, cole o token do store Blob (começa com vercel_blob_rw_) e faça um Redeploy."
        : "Armazenamento de arquivos não configurado: crie um store Vercel Blob, conecte ao projeto (variável BLOB_READ_WRITE_TOKEN) e faça um Redeploy.",
    );
  }

  const diretorio = path.join(process.cwd(), "public", pasta);
  await mkdir(diretorio, { recursive: true });
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(path.join(diretorio, nomeArquivo), bytes);
  return `/${caminho}`;
}

/** Compatibilidade: upload de imagem de produto. */
export async function salvarImagem(arquivo: File): Promise<string> {
  return salvarArquivo(arquivo, PASTA_PRODUTOS);
}
