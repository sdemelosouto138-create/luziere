"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Onde a preferência fica guardada no navegador deste aparelho. */
export const CHAVE_VALORES_OCULTOS = "luziere:valores-ocultos";

/** Classe que o CSS usa para borrar os valores (ver globals.css). */
const CLASSE = "valores-ocultos";

/**
 * Botão de olho que esconde os valores em dinheiro da tela.
 *
 * Serve para quando alguém está olhando junto — um cliente na loja, por
 * exemplo. A escolha fica salva neste aparelho e continua valendo ao recarregar.
 */
export function BotaoOcultarValores() {
  // Começa lendo o que o script do layout já aplicou, para não piscar.
  const [oculto, setOculto] = React.useState(false);

  React.useEffect(() => {
    setOculto(document.documentElement.classList.contains(CLASSE));
  }, []);

  function alternar() {
    const novo = !oculto;
    setOculto(novo);
    document.documentElement.classList.toggle(CLASSE, novo);
    try {
      localStorage.setItem(CHAVE_VALORES_OCULTOS, novo ? "1" : "0");
    } catch {
      // Navegador bloqueando armazenamento: a escolha vale só nesta visita.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={alternar}
      title={oculto ? "Mostrar valores" : "Ocultar valores"}
      aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}
      aria-pressed={oculto}
    >
      {oculto ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );
}
