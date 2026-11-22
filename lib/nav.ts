export interface NavLink {
  href: string;
  label: string;
}

export interface Role {
  id: "creator" | "comprador" | "produtor" | "operacoes";
  label: string;
  href: string;
  /** prefixo de rota que marca o perfil como ativo */
  prefix: string;
  subnav?: NavLink[];
}

export const ROLES: Role[] = [
  {
    id: "creator",
    label: "Creator",
    href: "/creator/checador",
    prefix: "/creator",
    subnav: [
      { href: "/creator/checador", label: "Checador" },
      { href: "/creator/conteudos", label: "Meus conteúdos" },
    ],
  },
  {
    id: "comprador",
    label: "Comprador",
    href: "/comprador/obrigado",
    prefix: "/comprador",
    subnav: [
      { href: "/comprador/obrigado", label: "Página de obrigado" },
      { href: "/comprador/youclass", label: "YouClass" },
      { href: "/comprador/reembolso", label: "Solicitar reembolso" },
    ],
  },
  { id: "produtor", label: "Produtor", href: "/produtor", prefix: "/produtor" },
  {
    id: "operacoes",
    label: "Operações YouShop",
    href: "/operacoes",
    prefix: "/operacoes",
  },
];
