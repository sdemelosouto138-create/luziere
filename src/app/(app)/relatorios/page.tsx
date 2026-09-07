"use client";

import { useEffect, useState, useCallback } from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarMoeda } from "@/lib/format";

type Relatorio = {
  totalVendido: number;
  numPedidos: number;
  ticketMedio: number;
  lucroEstimado: number;
  vendasPorCategoria: { categoria: string; total: number }[];
  produtosMaisVendidos: { nome: string; quantidade: number; total: number }[];
  melhoresClientes: { nome: string; total: number; pedidos: number }[];
};

function paraInputDate(data: Date) {
  return data.toISOString().slice(0, 10);
}

function eixoMoeda(valor: number) {
  return valor >= 1000 ? `${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : String(valor);
}

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--foreground)",
};

export default function RelatoriosPage() {
  const hoje = new Date();
  const [dataInicio, setDataInicio] = useState(paraInputDate(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));
  const [dataFim, setDataFim] = useState(paraInputDate(hoje));
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);

  const query = new URLSearchParams({ dataInicio, dataFim }).toString();

  const carregar = useCallback(async () => {
    const response = await fetch(`/api/relatorios?${query}`);
    setRelatorio(await response.json());
  }, [query]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Relatório de vendas</h1>
          <p className="mt-1 text-muted-foreground">Considera apenas pedidos aprovados e concluídos.</p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/relatorios?${query}&formato=csv`}>
            <Download className="size-4" />
            Exportar CSV
          </a>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="space-y-1.5">
          <Label htmlFor="dataInicio">Data inicial</Label>
          <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dataFim">Data final</Label>
          <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
      </div>

      {relatorio && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Total vendido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-2xl text-foreground">{formatarMoeda(relatorio.totalVendido)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Nº de pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-2xl text-foreground">{relatorio.numPedidos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Ticket médio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-2xl text-foreground">{formatarMoeda(relatorio.ticketMedio)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Lucro estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-2xl text-primary">{formatarMoeda(relatorio.lucroEstimado)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg font-normal">Vendas por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {relatorio.vendasPorCategoria.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Sem vendas no período.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={relatorio.vendasPorCategoria} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="categoria" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={eixoMoeda} width={60} />
                        <Tooltip formatter={(v) => formatarMoeda(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                        <Bar dataKey="total" name="Vendas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg font-normal">Produtos mais vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {relatorio.produtosMaisVendidos.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Sem vendas no período.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={relatorio.produtosMaisVendidos.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="nome" width={150} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v) => `${v} un.`} contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                        <Bar dataKey="quantidade" name="Quantidade" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="font-serif text-lg font-normal">Melhores clientes</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Total comprado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorio.melhoresClientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Sem vendas no período.
                      </TableCell>
                    </TableRow>
                  )}
                  {relatorio.melhoresClientes.map((cliente, index) => (
                    <TableRow key={cliente.nome}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell className="text-right">{cliente.pedidos}</TableCell>
                      <TableCell className="text-right font-medium">{formatarMoeda(cliente.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
