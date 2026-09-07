import { PedidoForm } from "@/components/pedidos/pedido-form";

export default function NovoPedidoPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Novo orçamento</h1>
      <p className="mt-1 text-muted-foreground">Monte um orçamento para o cliente.</p>

      <div className="mt-8">
        <PedidoForm />
      </div>
    </div>
  );
}
