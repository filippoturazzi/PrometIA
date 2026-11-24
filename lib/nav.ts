import {
  Activity,
  Building2,
  Clapperboard,
  GraduationCap,
  LayoutList,
  PartyPopper,
  ScanSearch,
  ShoppingBag,
  Store,
  Undo2,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface Role {
  id: "creator" | "comprador" | "produtor" | "operacoes";
  label: string;
  href: string;
  /** prefixo de rota que marca o perfil como ativo */
  prefix: string;
  icon: LucideIcon;
  /** rótulo da área exibido na subnav */
  area: string;
  subnav: NavLink[];
}

export const ROLES: Role[] = [
  {
    id: "produtor",
    label: "Produtor",
    href: "/produtor",
    prefix: "/produtor",
    icon: Store,
    area: "Área do produtor",
    subnav: [
      { href: "/produtor/checador", label: "Checar página de vendas", icon: ScanSearch },
      { href: "/produtor", label: "Saúde da promessa", icon: Activity },
    ],
  },
  {
    id: "creator",
    label: "Creator",
    href: "/creator/checador",
    prefix: "/creator",
    icon: Clapperboard,
    area: "Área do creator",
    subnav: [
      { href: "/creator/checador", label: "Checador", icon: ScanSearch },
      { href: "/creator/conteudos", label: "Meus conteúdos", icon: LayoutList },
    ],
  },
  {
    id: "comprador",
    label: "Comprador",
    href: "/comprador/obrigado",
    prefix: "/comprador",
    icon: ShoppingBag,
    area: "Área do comprador",
    subnav: [
      { href: "/comprador/obrigado", label: "Página de obrigado", icon: PartyPopper },
      { href: "/comprador/youclass", label: "YouClass", icon: GraduationCap },
      { href: "/comprador/reembolso", label: "Solicitar reembolso", icon: Undo2 },
    ],
  },
  {
    id: "operacoes",
    label: "Operações YouShop",
    href: "/operacoes",
    prefix: "/operacoes",
    icon: Building2,
    area: "Operações YouShop",
    subnav: [{ href: "/operacoes", label: "Saúde da promessa", icon: Activity }],
  },
];
