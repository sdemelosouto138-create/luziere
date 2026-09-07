"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarMoeda } from "@/lib/format";

type Produto = {
  id: string;
  nome: string;
  precoVenda: number;
  categoria: { id: string; nome: string };
  imagens: { url: string }[];
};

type Categoria = { id: string; nome: string };

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState("todas");

  const carregar = useCallback(async () => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (categoriaId !== "todas") params.set("categoriaId", categoriaId);
    const response = await fetch(`/api/produtos?${params.toString()}`);
    setProdutos(await response.json());
  }, [busca, categoriaId]);

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategorias);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(carregar, 250);
    return () => clearTimeout(timeout);
  }, [carregar]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Catálogo</h1>
      <p className="mt-1 text-muted-foreground">
        Mostre ao cliente direto do celular ou tablet.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {produtos.map((produto) => (
          <Link
            key={produto.id}
            href={`/catalogo/${produto.id}`}
            className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-square bg-secondary">
              {produto.imagens[0] ? (
                <Image
                  src={produto.imagens[0].url}
                  alt={produto.nome}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-8" />
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {produto.categoria.nome}
              </p>
              <p className="mt-0.5 line-clamp-2 font-medium text-foreground">{produto.nome}</p>
              <p className="mt-1 font-serif text-lg text-primary">{formatarMoeda(produto.precoVenda)}</p>
            </div>
          </Link>
        ))}
      </div>

      {produtos.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">Nenhum produto encontrado.</p>
      )}
    </div>
  );
}
