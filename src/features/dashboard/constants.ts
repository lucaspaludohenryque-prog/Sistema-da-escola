import {
  Bell,
  BookMarked,
  BookOpenText,
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
  LayoutGrid,
  Megaphone,
  ScrollText,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/features/auth/types";

export type DashboardNavSection =
  | "PRINCIPAL"
  | "ROTINA PEDAGÓGICA"
  | "COMUNICAÇÃO"
  | "GESTÃO";

export interface DashboardNavItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  section: DashboardNavSection;
  exact?: boolean;
  showNotificationBadge?: boolean;
  showJustificationsBadge?: boolean;
}

export interface DashboardNavGroup {
  section: DashboardNavSection;
  items: DashboardNavItem[];
}

export interface MobileBottomNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  showNotificationBadge?: boolean;
}

const SECTION_ORDER: readonly DashboardNavSection[] = [
  "PRINCIPAL",
  "ROTINA PEDAGÓGICA",
  "COMUNICAÇÃO",
  "GESTÃO",
] as const;

const STAFF_BASE_ITEMS: DashboardNavItem[] = [
  {
    label: "Início",
    href: "/dashboard",
    description: "Visão geral do ambiente pedagógico",
    icon: LayoutDashboard,
    section: "PRINCIPAL",
    exact: true,
  },
  {
    label: "Turmas",
    href: "/dashboard/turmas",
    description: "Gestão de turmas, disciplinas e alunos matriculados",
    icon: Users,
    section: "PRINCIPAL",
  },
  {
    label: "Horários",
    href: "/dashboard/horarios",
    description: "Grade semanal de aulas por turma e turno",
    icon: Clock,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Calendário",
    href: "/dashboard/calendario",
    description: "Provas, trabalhos, reuniões, feriados e eventos escolares",
    icon: CalendarDays,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Chamada",
    href: "/dashboard/chamada",
    description: "Registro diário de frequência e justificativas",
    icon: ClipboardCheck,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Mapa de Sala",
    href: "/dashboard/mapa-sala",
    description: "Espelho de classe interativo e chamada visual por carteira",
    icon: LayoutGrid,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Tarefas & Materiais",
    href: "/dashboard/tarefas",
    description: "Mural de tarefas, trabalhos, materiais e controle de entregas",
    icon: BookOpenText,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Planejamento",
    href: "/dashboard/planejamento",
    description: "Plano de ensino e acompanhamento de temas ministrados",
    icon: BookMarked,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Notas",
    href: "/dashboard/notas",
    description: "Avaliações, recuperação paralela, médias e fechamento trimestral",
    icon: GraduationCap,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Ocorrências",
    href: "/dashboard/ocorrencias",
    description: "Acompanhamento disciplinar e registros pedagógicos",
    icon: FileWarning,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Conselho",
    href: "/dashboard/conselho",
    description: "Indicadores da turma e Ata de Conselho de Classe em PDF",
    icon: ScrollText,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Comunicados",
    href: "/dashboard/comunicados",
    description: "Mural oficial de comunicados da escola e turmas",
    icon: Megaphone,
    section: "COMUNICAÇÃO",
  },
];

const MANAGER_EXTRA_ITEMS: DashboardNavItem[] = [
  {
    label: "Justificativas",
    href: "/dashboard/justificativas",
    description: "Aprovação de justificativas de falta enviadas pela família",
    icon: FileCheck2,
    section: "COMUNICAÇÃO",
    showJustificationsBadge: true,
  },
  {
    label: "Vínculos Família",
    href: "/dashboard/familia-vinculos",
    description: "Vincular responsáveis e contas de alunos",
    icon: HeartHandshake,
    section: "GESTÃO",
  },
];

const ADMIN_EXTRA_ITEMS: DashboardNavItem[] = [
  {
    label: "Usuários",
    href: "/dashboard/usuarios",
    description: "Gestão de contas, perfis de acesso e redefinição de senhas",
    icon: UserCog,
    section: "GESTÃO",
  },
  {
    label: "Configurações",
    href: "/dashboard/configuracoes",
    description: "Identidade institucional, cor principal, brasão e ano letivo",
    icon: Settings,
    section: "GESTÃO",
  },
];

const GUARDIAN_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Painel da Família",
    href: "/dashboard/familia",
    description: "Resumo escolar dos filhos vinculados",
    icon: Home,
    section: "PRINCIPAL",
    exact: true,
  },
  {
    label: "Boletim & Ocorrências",
    href: "/dashboard/familia#boletim",
    description: "Notas trimestrais, frequência e ocorrências",
    icon: FileText,
    section: "PRINCIPAL",
    exact: true,
  },
  {
    label: "Horários",
    href: "/dashboard/horarios",
    description: "Grade semanal de aulas dos estudantes acompanhados",
    icon: Clock,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Calendário",
    href: "/dashboard/calendario",
    description: "Calendário de provas, entregas e eventos da escola",
    icon: CalendarDays,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Tarefas & Materiais",
    href: "/dashboard/tarefas",
    description: "Acompanhar tarefas, prazos e materiais das turmas",
    icon: BookOpenText,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Comunicados",
    href: "/dashboard/comunicados",
    description: "Mural oficial de comunicados da escola",
    icon: Megaphone,
    section: "COMUNICAÇÃO",
  },
  {
    label: "Avisos",
    href: "/dashboard/avisos",
    description: "Notificações de faltas, comunicados e ocorrências para ciência",
    icon: Bell,
    section: "COMUNICAÇÃO",
    showNotificationBadge: true,
  },
];

const STUDENT_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: "Meu Painel",
    href: "/dashboard/aluno",
    description: "Resumo do meu desempenho escolar",
    icon: LayoutDashboard,
    section: "PRINCIPAL",
    exact: true,
  },
  {
    label: "Minhas Notas & Frequência",
    href: "/dashboard/aluno#notas",
    description: "Boletim trimestral e registro de faltas",
    icon: GraduationCap,
    section: "PRINCIPAL",
    exact: true,
  },
  {
    label: "Minhas Ocorrências",
    href: "/dashboard/aluno#ocorrencias",
    description: "Acompanhamento pedagógico e disciplinar",
    icon: FileWarning,
    section: "PRINCIPAL",
    exact: true,
  },
  {
    label: "Horários",
    href: "/dashboard/horarios",
    description: "Grade semanal de aulas da minha turma",
    icon: Clock,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Calendário",
    href: "/dashboard/calendario",
    description: "Datas de provas, trabalhos e eventos escolares",
    icon: CalendarDays,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Tarefas & Materiais",
    href: "/dashboard/tarefas",
    description: "Minhas tarefas, trabalhos, leituras e materiais de aula",
    icon: BookOpenText,
    section: "ROTINA PEDAGÓGICA",
  },
  {
    label: "Comunicados",
    href: "/dashboard/comunicados",
    description: "Mural oficial de comunicados da escola",
    icon: Megaphone,
    section: "COMUNICAÇÃO",
  },
  {
    label: "Avisos",
    href: "/dashboard/avisos",
    description: "Comunicados e alertas escolares",
    icon: Bell,
    section: "COMUNICAÇÃO",
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

export function getDashboardNavGroups(role: UserRole): DashboardNavGroup[] {
  const items = getDashboardNavItems(role);
  return SECTION_ORDER.map((section) => ({
    section,
    items: items.filter((item) => item.section === section),
  })).filter((group) => group.items.length > 0);
}

export function getMobileBottomNavItems(role: UserRole): MobileBottomNavItem[] {
  if (role === "RESPONSAVEL") {
    return [
      { label: "Família", href: "/dashboard/familia", icon: Home, exact: true },
      {
        label: "Avisos",
        href: "/dashboard/avisos",
        icon: Bell,
        showNotificationBadge: true,
      },
      { label: "Calendário", href: "/dashboard/calendario", icon: CalendarDays },
      { label: "Comunicados", href: "/dashboard/comunicados", icon: Megaphone },
    ];
  }

  if (role === "ALUNO") {
    return [
      { label: "Painel", href: "/dashboard/aluno", icon: LayoutDashboard, exact: true },
      { label: "Horários", href: "/dashboard/horarios", icon: Clock },
      { label: "Calendário", href: "/dashboard/calendario", icon: CalendarDays },
      { label: "Comunicados", href: "/dashboard/comunicados", icon: Megaphone },
    ];
  }

  return [
    { label: "Início", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Chamada", href: "/dashboard/chamada", icon: ClipboardCheck },
    { label: "Ocorrências", href: "/dashboard/ocorrencias", icon: FileWarning },
    { label: "Turmas", href: "/dashboard/turmas", icon: Users },
  ];
}

export function resolveDashboardSectionTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/alunos/")) {
    return "Ficha do Aluno";
  }
  if (pathname.startsWith("/dashboard/mapa-sala")) {
    return "Mapa de Sala";
  }
  if (pathname.startsWith("/dashboard/tarefas")) {
    return "Tarefas & Materiais";
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

export function resolveDashboardBreadcrumb(
  pathname: string,
  role: UserRole
): { parent: string; current: string } {
  const current = resolveDashboardSectionTitle(pathname);

  if (pathname.startsWith("/dashboard/alunos/")) {
    return {
      parent:
        role === "RESPONSAVEL"
          ? "Portal da Família"
          : role === "ALUNO"
            ? "Portal do Aluno"
            : "Turmas",
      current,
    };
  }

  const items = getDashboardNavItems(role);
  const matched = items.find(
    (item) =>
      !item.href.includes("#") &&
      (item.exact ? pathname === item.href : pathname.startsWith(item.href))
  );

  if (matched) {
    const sectionName =
      matched.section === "PRINCIPAL"
        ? "Principal"
        : matched.section === "ROTINA PEDAGÓGICA"
          ? "Rotina Pedagógica"
          : matched.section === "COMUNICAÇÃO"
            ? "Comunicação"
            : "Gestão";
    return { parent: sectionName, current };
  }

  return { parent: "RCO", current };
}
