import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProdutoForm } from "@/components/produtos/produto-form";

export default async function EditarProdutoPage({ params }: PageProps<"/produtos/[id]">) {
  const { id } = await params;

  const [produto, categorias] = await Promise.all([
    prisma.produto.findUnique({
      where: { id },
      include: { imagens: { orderBy: { ordem: "asc" } } },
    }),
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
  ]);

  if (!produto) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Editar produto</h1>
      <p className="mt-1 text-muted-foreground">{produto.nome}</p>

      <div className="mt-8">
        <ProdutoForm
          categoriasIniciais={categorias}
          produto={{
            id: produto.id,
            nome: produto.nome,
            sku: produto.sku,
            descricao: produto.descricao,
            categoriaId: produto.categoriaId,
            precoCusto: Number(produto.precoCusto),
            precoVenda: Number(produto.precoVenda),
            unidade: produto.unidade,
            potenciaW: produto.potenciaW,
            temperaturaCor: produto.temperaturaCor,
            estoqueAtual: produto.estoqueAtual,
            estoqueMinimo: produto.estoqueMinimo,
            fornecedor: produto.fornecedor,
            imagens: produto.imagens,
          }}
        />
      </div>
    </div>
  );
}
