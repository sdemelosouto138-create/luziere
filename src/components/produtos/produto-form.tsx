"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Categoria = { id: string; nome: string };
type Fornecedor = { id: string; nome: string };

type ProdutoExistente = {
  id: string;
  nome: string;
  sku: string | null;
  descricao: string | null;
  categoriaId: string;
  precoCusto: number;
  precoVenda: number;
  unidade: string;
  potenciaW: number | null;
  temperaturaCor: string | null;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedorId: string | null;
  imagens: { url: string }[];
};

const TEMPERATURAS = ["2700K", "3000K", "4000K", "6500K"];

export function ProdutoForm({
  categoriasIniciais,
  fornecedoresIniciais,
  produto,
}: {
  categoriasIniciais: Categoria[];
  fornecedoresIniciais: Fornecedor[];
  produto?: ProdutoExistente;
}) {
  const router = useRouter();
  const emEdicao = Boolean(produto);

  const [categorias, setCategorias] = useState(categoriasIniciais);
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [sku, setSku] = useState(produto?.sku ?? "");
  const [categoriaId, setCategoriaId] = useState(produto?.categoriaId ?? categoriasIniciais[0]?.id ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [precoCusto, setPrecoCusto] = useState(produto?.precoCusto?.toString() ?? "");
  const [precoVenda, setPrecoVenda] = useState(produto?.precoVenda?.toString() ?? "");
  const [unidade, setUnidade] = useState(produto?.unidade ?? "un");
  const [potenciaW, setPotenciaW] = useState(produto?.potenciaW?.toString() ?? "");
  const [temperaturaCor, setTemperaturaCor] = useState(produto?.temperaturaCor ?? "nenhuma");
  const [estoqueAtual, setEstoqueAtual] = useState(produto?.estoqueAtual?.toString() ?? "0");
  const [estoqueMinimo, setEstoqueMinimo] = useState(produto?.estoqueMinimo?.toString() ?? "0");
  const [fornecedores, setFornecedores] = useState(fornecedoresIniciais);
  const [fornecedorId, setFornecedorId] = useState(produto?.fornecedorId ?? "nenhum");
  const [novoFornecedor, setNovoFornecedor] = useState("");
  const [mostrarNovoFornecedor, setMostrarNovoFornecedor] = useState(false);
  const [imagens, setImagens] = useState<string[]>(produto?.imagens.map((i) => i.url) ?? []);

  const [novaCategoria, setNovaCategoria] = useState("");
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleAdicionarCategoria() {
    const nomeCategoria = novaCategoria.trim();
    if (!nomeCategoria) return;
    const response = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeCategoria }),
    });
    const categoria = await response.json();
    setCategorias((prev) => [...prev, categoria].sort((a, b) => a.nome.localeCompare(b.nome)));
    setCategoriaId(categoria.id);
    setNovaCategoria("");
    setMostrarNovaCategoria(false);
  }

  async function handleAdicionarFornecedor() {
    const nomeFornecedor = novoFornecedor.trim();
    if (!nomeFornecedor) return;
    const response = await fetch("/api/fornecedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeFornecedor }),
    });
    const fornecedor = await response.json();
    if (!response.ok) {
      toast.error(fornecedor.erro ?? "Não foi possível criar o fornecedor.");
      return;
    }
    setFornecedores((prev) => [...prev, fornecedor].sort((a, b) => a.nome.localeCompare(b.nome)));
    setFornecedorId(fornecedor.id);
    setNovoFornecedor("");
    setMostrarNovoFornecedor(false);
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = event.target.files;
    if (!arquivos || arquivos.length === 0) return;

    setEnviandoImagem(true);
    try {
      const urls: string[] = [];
      for (const arquivo of Array.from(arquivos)) {
        const formData = new FormData();
        formData.append("arquivo", arquivo);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.erro ?? "Falha no upload.");
        urls.push(data.url);
      }
      setImagens((prev) => [...prev, ...urls]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar imagem.");
    } finally {
      setEnviandoImagem(false);
      event.target.value = "";
    }
  }

  function handleRemoverImagem(url: string) {
    setImagens((prev) => prev.filter((i) => i !== url));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload = {
      nome,
      sku,
      categoriaId,
      descricao: descricao || null,
      precoCusto: Number(precoCusto),
      precoVenda: Number(precoVenda),
      unidade,
      potenciaW: potenciaW ? Number(potenciaW) : null,
      temperaturaCor: temperaturaCor === "nenhuma" ? null : temperaturaCor,
      estoqueAtual: Number(estoqueAtual),
      estoqueMinimo: Number(estoqueMinimo),
      fornecedorId: fornecedorId === "nenhum" ? null : fornecedorId,
      imagens,
    };

    try {
      const url = emEdicao ? `/api/produtos/${produto!.id}` : "/api/produtos";
      const response = await fetch(url, {
        method: emEdicao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro ?? "Não foi possível salvar o produto.");
        return;
      }

      toast.success(emEdicao ? "Produto atualizado." : "Produto cadastrado.");
      router.push("/produtos");
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
          <Label htmlFor="nome">Nome do produto</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">Código do produto</Label>
          <Input
            id="sku"
            value={sku ?? ""}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Opcional — ex.: código do catálogo do fornecedor"
          />
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          {!mostrarNovaCategoria ? (
            <div className="flex gap-2">
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setMostrarNovaCategoria(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Nome da nova categoria"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
              />
              <Button type="button" onClick={handleAdicionarCategoria}>
                Adicionar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMostrarNovaCategoria(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" value={descricao ?? ""} onChange={(e) => setDescricao(e.target.value)} rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="precoCusto">Preço de custo (R$)</Label>
          <Input
            id="precoCusto"
            type="number"
            step="0.01"
            min="0"
            value={precoCusto}
            onChange={(e) => setPrecoCusto(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="precoVenda">Preço de venda (R$)</Label>
          <Input
            id="precoVenda"
            type="number"
            step="0.01"
            min="0"
            value={precoVenda}
            onChange={(e) => setPrecoVenda(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Unidade</Label>
          <Select value={unidade} onValueChange={setUnidade}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="un">Unidade (un)</SelectItem>
              <SelectItem value="m">Metro (m)</SelectItem>
              <SelectItem value="cx">Caixa (cx)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="potenciaW">Potência (W)</Label>
          <Input
            id="potenciaW"
            type="number"
            step="0.1"
            min="0"
            value={potenciaW ?? ""}
            onChange={(e) => setPotenciaW(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label>Temperatura de cor</Label>
          <Select value={temperaturaCor ?? "nenhuma"} onValueChange={setTemperaturaCor}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhuma">Não se aplica</SelectItem>
              {TEMPERATURAS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estoqueAtual">Quantidade em estoque</Label>
          <Input
            id="estoqueAtual"
            type="number"
            min="0"
            value={estoqueAtual}
            onChange={(e) => setEstoqueAtual(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
          <Input
            id="estoqueMinimo"
            type="number"
            min="0"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Fornecedor</Label>
          {!mostrarNovoFornecedor ? (
            <div className="flex gap-2">
              <Select value={fornecedorId} onValueChange={setFornecedorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Sem fornecedor</SelectItem>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setMostrarNovoFornecedor(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Nome do novo fornecedor"
                value={novoFornecedor}
                onChange={(e) => setNovoFornecedor(e.target.value)}
              />
              <Button type="button" onClick={handleAdicionarFornecedor}>
                Adicionar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMostrarNovoFornecedor(false)}>
                Cancelar
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Dados completos do fornecedor ficam na seção Fornecedores do menu.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Fotos do produto</Label>
        <div className="flex flex-wrap gap-3">
          {imagens.map((url) => (
            <div key={url} className="group relative size-24 overflow-hidden rounded-lg border border-border">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => handleRemoverImagem(url)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-secondary/50">
            {enviandoImagem ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
            <span className="text-[11px]">Adicionar</span>
            <input type="file" accept="image/*" multiple hidden onChange={handleUpload} disabled={enviandoImagem} />
          </label>
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={salvando} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {salvando ? "Salvando..." : emEdicao ? "Salvar alterações" : "Cadastrar produto"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/produtos")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
