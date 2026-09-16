"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function PedidoStatusActions({ pedidoId, status }: { pedidoId: string; status: StatusPedido }) {
  const router = useRouter();
  const [confirmacao, setConfirmacao] = useState<{ novoStatus: StatusPedido; titulo: string; descricao: string } | null>(
    null,
  );
  const [enviando, setEnviando] = useState(false);

  async function mudarStatus(novoStatus: StatusPedido) {
    setEnviando(true);
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.erro ?? "Não foi possível atualizar o status.");
        return;
      }
      toast.success("Status atualizado.");
      router.refresh();
    } finally {
      setEnviando(false);
      setConfirmacao(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ORCAMENTO" && (
        <>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={enviando}
            onClick={() =>
              setConfirmacao({
                novoStatus: "APROVADO",
                titulo: "Aprovar orçamento?",
                descricao: "O orçamento vira um pedido aprovado. O estoque não muda agora: a baixa acontece quando você concluir a entrega.",
              })
            }
          >
            Aprovar pedido
          </Button>
          <Button
            variant="outline"
            disabled={enviando}
            onClick={() =>
              setConfirmacao({ novoStatus: "CANCELADO", titulo: "Cancelar orçamento?", descricao: "Esta ação não pode ser desfeita." })
            }
          >
            Cancelar
          </Button>
        </>
      )}

      {status === "APROVADO" && (
        <>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={enviando}
            onClick={() =>
              setConfirmacao({
                novoStatus: "CONCLUIDO",
                titulo: "Marcar como concluído?",
                descricao: "Use quando a entrega já tiver sido feita. É neste momento que o estoque dos itens é baixado.",
              })
            }
          >
            Marcar como concluído
          </Button>
          <Button
            variant="outline"
            disabled={enviando}
            onClick={() =>
              setConfirmacao({
                novoStatus: "CANCELADO",
                titulo: "Cancelar pedido?",
                descricao: "O pedido é cancelado. O estoque não muda, porque a baixa só acontece na conclusão.",
              })
            }
          >
            Cancelar pedido
          </Button>
        </>
      )}

      {status === "CONCLUIDO" && (
        <>
          <Button
            variant="outline"
            disabled={enviando}
            onClick={() =>
              setConfirmacao({
                novoStatus: "APROVADO",
                titulo: "Voltar para aprovado?",
                descricao:
                  "Use se marcou como concluído por engano. A venda continua valendo e o estoque baixado é estornado.",
              })
            }
          >
            Voltar para aprovado
          </Button>
          <Button
            variant="outline"
            disabled={enviando}
            onClick={() =>
              setConfirmacao({
                novoStatus: "CANCELADO",
                titulo: "Cancelar pedido concluído?",
                descricao: "O estoque baixado será devolvido automaticamente.",
              })
            }
          >
            Cancelar pedido
          </Button>
        </>
      )}

      <AlertDialog open={Boolean(confirmacao)} onOpenChange={(open) => !open && setConfirmacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmacao?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>{confirmacao?.descricao}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmacao && mudarStatus(confirmacao.novoStatus)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
