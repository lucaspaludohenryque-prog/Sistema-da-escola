import {
  ClipboardCheck,
  FileWarning,
  GraduationCap,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Início",
    href: "/dashboard",
    description: "Visão geral do ambiente pedagógico",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Turmas",
    href: "/dashboard/turmas",
    description: "Gestão de turmas, disciplinas e alunos matriculados",
    icon: Users,
  },
  {
    label: "Chamada",
    href: "/dashboard/chamada",
    description: "Registro diário de frequência e justificativas",
    icon: ClipboardCheck,
  },
  {
    label: "Ocorrências",
    href: "/dashboard/ocorrencias",
    description: "Acompanhamento disciplinar e registros pedagógicos",
    icon: FileWarning,
  },
  {
    label: "Notas",
    href: "/dashboard/notas",
    description: "Lançamento de avaliações, médias e fechamento trimestral",
    icon: GraduationCap,
  },
  {
    label: "Usuários",
    href: "/dashboard/usuarios",
    description: "Gestão de contas, perfis de acesso e redefinição de senhas",
    icon: UserCog,
    adminOnly: true,
  },
  {
    label: "Configurações",
    href: "/dashboard/configuracoes",
    description: "Identidade institucional, brasão e ano letivo da escola",
    icon: Settings,
    adminOnly: true,
  },
];

export function resolveDashboardSectionTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/alunos")) {
    return "Ficha do Aluno";
  }
  const matched = DASHBOARD_NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  return matched?.label ?? "Painel Escolar";
}
