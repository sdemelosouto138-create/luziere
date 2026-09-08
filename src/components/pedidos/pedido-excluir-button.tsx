"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import type { StatusPedido } from "@/generated/prisma/enums";

type Props = {
  pedidoId: string;
  numero: number;
  status: StatusPedido;
  /** "icone" para a lista (só o ícone); "botao" para a tela de detalhe. */
  variante?: "icone" | "botao";
  /** Chamado após excluir (ex.: recarregar a lista). Se omitido, redireciona para /pedidos. */
  aoExcluir?: () => void;
};

export function PedidoExcluirButton({ pedidoId, numero, status, variante = "botao", aoExcluir }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const devolveEstoque = status === "APROVADO" || status === "CONCLUIDO";

  async function handleExcluir() {
    setExcluindo(true);
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.erro ?? "Não foi possível excluir o pedido.");
        return;
      }
      toast.success(data.estoqueDevolvido ? "Pedido excluído e estoque devolvido." : "Pedido excluído.");
      setAberto(false);
      if (aoExcluir) {
        aoExcluir();
      } else {
        router.push("/pedidos");
        router.refresh();
      }
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      {variante === "icone" ? (
        <Button variant="ghost" size="icon" onClick={() => setAberto(true)} aria-label="Excluir pedido">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ) : (
        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setAberto(true)}>
          <Trash2 className="size-4" />
          Excluir
        </Button>
      )}

      <AlertDialog open={aberto} onOpenChange={setAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido #{numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              {devolveEstoque
                ? "Este pedido já teve o estoque baixado. Ao excluir, os itens voltam ao estoque e a devolução fica registrada no histórico. Esta ação não pode ser desfeita."
                : "O orçamento será removido definitivamente. Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} disabled={excluindo}>
              {excluindo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
