"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Pencil, Trash2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatarMoeda } from "@/lib/format";

type Produto = {
  id: string;
  nome: string;
  sku: string | null;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  categoria: { id: string; nome: string };
  imagens: { url: string }[];
};

type Categoria = { id: string; nome: string };

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("todas");
  const [carregando, setCarregando] = useState(true);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);

  const carregarProdutos = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (categoriaId !== "todas") params.set("categoriaId", categoriaId);
    const response = await fetch(`/api/produtos?${params.toString()}`);
    const data = await response.json();
    setProdutos(data);
    setCarregando(false);
  }, [busca, categoriaId]);

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategorias);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(carregarProdutos, 250);
    return () => clearTimeout(timeout);
  }, [carregarProdutos]);

  async function handleExcluir() {
    if (!produtoParaExcluir) return;
    const response = await fetch(`/api/produtos/${produtoParaExcluir.id}`, { method: "DELETE" });
    const data = await response.json();
    if (response.ok) {
      toast.success(data.desativado ? "Produto desativado (está em pedidos existentes)." : "Produto excluído.");
      carregarProdutos();
    } else {
      toast.error(data.erro ?? "Não foi possível excluir.");
    }
    setProdutoParaExcluir(null);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Produtos</h1>
          <p className="mt-1 text-muted-foreground">Catálogo de iluminação da Luzière.</p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/produtos/novo">
            <Plus className="size-4" />
            Novo produto
          </Link>
        </Button>
      </div>

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

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço de venda</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!carregando && produtos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
            {produtos.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell>
                  <div className="relative size-10 overflow-hidden rounded-md border border-border bg-secondary">
                    {produto.imagens[0] ? (
                      <Image src={produto.imagens[0].url} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-4" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{produto.nome}</TableCell>
                <TableCell>{produto.categoria.nome}</TableCell>
                <TableCell>{formatarMoeda(produto.precoVenda)}</TableCell>
                <TableCell>
                  {produto.estoqueAtual <= produto.estoqueMinimo ? (
                    <Badge variant="destructive">{produto.estoqueAtual} un.</Badge>
                  ) : (
                    <span>{produto.estoqueAtual} un.</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/produtos/${produto.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setProdutoParaExcluir(produto)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={Boolean(produtoParaExcluir)} onOpenChange={(open) => !open && setProdutoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{produtoParaExcluir?.nome}&quot;? Se ele já estiver em algum
              pedido, será apenas desativado em vez de excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
