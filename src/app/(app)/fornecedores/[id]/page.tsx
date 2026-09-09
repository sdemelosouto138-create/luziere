import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda } from "@/lib/format";

export default async function FichaFornecedorPage({ params }: PageProps<"/fornecedores/[id]">) {
  const { id } = await params;

  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id },
    include: {
      produtos: {
        where: { ativo: true },
        include: { categoria: true },
        orderBy: { nome: "asc" },
      },
    },
  });

  if (!fornecedor) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">{fornecedor.nome}</h1>
      <p className="mt-1 text-muted-foreground">Ficha do fornecedor.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <FornecedorForm
          fornecedor={{
            id: fornecedor.id,
            nome: fornecedor.nome,
            cnpj: fornecedor.cnpj,
            telefone: fornecedor.telefone,
            email: fornecedor.email,
            contato: fornecedor.contato,
            site: fornecedor.site,
            cep: fornecedor.cep,
            rua: fornecedor.rua,
            numero: fornecedor.numero,
            bairro: fornecedor.bairro,
            cidade: fornecedor.cidade,
            uf: fornecedor.uf,
            observacoes: fornecedor.observacoes,
          }}
        />

        <div>
          <h2 className="font-serif text-xl text-foreground">
            Produtos deste fornecedor ({fornecedor.produtos.length})
          </h2>
          <div className="mt-4 space-y-2">
            {fornecedor.produtos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum produto vinculado a este fornecedor.</p>
            )}
            {fornecedor.produtos.map((produto) => (
              <Link
                key={produto.id}
                href={`/produtos/${produto.id}`}
                className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-secondary/50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{produto.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {produto.sku ? `${produto.sku} · ` : ""}
                    {produto.categoria.nome}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-sm tabular-nums">{formatarMoeda(Number(produto.precoVenda))}</span>
                  {produto.estoqueAtual <= produto.estoqueMinimo && (
                    <Badge variant="destructive">{produto.estoqueAtual} un.</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
