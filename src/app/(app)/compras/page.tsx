"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Download, FileText, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarData, formatarMoeda } from "@/lib/format";
import { agruparComprasPorFornecedor, type PedidoParaCompra } from "@/lib/compras";

/** Uma compra avulsa já registrada, como vem de /api/compras/avulsas. */
type CompraAvulsa = {
  id: string;
  numero: number;
  fornecedorNome: string;
  observacoes: string | null;
  criadoEm: string;
  custoTotal: number;
  itens: { id: string; quantidade: number }[];
};

type PedidoDaLista = PedidoParaCompra & {
  criadoEm: string;
  compraRealizada: boolean;
  cliente: { nome: string };
};

export default function ComprasPage() {
  const [pedidos, setPedidos] = useState<PedidoDaLista[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [marcando, setMarcando] = useState(false);
  const [avulsas, setAvulsas] = useState<CompraAvulsa[]>([]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [response, responseAvulsas] = await Promise.all([
      fetch("/api/compras"),
      fetch("/api/compras/avulsas"),
    ]);
    const dados: PedidoDaLista[] = await response.json();
    setPedidos(dados);
    setSelecionados(new Set(dados.map((p) => p.id)));
    setAvulsas(await responseAvulsas.json());
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pedidosSelecionados = useMemo(
    () => pedidos.filter((p) => selecionados.has(p.id)),
    [pedidos, selecionados],
  );

  const grupos = useMemo(() => agruparComprasPorFornecedor(pedidosSelecionados), [pedidosSelecionados]);
  const custoTotal = grupos.reduce((soma, g) => soma + g.custoEstimado, 0);
  const itensSemCodigo = grupos.flatMap((g) => g.itens).filter((i) => !i.sku).length;

  function alternarPedido(id: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const idsSelecionados = [...selecionados].join(",");

  async function excluirAvulsa(compra: CompraAvulsa) {
    if (!confirm(`Excluir a compra nº ${compra.numero} do histórico? Isso não desfaz nada além do registro.`)) {
      return;
    }
    const response = await fetch(`/api/compras/avulsas/${compra.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Não foi possível excluir a compra.");
      return;
    }
    toast.success("Compra removida do histórico.");
    carregar();
  }

  async function marcarComoComprados() {
    if (selecionados.size === 0) return;
    setMarcando(true);
    try {
      const response = await fetch("/api/compras", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoIds: [...selecionados], comprada: true }),
      });
      if (!response.ok) {
        toast.error("Não foi possível marcar os pedidos.");
        return;
      }
      toast.success("Pedidos marcados como comprados.");
      carregar();
    } finally {
      setMarcando(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Compras</h1>
          <p className="mt-1 text-muted-foreground">
            O que precisa ser comprado dos fornecedores para atender os pedidos aprovados.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/compras/nova">
            <Plus className="size-4" />
            Nova compra avulsa
          </Link>
        </Button>
      </div>

      {!carregando && pedidos.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum pedido aprovado aguardando compra.
          </CardContent>
        </Card>
      )}

      {pedidos.length > 0 && (
        <>
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg font-normal">
                Pedidos considerados ({pedidosSelecionados.length} de {pedidos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pedidos.map((pedido) => (
                <label
                  key={pedido.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
                >
                  <Checkbox
                    checked={selecionados.has(pedido.id)}
                    onCheckedChange={() => alternarPedido(pedido.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      #{pedido.numero} · {pedido.cliente.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Aprovado em {formatarData(pedido.criadoEm)}
                    </p>
                  </div>
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="shrink-0 text-xs text-muted-foreground hover:text-primary"
                  >
                    ver pedido
                  </Link>
                </label>
              ))}
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={`/api/compras/pdf?pedidos=${idsSelecionados}`} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                PDF de todos os fornecedores
              </a>
            </Button>
            <Button variant="outline" onClick={marcarComoComprados} disabled={marcando || selecionados.size === 0}>
              <Check className="size-4" />
              {marcando ? "Marcando..." : "Marcar como comprados"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Custo estimado: <span className="font-semibold text-foreground">{formatarMoeda(custoTotal)}</span>
            </span>
          </div>

          {itensSemCodigo > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {itensSemCodigo} {itensSemCodigo === 1 ? "produto está" : "produtos estão"} sem código. Cadastre o
              código para o fornecedor identificar sem erro.
            </p>
          )}

          <div className="mt-6 space-y-6">
            {grupos.map((grupo) => (
              <Card key={grupo.fornecedorId ?? "sem-fornecedor"}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-serif text-lg font-normal">{grupo.fornecedorNome}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {grupo.itens.length} {grupo.itens.length === 1 ? "item" : "itens"} · custo estimado{" "}
                      {formatarMoeda(grupo.custoEstimado)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/api/compras/pdf?pedidos=${idsSelecionados}&fornecedorId=${grupo.fornecedorId ?? "sem-fornecedor"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="size-4" />
                      PDF
                    </a>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-40">Código</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead className="w-28 text-right">Quantidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grupo.itens.map((item) => (
                          <TableRow key={item.produtoId}>
                            <TableCell>
                              {item.sku ? (
                                <span className="font-medium">{item.sku}</span>
                              ) : (
                                <Badge variant="destructive">sem código</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{item.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                Pedidos {item.pedidos.map((n) => `#${n}`).join(", ")}
                              </p>
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {item.quantidade} {item.unidade}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Histórico das compras lançadas à mão, independentes dos pedidos. */}
      {avulsas.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-2xl text-foreground">Compras avulsas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Compras lançadas à mão. Não alteram pedidos nem estoque.
          </p>

          <div className="mt-4 space-y-2">
            {avulsas.map((compra) => (
              <div
                key={compra.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    Compra nº {compra.numero} · {compra.fornecedorNome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(compra.criadoEm)} · {compra.itens.length}{" "}
                    {compra.itens.length === 1 ? "produto" : "produtos"} ·{" "}
                    {compra.itens.reduce((soma, i) => soma + i.quantidade, 0)} peças ·{" "}
                    <span className="valor-sensivel">{formatarMoeda(compra.custoTotal)}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/api/compras/avulsas/${compra.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="size-4" />
                    PDF
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => excluirAvulsa(compra)}
                  aria-label="Excluir compra"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
