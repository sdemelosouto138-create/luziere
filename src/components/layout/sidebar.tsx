"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-3 px-5 py-7">
        <Image
          src="/logo-simbolo-escuro.png"
          alt="Símbolo Luziére"
          width={44}
          height={49}
          className="size-11 rounded-xl object-cover"
          priority
        />
        <div className="flex flex-col">
          <span className="font-serif text-2xl leading-none tracking-wide">
            Luzi<span className="text-sidebar-primary">é</span>re
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground/50">
            Gestão de Vendas
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4.5" size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
