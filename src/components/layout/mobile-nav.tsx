"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// No celular cabem 5 itens com o rótulo legível (+ "Mais"); o resto vai para o menu.
const ITENS_PRINCIPAIS = NAV_ITEMS.slice(0, 5);
const ITENS_SECUNDARIOS = NAV_ITEMS.slice(5);

export function MobileNav() {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);

  const estaAtivo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const algumSecundarioAtivo = ITENS_SECUNDARIOS.some((item) => estaAtivo(item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sidebar-border bg-sidebar text-sidebar-foreground md:hidden">
        {ITENS_PRINCIPAIS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px]",
                estaAtivo(item.href) ? "text-sidebar-primary" : "text-sidebar-foreground/60",
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMaisAberto(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px]",
            algumSecundarioAtivo ? "text-sidebar-primary" : "text-sidebar-foreground/60",
          )}
        >
          <MoreHorizontal size={20} />
          Mais
        </button>
      </nav>

      <Sheet open={maisAberto} onOpenChange={setMaisAberto}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle className="font-serif text-xl">Menu</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 px-4">
            {ITENS_SECUNDARIOS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMaisAberto(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-xs",
                    estaAtivo(item.href) ? "border-primary text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon size={22} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
