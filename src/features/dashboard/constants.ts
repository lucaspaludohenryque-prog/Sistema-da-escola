import {
  Bell,
  BookMarked,
  CalendarDays,
  ClipboardCheck,
  Clock,
  FileCheck2,
  FileText,
  FileWarning,
  GraduationCap,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/features/auth/types";

export interface DashboardNavItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  exact?: boolean;
  showNotificationBadge?: boolean;
  showJustificationsBadge?: boolean;
}

const STAFF_BASE_ITEMS: DashboardNavItem[] = [
  {
    label: "Início",
    href: "/dashboard",
    description: "Visão geral do ambiente pedagógico",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Comunicados",
    href: "/dashboard/comunicados",
    description: "Mural oficial de comunicados da escola e turmas",
    icon: Megaphone,
  },
  {
    label: "Turmas",
    href: "/dashboard/turmas",
    description: "Gestão de turmas, disciplinas e alunos matriculados",
    icon: Users,
  },
  {
    label: "Horários",
    href: "/dashboard/horarios",
    description: "Grade semanal de aulas por turma e turno",
    icon: Clock,
  },
  {
    label: "Calendário",
    href: "/dashboard/calendario",
    description: "Provas, trabalhos, reuniões, feriados e eventos escolares",
    icon: CalendarDays,
  },
  {
    label: "Chamada",
    href: "/dashboard/chamada",
    description: "Registro diário de frequência e justificativas",
    icon: ClipboardCheck,
  },
  {
    label: "Planejamento",
    href: "/dashboard/planejamento",
    description: "Plano de ensino e acompanhamento de temas ministrados",
    icon: BookMarked,
  },
  {
    label: "Notas",
    href: "/dashboard/notas",
    description: "Avaliações, recuperação paralela, médias e fechamento trimestral",
    icon: GraduationCap,
  },
  {
    label: "Ocorrências",
    href: "/dashboard/ocorrencias",
    description: "Acompanhamento disciplinar e registros pedagógicos",
    icon: FileWarning,
  },
  {
    label: "Conselho",
    href: "/dashboard/conselho",
    description: "Indicadores da turma e Ata de Conselho de Classe em PDF",
    icon: ScrollText,
  },
];

const MANAGER_EXTRA_ITEMS: DashboardNavItem[] = [
  {
    label: "Justificativas",
    href: "/dashboard/justificativas",
    description: "Aprovação de justificativas de falta enviadas pela família",
    icon: FileCheck2,
    showJustificationsBadge: true,
  },
  {
    label: "Vínculos Família",
    href: "/dashboard/familia-vinculos",
    description: "Vincular responsáveis e contas de alunos",
    icon: HeartHandshake,
  },
];

const ADMIN_EXTRA_ITEMS: DashboardNavItem[] = [
  {
    label: "Usuários",
    href: "/dashboard/usuarios",
    description: "Gestão de contas, perfis de acesso e redefinição de senhas",
    icon: UserCog,
  },
  {
    label: "Configurações",
    href: "/dashboard/configuracoes",
    description: "Identidade institucional, cor principal, brasão e ano letivo",
    icon: Settings,
  },
];

const GUARDIAN_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Painel da Família",
    href: "/dashboard/familia",
    description: "Resumo escolar dos filhos vinculados",
    icon: Home,
    exact: true,
  },
  {
    label: "Comunicados",
    href: "/dashboard/comunicados",
    description: "Mural oficial de comunicados da escola",
    icon: Megaphone,
  },
  {
    label: "Avisos",
    href: "/dashboard/avisos",
    description: "Notificações de faltas, comunicados e ocorrências para ciência",
    icon: Bell,
    showNotificationBadge: true,
  },
  {
    label: "Horários",
    href: "/dashboard/horarios",
    description: "Grade semanal de aulas dos estudantes acompanhados",
    icon: Clock,
  },
  {
    label: "Calendário",
    href: "/dashboard/calendario",
    description: "Calendário de provas, entregas e eventos da escola",
    icon: CalendarDays,
  },
  {
    label: "Boletim & Ocorrências",
    href: "/dashboard/familia#boletim",
    description: "Notas trimestrais, frequência e ocorrências",
    icon: FileText,
    exact: true,
  },
];

const STUDENT_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Meu Painel",
    href: "/dashboard/aluno",
    description: "Resumo do meu desempenho escolar",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Comunicados",
    href: "/dashboard/comunicados",
    description: "Mural oficial de comunicados da escola",
    icon: Megaphone,
  },
  {
    label: "Horários",
    href: "/dashboard/horarios",
    description: "Grade semanal de aulas da minha turma",
    icon: Clock,
  },
  {
    label: "Calendário",
    href: "/dashboard/calendario",
    description: "Datas de provas, trabalhos e eventos escolares",
    icon: CalendarDays,
  },
  {
    label: "Minhas Notas & Frequência",
    href: "/dashboard/aluno#notas",
    description: "Boletim trimestral e registro de faltas",
    icon: GraduationCap,
    exact: true,
  },
  {
    label: "Minhas Ocorrências",
    href: "/dashboard/aluno#ocorrencias",
    description: "Acompanhamento pedagógico e disciplinar",
    icon: FileWarning,
    exact: true,
  },
  {
    label: "Avisos",
    href: "/dashboard/avisos",
    description: "Comunicados e alertas escolares",
    icon: Bell,
    showNotificationBadge: true,
  },
];

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  ...STAFF_BASE_ITEMS,
  ...MANAGER_EXTRA_ITEMS,
  ...ADMIN_EXTRA_ITEMS,
];

export function getDashboardNavItems(role: UserRole): DashboardNavItem[] {
  if (role === "RESPONSAVEL") {
    return GUARDIAN_NAV_ITEMS;
  }
  if (role === "ALUNO") {
    return STUDENT_NAV_ITEMS;
  }
  if (role === "ADMIN") {
    return [...STAFF_BASE_ITEMS, ...MANAGER_EXTRA_ITEMS, ...ADMIN_EXTRA_ITEMS];
  }
  if (role === "COORDENACAO") {
    return [...STAFF_BASE_ITEMS, ...MANAGER_EXTRA_ITEMS];
  }
  return STAFF_BASE_ITEMS;
}

export function resolveDashboardSectionTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/alunos/")) {
    return "Ficha do Aluno";
  }
  if (pathname.startsWith("/dashboard/comunicados")) {
    return "Mural de Comunicados";
  }
  if (pathname.startsWith("/dashboard/justificativas")) {
    return "Justificativas de Falta";
  }
  if (pathname.startsWith("/dashboard/horarios")) {
    return "Grade de Horários";
  }
  if (pathname.startsWith("/dashboard/calendario")) {
    return "Calendário Escolar";
  }
  if (pathname.startsWith("/dashboard/planejamento")) {
    return "Planejamento de Aulas";
  }
  if (pathname.startsWith("/dashboard/conselho")) {
    return "Conselho de Classe";
  }
  if (pathname.startsWith("/dashboard/familia-vinculos")) {
    return "Vínculos Família";
  }
  if (pathname.startsWith("/dashboard/familia")) {
    return "Painel da Família";
  }
  if (pathname.startsWith("/dashboard/aluno")) {
    return "Meu Painel";
  }
  if (pathname.startsWith("/dashboard/avisos")) {
    return "Avisos";
  }

  const matched = DASHBOARD_NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  return matched?.label ?? "Painel Escolar";
}
