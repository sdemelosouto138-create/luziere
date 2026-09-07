import { ClienteForm } from "@/components/clientes/cliente-form";

export default function NovoClientePage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Novo cliente</h1>
      <p className="mt-1 text-muted-foreground">Cadastre um novo cliente.</p>

      <div className="mt-8">
        <ClienteForm />
      </div>
    </div>
  );
}
