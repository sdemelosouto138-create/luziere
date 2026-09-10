"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FileText, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatarData, formatarMoeda } from "@/lib/format";

type Nota = {
  id: string;
  numero: string | null;
  descricao: string | null;
  dataEmissao: string | null;
  valor: number | null;
  arquivoUrl: string;
  arquivoNome: string;
};

export function NotasFiscais({ fornecedorId }: { fornecedorId: string }) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [notaParaExcluir, setNotaParaExcluir] = useState<Nota | null>(null);

  // Campos do formulário de anexo.
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [numero, setNumero] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const response = await fetch(`/api/fornecedores/${fornecedorId}/notas`);
    setNotas(await response.json());
    setCarregando(false);
  }, [fornecedorId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setArquivo(null);
    setNumero("");
    setDataEmissao("");
    setValor("");
    setDescricao("");
    setMostrarFormulario(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!arquivo) {
      toast.error("Selecione o arquivo da nota.");
      return;
    }

    setSalvando(true);
    try {
      // 1. Envia o arquivo, 2. registra a nota apontando para ele.
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      formData.append("tipo", "documento");
      const upload = await fetch("/api/upload", { method: "POST", body: formData });
      const dadosUpload = await upload.json();
      if (!upload.ok) {
        toast.error(dadosUpload.erro ?? "Não foi possível enviar o arquivo.");
        return;
      }

      const response = await fetch(`/api/fornecedores/${fornecedorId}/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arquivoUrl: dadosUpload.url,
          arquivoNome: arquivo.name,
          numero,
          descricao,
          dataEmissao,
          valor: valor === "" ? null : Number(valor),
        }),
      });
      const dados = await response.json();
      if (!response.ok) {
        toast.error(dados.erro ?? "Não foi possível salvar a nota.");
        return;
      }

      toast.success("Nota anexada.");
      limparFormulario();
      carregar();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!notaParaExcluir) return;
    const response = await fetch(`/api/fornecedores/${fornecedorId}/notas/${notaParaExcluir.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      toast.success("Nota removida.");
      carregar();
    } else {
      toast.error("Não foi possível remover.");
    }
    setNotaParaExcluir(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-foreground">Notas fiscais ({notas.length})</h2>
        {!mostrarFormulario && (
          <Button type="button" variant="outline" size="sm" onClick={() => setMostrarFormulario(true)}>
            <Plus className="size-4" />
            Anexar nota
          </Button>
        )}
      </div>

      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-xl border border-border p-4">
          <div className="space-y-2">
            <Label htmlFor="arquivo-nota">Arquivo (PDF, XML ou foto)</Label>
            <Input
              id="arquivo-nota"
              type="file"
              accept=".pdf,.xml,image/*"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="numero-nota">Número</Label>
              <Input id="numero-nota" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-nota">Data de emissão</Label>
              <Input id="data-nota" type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor-nota">Valor (R$)</Label>
              <Input
                id="valor-nota"
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao-nota">Observação</Label>
            <Input
              id="descricao-nota"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: compra de perfis e fitas"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={salvando} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {salvando ? "Enviando..." : "Anexar"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={limparFormulario} disabled={salvando}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {carregando && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!carregando && notas.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma nota anexada a este fornecedor.</p>
        )}
        {notas.map((nota) => (
          <div key={nota.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <a
              href={nota.arquivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 hover:text-primary"
            >
              <p className="truncate text-sm font-medium">
                {nota.numero ? `NF ${nota.numero}` : nota.arquivoNome}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[
                  nota.dataEmissao ? formatarData(nota.dataEmissao) : null,
                  nota.valor !== null ? formatarMoeda(nota.valor) : null,
                  nota.descricao,
                ]
                  .filter(Boolean)
                  .join(" · ") || nota.arquivoNome}
              </p>
            </a>
            <Button type="button" variant="ghost" size="icon" onClick={() => setNotaParaExcluir(nota)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={Boolean(notaParaExcluir)} onOpenChange={(open) => !open && setNotaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover nota?</AlertDialogTitle>
            <AlertDialogDescription>
              A nota sai da lista do fornecedor. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
