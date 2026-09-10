import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { agruparComprasPorFornecedor } from "@/lib/compras";
import { CompraPdf } from "@/components/pdf/compra-pdf";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // "pedidos" limita a quais pedidos entram; sem ele, usa todos os aprovados a comprar.
  const idsInformados = searchParams.get("pedidos")?.split(",").filter(Boolean);
  const fornecedorId = searchParams.get("fornecedorId");

  const pedidos = await prisma.pedido.findMany({
    where: {
      status: "APROVADO",
      ...(idsInformados?.length ? { id: { in: idsInformados } } : { compraRealizada: false }),
    },
    include: {
      itens: {
        orderBy: { ordem: "asc" },
        include: {
          produto: {
            select: {
              id: true,
              nome: true,
              sku: true,
              unidade: true,
              precoCusto: true,
              fornecedor: { select: { id: true, nome: true } },
            },
          },
        },
      },
    },
    orderBy: { numero: "asc" },
  });

  if (pedidos.length === 0) {
    return NextResponse.json({ erro: "Nenhum pedido aprovado para comprar." }, { status: 404 });
  }

  let grupos = agruparComprasPorFornecedor(
    pedidos.map((pedido) => ({
      id: pedido.id,
      numero: pedido.numero,
      itens: pedido.itens.map((item) => ({
        quantidade: item.quantidade,
        produto: { ...item.produto, precoCusto: Number(item.produto.precoCusto) },
      })),
    })),
  );

  if (fornecedorId) {
    const alvo = fornecedorId === "sem-fornecedor" ? null : fornecedorId;
    grupos = grupos.filter((g) => g.fornecedorId === alvo);
    if (grupos.length === 0) {
      return NextResponse.json({ erro: "Nenhum item deste fornecedor." }, { status: 404 });
    }
  }

  // Só os pedidos que realmente têm item na lista filtrada.
  const produtosNaLista = new Set(grupos.flatMap((g) => g.itens.map((i) => i.produtoId)));
  const numerosDosPedidos = pedidos
    .filter((p) => p.itens.some((i) => produtosNaLista.has(i.produto.id)))
    .map((p) => p.numero);

  const buffer = await renderToBuffer(
    CompraPdf({
      dados: {
        grupos,
        geradoEm: new Date(),
        pedidos: numerosDosPedidos,
        loja: {
          nome: process.env.LOJA_NOME || "Luziére",
          telefone: process.env.LOJA_TELEFONE || "",
          email: process.env.LOJA_EMAIL || "",
          cnpj: process.env.LOJA_CNPJ || "",
        },
      },
    }),
  );

  const nomeArquivo = fornecedorId
    ? `compra-${grupos[0].fornecedorNome.toLowerCase().replace(/\s+/g, "-")}.pdf`
    : "compra-luziere.pdf";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomeArquivo}"`,
    },
  });
}
