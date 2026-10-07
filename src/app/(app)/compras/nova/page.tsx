"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Plus, Search, Trash2, Loader2 } from "lucide-react";
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

const SEM_FORNECEDOR = "__sem__";

type Produto = {
  id: string;
  nome: string;
  sku: string | null;
  unidade: string;
  precoCusto: number;
  categoria: { id: string; nome: string };
  fornecedor: { id: string; nome: string } | null;
};

type Categoria = { id: string; nome: string };
type Fornecedor = { id: string; nome: string };

type PedidoParaImportar = {
  id: string;
  numero: number;
  cliente: { nome: string };
  itens: { quantidade: number; produto: { id: string } }[];
};

type ItemSelecionado = {
  produtoId: string;
  nome: string;
  sku: string | null;
  unidade: string;
  quantidade: number;
  custoUnitario: number;
};

export default function NovaCompraPage() {
  const router = useRouter();

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [catalogo, setCatalogo] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pedidos, setPedidos] = useState<PedidoParaImportar[]>([]);

  // Vazio = o usuário ainda não escolheu; o valor efetivo é derivado abaixo.
  const [fornecedorEscolhido, setFornecedorEscolhido] = useState<string>("");
  const [itens, setItens] = useState<ItemSelecionado[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  // Por padrão só mostra o que é daquele fornecedor; dá para liberar o catálogo inteiro.
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/fornecedores").then((r) => r.json()).then(setFornecedores);
    fetch("/api/categorias").then((r) => r.json()).then(setCategorias);
    fetch("/api/produtos").then((r) => r.json()).then(setCatalogo);
    fetch("/api/compras?incluirComprados=true").then((r) => r.json()).then(setPedidos);
  }, []);

  // Sem escolha ainda, abre no primeiro fornecedor — abrir em "Sem fornecedor"
  // mostraria um catálogo praticamente vazio. Derivado, e não guardado em estado,
  // para não depender da ordem entre a resposta da API e a hidratação.
  const fornecedorId = fornecedorEscolhido || fornecedores[0]?.id || SEM_FORNECEDOR;

  const produtosVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return catalogo.filter((produto) => {
      const doFornecedor =
        mostrarTodos ||
        (fornecedorId === SEM_FORNECEDOR ? !produto.fornecedor : produto.fornecedor?.id === fornecedorId);
      const daCategoria = categoriaFiltro === "todas" || produto.categoria.id === categoriaFiltro;
      const bateBusca =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        (produto.sku ?? "").toLowerCase().includes(termo);
      return doFornecedor && daCategoria && bateBusca;
    });
  }, [catalogo, fornecedorId, categoriaFiltro, busca, mostrarTodos]);

  const quantidadePorProduto = useMemo(
    () => new Map(itens.map((i) => [i.produtoId, i.quantidade])),
    [itens],
  );

  const custoTotal = itens.reduce((soma, i) => soma + i.quantidade * i.custoUnitario, 0);
  const totalDePecas = itens.reduce((soma, i) => soma + i.quantidade, 0);

  function adicionarProduto(produto: Produto) {
    setItens((prev) => {
      const existente = prev.find((i) => i.produtoId === produto.id);
      if (existente) {
        return prev.map((i) => (i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [
        ...prev,
        {
          produtoId: produto.id,
          nome: produto.nome,
          sku: produto.sku,
          unidade: produto.unidade,
          quantidade: 1,
          custoUnitario: produto.precoCusto,
        },
      ];
    });
  }

  function atualizarItem(produtoId: string, campo: "quantidade" | "custoUnitario", valor: number) {
    setItens((prev) => prev.map((i) => (i.produtoId === produtoId ? { ...i, [campo]: valor } : i)));
  }

  function removerItem(produtoId: string) {
    setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));
  }

  /**
   * Traz os itens de um pedido, somando a quantidade por produto e já filtrando
   * pelo fornecedor escolhido. Depois é só apagar o que você não precisa
   * comprar — o pedido do cliente não é tocado.
   */
  function importarDoPedido(pedidoId: string) {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;

    const somado = new Map<string, number>();
    for (const item of pedido.itens) {
      somado.set(item.produto.id, (somado.get(item.produto.id) ?? 0) + item.quantidade);
    }

    const novosItens: ItemSelecionado[] = [];
    const paraSomar = new Map<string, number>();

    for (const [produtoId, quantidade] of somado) {
      const produto = catalogo.find((p) => p.id === produtoId);
      if (!produto) continue;

      const doFornecedor =
        fornecedorId === SEM_FORNECEDOR ? !produto.fornecedor : produto.fornecedor?.id === fornecedorId;
      if (!doFornecedor) continue;

      if (itens.some((i) => i.produtoId === produtoId)) {
        paraSomar.set(produtoId, quantidade);
      } else {
        novosItens.push({
          produtoId,
          nome: produto.nome,
          sku: produto.sku,
          unidade: produto.unidade,
          quantidade,
          custoUnitario: produto.precoCusto,
        });
      }
    }

    const trazidos = novosItens.length + paraSomar.size;
    if (trazidos === 0) {
      toast.error("Esse pedido não tem itens do fornecedor escolhido.");
      return;
    }

    setItens((prev) => [
      ...prev.map((i) =>
        paraSomar.has(i.produtoId) ? { ...i, quantidade: i.quantidade + (paraSomar.get(i.produtoId) ?? 0) } : i,
      ),
      ...novosItens,
    ]);

    toast.success(
      `${trazidos} ${trazidos === 1 ? "item trazido" : "itens trazidos"} do pedido #${pedido.numero}.`,
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um produto.");
      return;
    }

    setSalvando(true);
    try {
      const response = await fetch("/api/compras/avulsas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedorId: fornecedorId === SEM_FORNECEDOR ? null : fornecedorId,
          observacoes,
          itens: itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            custoUnitario: i.custoUnitario,
          })),
        }),
      });

      const dados = await response.json();
      if (!response.ok) {
        toast.error(dados.erro ?? "Não foi possível salvar a compra.");
        return;
      }

      toast.success(`Compra nº ${dados.numero} registrada.`);
      // Abre o PDF já pronto para mandar ao fornecedor.
      window.open(`/api/compras/avulsas/${dados.id}/pdf`, "_blank", "noopener,noreferrer");
      router.push("/compras");
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
        <Link href="/compras">
          <ArrowLeft className="size-4" />
          Voltar para Compras
        </Link>
      </Button>

      <h1 className="font-serif text-3xl text-foreground">Nova compra avulsa</h1>
      <p className="mt-1 text-muted-foreground">
        Monte uma compra do zero, escolhendo só o que precisa pedir ao fornecedor. Não altera nenhum pedido de
        cliente nem mexe no estoque.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Select
            value={fornecedorId}
            onValueChange={(valor) => {
              setFornecedorEscolhido(valor);
              setItens([]);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
              <SelectItem value={SEM_FORNECEDOR}>Sem fornecedor</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Trocar o fornecedor limpa os itens já escolhidos.</p>
        </div>

        <div className="space-y-2">
          <Label>Trazer itens de um pedido</Label>
          <Select value="" onValueChange={importarDoPedido}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha um pedido aprovado..." />
            </SelectTrigger>
            <SelectContent>
              {pedidos.length === 0 && (
                <SelectItem value="__vazio__" disabled>
                  Nenhum pedido aprovado
                </SelectItem>
              )}
              {pedidos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  #{p.numero} · {p.cliente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Carrega os itens daquele fornecedor; depois é só apagar o que você já comprou.
          </p>
        </div>
      </div>

      {/* Seletor de produtos: mesmo padrão da montagem do pedido. */}
      <div className="mt-8 rounded-xl border border-border p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant={mostrarTodos ? "default" : "outline"}
            onClick={() => setMostrarTodos((v) => !v)}
          >
            {mostrarTodos ? "Mostrando todos" : "Só deste fornecedor"}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoriaFiltro("todas")}
            className={
              categoriaFiltro === "todas"
                ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
                : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            }
          >
            Todas
          </button>
          {categorias.map((categoria) => (
            <button
              type="button"
              key={categoria.id}
              onClick={() => setCategoriaFiltro(categoria.id)}
              className={
                categoriaFiltro === categoria.id
                  ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              }
            >
              {categoria.nome}
            </button>
          ))}
        </div>

        <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
          {produtosVisiveis.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
              {catalogo.length === 0
                ? "Carregando produtos..."
                : "Nenhum produto deste fornecedor com esse filtro."}
            </p>
          )}
          {produtosVisiveis.map((produto) => {
            const jaAdicionado = quantidadePorProduto.get(produto.id);
            return (
              <button
                type="button"
                key={produto.id}
                onClick={() => adicionarProduto(produto)}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-left hover:border-primary"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{produto.nome}</p>
                  <p className="valor-sensivel truncate text-xs text-muted-foreground">
                    {produto.sku ?? "sem código"} · {formatarMoeda(produto.precoCusto)} / {produto.unidade}
                  </p>
                </div>
                {jaAdicionado ? (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {jaAdicionado}
                  </span>
                ) : (
                  <Plus className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="w-28">Qtd.</TableHead>
              <TableHead className="w-36">Custo unit.</TableHead>
              <TableHead className="w-32">Subtotal</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Nenhum produto escolhido ainda.
                </TableCell>
              </TableRow>
            )}
            {itens.map((item) => (
              <TableRow key={item.produtoId}>
                <TableCell>
                  <p className="font-medium">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.sku ?? "sem código"} · {item.unidade}
                  </p>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(item.produtoId, "quantidade", Number(e.target.value))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.custoUnitario}
                    onChange={(e) => atualizarItem(item.produtoId, "custoUnitario", Number(e.target.value))}
                  />
                </TableCell>
                <TableCell className="valor-sensivel tabular-nums">
                  {formatarMoeda(item.quantidade * item.custoUnitario)}
                </TableCell>
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

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações para o fornecedor</Label>
          <Textarea
            id="observacoes"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="ml-auto w-full max-w-xs space-y-3 rounded-xl border border-border p-4">
          <div className="valor-sensivel flex justify-between font-serif text-lg">
            <span>Custo estimado</span>
            <span className="tabular-nums text-primary">{formatarMoeda(custoTotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {itens.length} {itens.length === 1 ? "produto" : "produtos"} · {totalDePecas}{" "}
            {totalDePecas === 1 ? "peça" : "peças"}
          </p>
          <Button
            type="submit"
            disabled={salvando || itens.length === 0}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Salvar e gerar PDF
          </Button>
        </div>
      </div>
    </form>
  );
}
