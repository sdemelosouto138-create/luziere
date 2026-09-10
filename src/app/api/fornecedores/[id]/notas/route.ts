import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const notaSchema = z.object({
  arquivoUrl: z.string().min(1, "Envie o arquivo da nota."),
  arquivoNome: z.string().min(1),
  numero: z.string().trim().optional().nullable(),
  descricao: z.string().trim().optional().nullable(),
  dataEmissao: z.string().trim().optional().nullable(),
  valor: z.coerce.number().min(0).optional().nullable(),
});

/** Converte o campo Decimal para number, para uso no front-end. */
function serializar(nota: { valor: unknown }) {
  return { ...nota, valor: nota.valor === null ? null : Number(nota.valor) };
}

export async function GET(_request: Request, { params }: RouteContext<"/api/fornecedores/[id]/notas">) {
  const { id } = await params;
  const notas = await prisma.notaFiscal.findMany({
    where: { fornecedorId: id },
    orderBy: [{ dataEmissao: "desc" }, { criadoEm: "desc" }],
  });
  return NextResponse.json(notas.map(serializar));
}

export async function POST(request: Request, { params }: RouteContext<"/api/fornecedores/[id]/notas">) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = notaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const fornecedor = await prisma.fornecedor.findUnique({ where: { id } });
  if (!fornecedor) {
    return NextResponse.json({ erro: "Fornecedor não encontrado." }, { status: 404 });
  }

  const d = parsed.data;
  const nota = await prisma.notaFiscal.create({
    data: {
      fornecedorId: id,
      arquivoUrl: d.arquivoUrl,
      arquivoNome: d.arquivoNome,
      numero: d.numero || null,
      descricao: d.descricao || null,
      // A data chega como "aaaa-mm-dd" do input; o meio-dia evita virar o dia por fuso.
      dataEmissao: d.dataEmissao ? new Date(`${d.dataEmissao}T12:00:00`) : null,
      valor: d.valor ?? null,
    },
  });

  return NextResponse.json(serializar(nota), { status: 201 });
}
