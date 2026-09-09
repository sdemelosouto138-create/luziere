"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type FornecedorExistente = {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  contato: string | null;
  site: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
};

export function FornecedorForm({ fornecedor }: { fornecedor?: FornecedorExistente }) {
  const router = useRouter();
  const emEdicao = Boolean(fornecedor);

  const [nome, setNome] = useState(fornecedor?.nome ?? "");
  const [cnpj, setCnpj] = useState(fornecedor?.cnpj ?? "");
  const [contato, setContato] = useState(fornecedor?.contato ?? "");
  const [telefone, setTelefone] = useState(fornecedor?.telefone ?? "");
  const [email, setEmail] = useState(fornecedor?.email ?? "");
  const [site, setSite] = useState(fornecedor?.site ?? "");
  const [cep, setCep] = useState(fornecedor?.cep ?? "");
  const [rua, setRua] = useState(fornecedor?.rua ?? "");
  const [numero, setNumero] = useState(fornecedor?.numero ?? "");
  const [bairro, setBairro] = useState(fornecedor?.bairro ?? "");
  const [cidade, setCidade] = useState(fornecedor?.cidade ?? "");
  const [uf, setUf] = useState(fornecedor?.uf ?? "");
  const [observacoes, setObservacoes] = useState(fornecedor?.observacoes ?? "");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload = { nome, cnpj, contato, telefone, email, site, cep, rua, numero, bairro, cidade, uf, observacoes };

    try {
      const url = emEdicao ? `/api/fornecedores/${fornecedor!.id}` : "/api/fornecedores";
      const response = await fetch(url, {
        method: emEdicao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro ?? "Não foi possível salvar o fornecedor.");
        return;
      }

      toast.success(emEdicao ? "Fornecedor atualizado." : "Fornecedor cadastrado.");
      router.push("/fornecedores");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome / Razão social</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input id="cnpj" value={cnpj ?? ""} onChange={(e) => setCnpj(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contato">Pessoa de contato</Label>
          <Input id="contato" value={contato ?? ""} onChange={(e) => setContato(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone / WhatsApp</Label>
          <Input id="telefone" value={telefone ?? ""} onChange={(e) => setTelefone(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="site">Site</Label>
          <Input id="site" value={site ?? ""} onChange={(e) => setSite(e.target.value)} placeholder="https://" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" value={cep ?? ""} onChange={(e) => setCep(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rua">Rua</Label>
          <Input id="rua" value={rua ?? ""} onChange={(e) => setRua(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero">Número</Label>
          <Input id="numero" value={numero ?? ""} onChange={(e) => setNumero(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" value={bairro ?? ""} onChange={(e) => setBairro(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" value={cidade ?? ""} onChange={(e) => setCidade(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="uf">UF</Label>
          <Input id="uf" maxLength={2} value={uf ?? ""} onChange={(e) => setUf(e.target.value.toUpperCase())} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={observacoes ?? ""}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Prazo de entrega, condições de pagamento, pedido mínimo..."
          />
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={salvando} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Cadastrar fornecedor"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/fornecedores")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
