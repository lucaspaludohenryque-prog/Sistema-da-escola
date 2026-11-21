import {
  ClipboardCheck,
  FileWarning,
  GraduationCap,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
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
    description: "Lançamento de avaliações, médias e fechamento bimestral",
    icon: GraduationCap,
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
