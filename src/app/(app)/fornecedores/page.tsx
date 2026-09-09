"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type Fornecedor = {
  id: string;
  nome: string;
  contato: string | null;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  uf: string | null;
  _count: { produtos: number };
};

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<Fornecedor | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    const response = await fetch(`/api/fornecedores?${params.toString()}`);
    setFornecedores(await response.json());
    setCarregando(false);
  }, [busca]);

  useEffect(() => {
    const timeout = setTimeout(carregar, 250);
    return () => clearTimeout(timeout);
  }, [carregar]);

  async function handleExcluir() {
    if (!fornecedorParaExcluir) return;
    const response = await fetch(`/api/fornecedores/${fornecedorParaExcluir.id}`, { method: "DELETE" });
    const data = await response.json();
    if (response.ok) {
      toast.success(
        data.produtosDesvinculados > 0
          ? `Fornecedor excluído. ${data.produtosDesvinculados} produto(s) ficaram sem fornecedor.`
          : "Fornecedor excluído.",
      );
      carregar();
    } else {
      toast.error(data.erro ?? "Não foi possível excluir.");
    }
    setFornecedorParaExcluir(null);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Fornecedores</h1>
          <p className="mt-1 text-muted-foreground">Fornecedores dos produtos da Luzière.</p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/fornecedores/novo">
            <Plus className="size-4" />
            Novo fornecedor
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, contato, telefone ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Produtos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!carregando && fornecedores.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            )}
            {fornecedores.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell className="font-medium">
                  <Link href={`/fornecedores/${fornecedor.id}`} className="hover:text-primary">
                    {fornecedor.nome}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{fornecedor.contato ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{fornecedor.telefone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {fornecedor.cidade ? `${fornecedor.cidade}/${fornecedor.uf ?? ""}` : "—"}
                </TableCell>
                <TableCell className="tabular-nums">{fornecedor._count.produtos}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/fornecedores/${fornecedor.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setFornecedorParaExcluir(fornecedor)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={Boolean(fornecedorParaExcluir)}
        onOpenChange={(open) => !open && setFornecedorParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              {fornecedorParaExcluir && fornecedorParaExcluir._count.produtos > 0
                ? `"${fornecedorParaExcluir.nome}" está vinculado a ${fornecedorParaExcluir._count.produtos} produto(s). Eles não serão excluídos, apenas ficarão sem fornecedor.`
                : `Tem certeza que deseja excluir "${fornecedorParaExcluir?.nome}"?`}
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
