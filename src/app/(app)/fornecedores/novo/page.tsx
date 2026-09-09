import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";

export default function NovoFornecedorPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground">Novo fornecedor</h1>
      <p className="mt-1 text-muted-foreground">Cadastre um fornecedor de produtos.</p>

      <div className="mt-8">
        <FornecedorForm />
      </div>
    </div>
  );
}
