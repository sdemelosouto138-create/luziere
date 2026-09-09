import { prisma } from "@/lib/prisma";
import { ProdutoForm } from "@/components/produtos/produto-form";

export default async function NovoProdutoPage() {
  const [categorias, fornecedores] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.fornecedor.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Novo produto</h1>
      <p className="mt-1 text-muted-foreground">Cadastre um novo item no catálogo Luzière.</p>

      <div className="mt-8">
        <ProdutoForm categoriasIniciais={categorias} fornecedoresIniciais={fornecedores} />
      </div>
    </div>
  );
}
