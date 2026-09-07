import { Badge } from "@/components/ui/badge";
import type { StatusPedido } from "@/generated/prisma/enums";

const CONFIG: Record<StatusPedido, { label: string; className: string }> = {
  ORCAMENTO: { label: "Orçamento", className: "bg-secondary text-secondary-foreground" },
  APROVADO: { label: "Aprovado", className: "bg-primary text-primary-foreground" },
  CONCLUIDO: { label: "Concluído", className: "bg-emerald-600 text-white" },
  CANCELADO: { label: "Cancelado", className: "bg-destructive text-destructive-foreground" },
};

export function StatusBadge({ status }: { status: StatusPedido }) {
  const config = CONFIG[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
