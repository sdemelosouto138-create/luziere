"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarDataHora } from "@/lib/format";
import { cn } from "@/lib/utils";

type Produto = {
  id: string;
  nome: string;
  sku: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  unidade: string;
  categoria: { nome: string };
};

type Movimentacao = {
  id: string;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE" | "VENDA" | "CANCELAMENTO";
  quantidade: number;
  motivo: string | null;
  criadoEm: string;
  produto: { nome: string; sku: string };
  pedido: { numero: number } | null;
};

const TIPO_LABEL: Record<Movimentacao["tipo"], { label: string; className: string }> = {
  ENTRADA: { label: "Entrada", className: "bg-emerald-600 text-white" },
  SAIDA: { label: "Saída", className: "bg-destructive text-destructive-foreground" },
  AJUSTE: { label: "Ajuste", className: "bg-secondary text-secondary-foreground" },
  VENDA: { label: "Venda", className: "bg-primary text-primary-foreground" },
  CANCELAMENTO: { label: "Cancelamento", className: "bg-accent text-accent-foreground" },
};

const MOTIVOS_SUGERIDOS = ["Compra", "Perda", "Inventário", "Devolução", "Avaria", "Outro"];

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [quantidade, setQuantidade] = useState("1");
  const [motivo, setMotivo] = useState("Compra");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    const [p, m] = await Promise.all([
      fetch("/api/produtos").then((r) => r.json()),
      fetch("/api/estoque/movimentacoes").then((r) => r.json()),
    ]);
    setProdutos(p);
    setMovimentacoes(m);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirAjuste(produto?: Produto) {
    setProdutoId(produto?.id ?? produtos[0]?.id ?? "");
    setTipo("ENTRADA");
    setQuantidade("1");
    setMotivo("Compra");
    setDialogAberto(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    try {
      const response = await fetch("/api/estoque/movimentacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId, tipo, quantidade: Number(quantidade), motivo }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.erro ?? "Não foi possível registrar a movimentação.");
        return;
      }
      toast.success("Movimentação registrada.");
      setDialogAberto(false);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  const abaixoDoMinimo = produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo).length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Estoque</h1>
          <p className="mt-1 text-muted-foreground">
            {abaixoDoMinimo > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="size-4" />
                {abaixoDoMinimo} {abaixoDoMinimo === 1 ? "produto está" : "produtos estão"} abaixo do estoque mínimo.
              </span>
            ) : (
              "Todos os produtos estão acima do estoque mínimo."
            )}
          </p>
        </div>
        <Button onClick={() => abrirAjuste()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Ajustar estoque
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Estoque atual</TableHead>
              <TableHead className="text-right">Estoque mínimo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((produto) => {
              const baixo = produto.estoqueAtual <= produto.estoqueMinimo;
              return (
                <TableRow key={produto.id} className={cn(baixo && "bg-destructive/5")}>
                  <TableCell>
                    <p className={cn("font-medium", baixo && "text-destructive")}>{produto.nome}</p>
                    <p className="text-xs text-muted-foreground">{produto.sku}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{produto.categoria.nome}</TableCell>
                  <TableCell className={cn("text-right font-medium", baixo && "text-destructive")}>
                    {produto.estoqueAtual} {produto.unidade}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {produto.estoqueMinimo} {produto.unidade}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => abrirAjuste(produto)}>
                      Ajustar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <h2 className="mt-10 font-serif text-xl text-foreground">Histórico de movimentações</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Pedido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimentacoes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhuma movimentação registrada.
                </TableCell>
              </TableRow>
            )}
            {movimentacoes.map((mov) => {
              const config = TIPO_LABEL[mov.tipo];
              const entrada = mov.tipo === "ENTRADA" || mov.tipo === "CANCELAMENTO";
              return (
                <TableRow key={mov.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatarDataHora(mov.criadoEm)}</TableCell>
                  <TableCell>
                    <Badge className={config.className}>{config.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{mov.produto.nome}</p>
                    <p className="text-xs text-muted-foreground">{mov.produto.sku}</p>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={cn("inline-flex items-center gap-1", entrada ? "text-emerald-600" : "text-destructive")}>
                      {entrada ? <ArrowDownToLine className="size-3.5" /> : <ArrowUpFromLine className="size-3.5" />}
                      {entrada ? "+" : "-"}
                      {mov.quantidade}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{mov.motivo ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{mov.pedido ? `#${mov.pedido.numero}` : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Ajuste manual de estoque</DialogTitle>
              <DialogDescription>Registre uma entrada ou saída com o motivo.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={produtoId} onValueChange={setProdutoId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} ({p.estoqueAtual} {p.unidade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as "ENTRADA" | "SAIDA")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRADA">Entrada</SelectItem>
                      <SelectItem value="SAIDA">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Input id="motivo" list="motivos" value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
                <datalist id="motivos">
                  {MOTIVOS_SUGERIDOS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {salvando ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
