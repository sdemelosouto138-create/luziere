"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apenasDigitosCep, buscarEnderecoPorCep, formatarCep } from "@/lib/cep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ClienteExistente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpfCnpj: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
};

export function ClienteForm({ cliente }: { cliente?: ClienteExistente }) {
  const router = useRouter();
  const emEdicao = Boolean(cliente);

  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [cpfCnpj, setCpfCnpj] = useState(cliente?.cpfCnpj ?? "");
  const [cep, setCep] = useState(cliente?.cep ?? "");
  const [rua, setRua] = useState(cliente?.rua ?? "");
  const [numero, setNumero] = useState(cliente?.numero ?? "");
  const [bairro, setBairro] = useState(cliente?.bairro ?? "");
  const [cidade, setCidade] = useState(cliente?.cidade ?? "");
  const [uf, setUf] = useState(cliente?.uf ?? "");
  const [observacoes, setObservacoes] = useState(cliente?.observacoes ?? "");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preenchimento automático do endereço a partir do CEP.
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const numeroRef = useRef<HTMLInputElement>(null);

  async function handleCepChange(valor: string) {
    const formatado = formatarCep(valor);
    setCep(formatado);
    setAvisoCep(null);

    if (apenasDigitosCep(formatado).length !== 8) return;

    setBuscandoCep(true);
    const endereco = await buscarEnderecoPorCep(formatado);
    setBuscandoCep(false);

    if (!endereco) {
      setAvisoCep("CEP não encontrado. Preencha o endereço manualmente.");
      return;
    }

    // Campos vazios (ex.: CEP geral de cidade) não apagam o que já foi digitado.
    if (endereco.rua) setRua(endereco.rua);
    if (endereco.bairro) setBairro(endereco.bairro);
    if (endereco.cidade) setCidade(endereco.cidade);
    if (endereco.uf) setUf(endereco.uf);
    numeroRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload = { nome, telefone, email, cpfCnpj, cep, rua, numero, bairro, cidade, uf, observacoes };

    try {
      const url = emEdicao ? `/api/clientes/${cliente!.id}` : "/api/clientes";
      const response = await fetch(url, {
        method: emEdicao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro ?? "Não foi possível salvar o cliente.");
        return;
      }

      toast.success(emEdicao ? "Cliente atualizado." : "Cliente cadastrado.");
      router.push("/clientes");
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
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone / WhatsApp</Label>
          <Input id="telefone" value={telefone ?? ""} onChange={(e) => setTelefone(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
          <Input id="cpfCnpj" value={cpfCnpj ?? ""} onChange={(e) => setCpfCnpj(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <div className="relative">
            <Input
              id="cep"
              value={cep ?? ""}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              inputMode="numeric"
            />
            {buscandoCep && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {avisoCep ? (
            <p className="text-xs text-destructive">{avisoCep}</p>
          ) : (
            <p className="text-xs text-muted-foreground">O endereço é preenchido automaticamente.</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="rua">Rua</Label>
          <Input id="rua" value={rua ?? ""} onChange={(e) => setRua(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero">Número</Label>
          <Input id="numero" ref={numeroRef} value={numero ?? ""} onChange={(e) => setNumero(e.target.value)} />
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
          />
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={salvando} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/clientes")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
