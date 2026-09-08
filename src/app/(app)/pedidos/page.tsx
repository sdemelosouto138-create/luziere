"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/pedidos/status-badge";
import { PedidoExcluirButton } from "@/components/pedidos/pedido-excluir-button";
import { formatarData, formatarMoeda } from "@/lib/format";
import { calcularTotalPedido } from "@/lib/pedido";

type Pedido = {
  id: string;
  numero: number;
  criadoEm: string;
  status: "ORCAMENTO" | "APROVADO" | "CONCLUIDO" | "CANCELADO";
  desconto: number;
  descontoTipo: string;
  frete: number;
  cliente: { nome: string };
  itens: { subtotal: number }[];
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (status !== "todos") params.set("status", status);
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);
    const response = await fetch(`/api/pedidos?${params.toString()}`);
    setPedidos(await response.json());
    setCarregando(false);
  }, [busca, status, dataInicio, dataFim]);

  useEffect(() => {
    const timeout = setTimeout(carregar, 250);
    return () => clearTimeout(timeout);
  }, [carregar]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Pedidos e orçamentos</h1>
          <p className="mt-1 text-muted-foreground">Todos os orçamentos e pedidos da Luzière.</p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/pedidos/novo">
            <Plus className="size-4" />
            Novo orçamento
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col flex-wrap gap-3 sm:flex-row">
        <div className="relative flex-1 sm:min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="ORCAMENTO">Orçamento</SelectItem>
            <SelectItem value="APROVADO">Aprovado</SelectItem>
            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full sm:w-40" />
        <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full sm:w-40" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!carregando && pedidos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            )}
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/pedidos/${pedido.id}`} className="block font-medium hover:text-primary">
                    #{pedido.numero}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/pedidos/${pedido.id}`} className="block">
                    {pedido.cliente.nome}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatarData(pedido.criadoEm)}</TableCell>
                <TableCell>
                  {formatarMoeda(calcularTotalPedido(pedido.itens, pedido.desconto, pedido.descontoTipo, pedido.frete))}
                </TableCell>
                <TableCell>
                  <StatusBadge status={pedido.status} />
                </TableCell>
                <TableCell className="text-right">
                  <PedidoExcluirButton
                    pedidoId={pedido.id}
                    numero={pedido.numero}
                    status={pedido.status}
                    variante="icone"
                    aoExcluir={carregar}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
