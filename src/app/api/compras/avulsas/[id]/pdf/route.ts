import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { CompraPdf } from "@/components/pdf/compra-pdf";
import { paraNomeDeArquivo } from "@/lib/format";

export async function GET(_request: Request, { params }: RouteContext<"/api/compras/avulsas/[id]/pdf">) {
  const { id } = await params;

  const compra = await prisma.compra.findUnique({
    where: { id },
    include: {
      itens: {
        orderBy: { ordem: "asc" },
        include: { produto: { select: { id: true, nome: true, sku: true, unidade: true } } },
      },
    },
  });

  if (!compra) {
    return NextResponse.json({ erro: "Compra não encontrada." }, { status: 404 });
  }

  // Uma compra avulsa é sempre de um fornecedor só, então vira um grupo único.
  const itens = compra.itens.map((item) => ({
    produtoId: item.produtoId,
    nome: item.produto.nome,
    sku: item.produto.sku,
    unidade: item.produto.unidade,
    quantidade: item.quantidade,
    custoUnitario: Number(item.custoUnitario),
    pedidos: [] as number[],
  }));

  const grupo = {
    fornecedorId: compra.fornecedorId,
    fornecedorNome: compra.fornecedorNome,
    itens,
    custoEstimado: itens.reduce((soma, i) => soma + i.quantidade * i.custoUnitario, 0),
  };

  const buffer = await renderToBuffer(
    CompraPdf({
      dados: {
        grupos: [grupo],
        geradoEm: compra.criadoEm,
        pedidos: [],
        referencia: `Compra nº ${compra.numero}`,
        loja: {
          nome: process.env.LOJA_NOME || "Luziére",
          telefone: process.env.LOJA_TELEFONE || "",
          email: process.env.LOJA_EMAIL || "",
          cnpj: process.env.LOJA_CNPJ || "",
        },
      },
    }),
  );

  const nomeFornecedor = paraNomeDeArquivo(compra.fornecedorNome);
  const nomeArquivo = `Compra_Luziere_${nomeFornecedor || "sem_fornecedor"}_${compra.numero}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomeArquivo}"`,
    },
  });
}
