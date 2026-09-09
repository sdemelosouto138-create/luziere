"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Trash2, Plus, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarMoeda } from "@/lib/format";
import { calcularSubtotalItens, calcularValorDesconto } from "@/lib/pedido";
import { cn } from "@/lib/utils";

type Cliente = { id: string; nome: string };
type Categoria = { id: string; nome: string };
type Produto = {
  id: string;
  nome: string;
  sku: string | null;
  precoVenda: number;
  estoqueAtual: number;
  categoria: { id: string; nome: string };
  imagens: { url: string }[];
};

type ItemLinha = {
  produtoId: string;
  nome: string;
  sku: string | null;
  quantidade: number;
  precoUnitario: number;
};

type PedidoExistente = {
  id: string;
  clienteId: string;
  desconto: number;
  descontoTipo: "VALOR" | "PERCENTUAL";
  frete: number;
  prazoEntrega: string | null;
  condicaoPagamento: string | null;
  observacoes: string | null;
  validadeDias: number;
  itens: { produtoId: string; produto: { nome: string; sku: string | null }; quantidade: number; precoUnitario: number }[];
};

export function PedidoForm({ pedido }: { pedido?: PedidoExistente }) {
  const router = useRouter();
  const emEdicao = Boolean(pedido);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState(pedido?.clienteId ?? "");
  const [itens, setItens] = useState<ItemLinha[]>(
    pedido?.itens.map((i) => ({
      produtoId: i.produtoId,
      nome: i.produto.nome,
      sku: i.produto.sku,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
    })) ?? [],
  );
  const [desconto, setDesconto] = useState(pedido?.desconto?.toString() ?? "0");
  const [descontoTipo, setDescontoTipo] = useState<"VALOR" | "PERCENTUAL">(pedido?.descontoTipo ?? "VALOR");
  const [frete, setFrete] = useState(pedido?.frete?.toString() ?? "0");
  const [prazoEntrega, setPrazoEntrega] = useState(pedido?.prazoEntrega ?? "");
  const [condicaoPagamento, setCondicaoPagamento] = useState(pedido?.condicaoPagamento ?? "");
  const [observacoes, setObservacoes] = useState(pedido?.observacoes ?? "");
  const [validadeDias, setValidadeDias] = useState(pedido?.validadeDias?.toString() ?? "7");

  // Catálogo carregado uma vez: permite filtrar por categoria e buscar sem esperar o servidor.
  const [catalogo, setCatalogo] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [buscaProduto, setBuscaProduto] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then(setClientes);
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategorias);
    fetch("/api/produtos")
      .then((r) => r.json())
      .then(setCatalogo);
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    return catalogo.filter((produto) => {
      const daCategoria = categoriaFiltro === "todas" || produto.categoria.id === categoriaFiltro;
      const combinaBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        (produto.sku ?? "").toLowerCase().includes(termo);
      return daCategoria && combinaBusca;
    });
  }, [catalogo, categoriaFiltro, buscaProduto]);

  const quantidadePorProduto = useMemo(
    () => new Map(itens.map((i) => [i.produtoId, i.quantidade])),
    [itens],
  );

  function adicionarItem(produto: Produto) {
    setItens((prev) => {
      const existente = prev.find((i) => i.produtoId === produto.id);
      if (existente) {
        return prev.map((i) => (i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [
        ...prev,
        { produtoId: produto.id, nome: produto.nome, sku: produto.sku, quantidade: 1, precoUnitario: produto.precoVenda },
      ];
    });
  }

  function atualizarItem(produtoId: string, campo: "quantidade" | "precoUnitario", valor: number) {
    setItens((prev) => prev.map((i) => (i.produtoId === produtoId ? { ...i, [campo]: valor } : i)));
  }

  function removerItem(produtoId: string) {
    setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));
  }

  const subtotalItens = useMemo(
    () => calcularSubtotalItens(itens.map((i) => ({ subtotal: i.quantidade * i.precoUnitario }))),
    [itens],
  );
  const valorDesconto = useMemo(
    () => calcularValorDesconto(subtotalItens, Number(desconto) || 0, descontoTipo),
    [subtotalItens, desconto, descontoTipo],
  );
  const total = subtotalItens - valorDesconto + (Number(frete) || 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (!clienteId) {
      setErro("Selecione um cliente.");
      return;
    }
    if (itens.length === 0) {
      setErro("Adicione pelo menos um item ao pedido.");
      return;
    }

    setSalvando(true);
    const payload = {
      clienteId,
      itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade, precoUnitario: i.precoUnitario })),
      desconto: Number(desconto) || 0,
      descontoTipo,
      frete: Number(frete) || 0,
      prazoEntrega: prazoEntrega || null,
      condicaoPagamento: condicaoPagamento || null,
      observacoes: observacoes || null,
      validadeDias: Number(validadeDias) || 7,
    };

    try {
      const url = emEdicao ? `/api/pedidos/${pedido!.id}` : "/api/pedidos";
      const response = await fetch(url, {
        method: emEdicao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro ?? "Não foi possível salvar o pedido.");
        return;
      }

      toast.success(emEdicao ? "Orçamento atualizado." : "Orçamento criado.");
      router.push(`/pedidos/${data.id}`);
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="validade">Validade do orçamento (dias)</Label>
          <Input
            id="validade"
            type="number"
            min="1"
            value={validadeDias}
            onChange={(e) => setValidadeDias(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Itens</Label>
        {/* Seletor de produtos: filtra por categoria e/ou nome, sem precisar decorar nomes. */}
        <div className="rounded-xl border border-border">
          <div className="space-y-3 border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome ou código..."
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <button
                type="button"
                onClick={() => setCategoriaFiltro("todas")}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
                  categoriaFiltro === "todas"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                Todos
              </button>
              {categorias.map((categoria) => (
                <button
                  type="button"
                  key={categoria.id}
                  onClick={() => setCategoriaFiltro(categoria.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    categoriaFiltro === categoria.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {categoria.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {produtosFiltrados.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {catalogo.length === 0 ? "Carregando produtos..." : "Nenhum produto nesta categoria."}
              </p>
            )}
            {produtosFiltrados.map((produto) => {
              const jaAdicionado = quantidadePorProduto.get(produto.id);
              return (
                <button
                  type="button"
                  key={produto.id}
                  onClick={() => adicionarItem(produto)}
                  className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-secondary/60"
                >
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                    {produto.imagens[0] ? (
                      <Image src={produto.imagens[0].url} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{produto.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {produto.sku ? `${produto.sku} · ` : ""}
                      {produto.categoria.nome} · {produto.estoqueAtual} un. em estoque
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm tabular-nums">{formatarMoeda(produto.precoVenda)}</span>
                    {jaAdicionado ? (
                      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                        {jaAdicionado}
                      </span>
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground">
                        <Plus className="size-4" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-24">Qtd.</TableHead>
                <TableHead className="w-32">Preço unit.</TableHead>
                <TableHead className="w-32">Subtotal</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nenhum item adicionado.
                  </TableCell>
                </TableRow>
              )}
              {itens.map((item) => (
                <TableRow key={item.produtoId}>
                  <TableCell>
                    <p className="font-medium">{item.nome}</p>
                    {item.sku && <p className="text-xs text-muted-foreground">{item.sku}</p>}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(item.produtoId, "quantidade", Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.precoUnitario}
                      onChange={(e) => atualizarItem(item.produtoId, "precoUnitario", Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>{formatarMoeda(item.quantidade * item.precoUnitario)}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removerItem(item.produtoId)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="desconto">Desconto</Label>
          <div className="flex gap-2">
            <Input
              id="desconto"
              type="number"
              step="0.01"
              min="0"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
            />
            <Select value={descontoTipo} onValueChange={(v) => setDescontoTipo(v as "VALOR" | "PERCENTUAL")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VALOR">R$</SelectItem>
                <SelectItem value="PERCENTUAL">%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frete">Frete (R$)</Label>
          <Input id="frete" type="number" step="0.01" min="0" value={frete} onChange={(e) => setFrete(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prazoEntrega">Prazo de entrega</Label>
          <Input
            id="prazoEntrega"
            value={prazoEntrega ?? ""}
            onChange={(e) => setPrazoEntrega(e.target.value)}
            placeholder="Ex: 7 dias úteis"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condicaoPagamento">Condição de pagamento</Label>
          <Input
            id="condicaoPagamento"
            value={condicaoPagamento ?? ""}
            onChange={(e) => setCondicaoPagamento(e.target.value)}
            placeholder="Ex: 50% na aprovação, 50% na entrega"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea id="observacoes" value={observacoes ?? ""} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
        </div>
      </div>

      <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-xl border border-border p-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatarMoeda(subtotalItens)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Desconto</span>
          <span>- {formatarMoeda(valorDesconto)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Frete</span>
          <span>{formatarMoeda(Number(frete) || 0)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5 font-serif text-lg text-foreground">
          <span>Total</span>
          <span className="text-primary">{formatarMoeda(total)}</span>
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={salvando} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Criar orçamento"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/pedidos")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
