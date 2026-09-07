"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// useSearchParams exige um limite de Suspense para o build de produção.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usuario, setUsuario] = useState("admin");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro ?? "Não foi possível entrar.");
        return;
      }

      const destino = searchParams.get("next") ?? "/dashboard";
      router.replace(destino);
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e1e1e] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <Image
            src="/logo-simbolo-escuro.png"
            alt="Símbolo Luzière"
            width={88}
            height={97}
            className="size-22 rounded-2xl object-cover shadow-lg"
            priority
          />
          <span className="font-serif text-4xl tracking-wide text-[#f2efe9]">
            Luzi<span className="text-[#e8b44a]">è</span>re
          </span>
          <span className="text-sm uppercase tracking-[0.3em] text-[#b3ab9c]">
            Gestão de Vendas
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#3a3a3a] bg-[#2b2b2b] p-8 shadow-xl"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-[#f2efe9]">
                Usuário
              </Label>
              <Input
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                required
                className="border-[#3a3a3a] bg-[#1e1e1e] text-[#f2efe9]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-[#f2efe9]">
                Senha
              </Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
                className="border-[#3a3a3a] bg-[#1e1e1e] text-[#f2efe9]"
              />
            </div>

            {erro && <p className="text-sm text-[#d9573f]">{erro}</p>}

            <Button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#e8b44a] text-[#1e1e1e] hover:bg-[#c9a24b]"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
