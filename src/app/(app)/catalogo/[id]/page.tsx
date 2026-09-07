import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatarMoeda } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default async function DetalheCatalogoPage({ params }: PageProps<"/catalogo/[id]">) {
  const { id } = await params;

  const produto = await prisma.produto.findUnique({
    where: { id },
    include: { categoria: true, imagens: { orderBy: { ordem: "asc" } } },
  });

  if (!produto) {
    notFound();
  }

  return (
    <div>
      <Link href="/catalogo" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Voltar ao catálogo
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
            {produto.imagens[0] ? (
              <Image src={produto.imagens[0].url} alt={produto.nome} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-10" />
              </div>
            )}
          </div>
          {produto.imagens.length > 1 && (
            <div className="flex gap-2">
              {produto.imagens.slice(1).map((img) => (
                <div key={img.id} className="relative size-16 overflow-hidden rounded-lg border border-border bg-secondary">
                  <Image src={img.url} alt="" fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Badge variant="secondary">{produto.categoria.nome}</Badge>
          <h1 className="mt-3 font-serif text-3xl text-foreground">{produto.nome}</h1>
          <p className="mt-2 font-serif text-3xl text-primary">{formatarMoeda(Number(produto.precoVenda))}</p>

          {produto.descricao && <p className="mt-4 text-muted-foreground">{produto.descricao}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border p-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Unidade</dt>
              <dd className="font-medium text-foreground">{produto.unidade}</dd>
            </div>
            {produto.potenciaW && (
              <div>
                <dt className="text-muted-foreground">Potência</dt>
                <dd className="font-medium text-foreground">{produto.potenciaW}W</dd>
              </div>
            )}
            {produto.temperaturaCor && (
              <div>
                <dt className="text-muted-foreground">Temperatura de cor</dt>
                <dd className="font-medium text-foreground">{produto.temperaturaCor}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="font-medium text-foreground">{produto.sku}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
