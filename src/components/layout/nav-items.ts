import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Images,
  Users,
  ClipboardList,
  Boxes,
  BarChart3,
  Truck,
  ShoppingCart,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/catalogo", label: "Catálogo", icon: Images },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/estoque", label: "Estoque", icon: Boxes },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];
