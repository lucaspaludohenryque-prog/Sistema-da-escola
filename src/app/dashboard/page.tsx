import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FileWarning,
  GraduationCap,
  Users,
} from "lucide-react";
import { formatIsoDateBr } from "@/features/attendance/constants";
import {
  ROLE_BADGE_STYLES,
  ROLE_LABELS,
  getAuthenticatedUser,
  getDefaultDashboardPath,
  isStaffRole,
} from "@/features/auth";
import { DashboardCharts } from "@/features/dashboard/components/DashboardCharts";
import { getDashboardOverviewForUser } from "@/features/dashboard/queries";
import { formatScoreBr } from "@/features/grades/constants";
import {
  OCCURRENCE_PRAISE_STYLE,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_SEVERITY_STYLES,
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_STATUS_STYLES,
  OCCURRENCE_TYPE_LABELS,
} from "@/features/occurrences/constants";
import { getSchoolConfig } from "@/features/school-config";
import { Avatar } from "@/shared/components/Avatar";

export const metadata: Metadata = {
  title: "Início",
  description: "Painel inteligente do Registro de Classe Online.",
};

const QUICK_ACTIONS = [
  {
    label: "Fazer Chamada",
    href: "/dashboard/chamada",
    icon: ClipboardCheck,
    primary: true,
  },
  {
    label: "Registrar Ocorrência",
    href: "/dashboard/ocorrencias",
    icon: FileWarning,
    primary: false,
  },
  {
    label: "Lançar Notas",
    href: "/dashboard/notas",
    icon: GraduationCap,
    primary: false,
  },
];

export default async function DashboardHomePage(): Promise<React.JSX.Element> {
  const [user, schoolConfig] = await Promise.all([
    getAuthenticatedUser(),
    getSchoolConfig(),
  ]);

  if (!user) {
    redirect("/login");
  }

  if (!isStaffRole(user.role)) {
    redirect(getDefaultDashboardPath(user.role));
  }

  const overview = await getDashboardOverviewForUser(user);
  const {
    counters,
    alertStudents,
    recentOccurrences,
    attendanceByClassroom,
    occurrencesByType,
  } = overview;
  const roleLabel = ROLE_LABELS[user.role];
  const roleBadgeClass = ROLE_BADGE_STYLES[user.role];

  const kpiCards = [
    {
      label: "Turmas",
      value: counters.totalClassrooms,
      helper:
        user.role === "PROFESSOR"
          ? "Turmas vinculadas a você"
          : "Turmas cadastradas na escola",
      icon: Users,
      href: "/dashboard/turmas",
      tone: "default" as const,
    },
    {
      label: "Alunos Ativos",
      value: counters.activeStudentsCount,
      helper: "Matrículas ativas no escopo",
      icon: GraduationCap,
      href: "/dashboard/turmas",
      tone: "default" as const,
    },
    {
      label: "Ocorrências Pendentes",
      value: counters.pendingOccurrencesCount,
      helper: "Aguardando encaminhamento",
      icon: FileWarning,
      href: "/dashboard/ocorrencias",
      tone:
        counters.pendingOccurrencesCount > 0
          ? ("warning" as const)
          : ("default" as const),
    },
    {
      label: "Alunos em Alerta",
      value: counters.alertStudentsCount,
      helper: "Freq. < 75% ou média < 6,0",
      icon: AlertTriangle,
      href: "#alertas-pedagogicos",
      tone:
        counters.alertStudentsCount > 0
          ? ("danger" as const)
          : ("success" as const),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecalho limpo da pagina sem banner colorido */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
              Olá, {user.name}
            </h2>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass}`}
            >
              {roleLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {user.role === "PROFESSOR"
              ? "Resumo de frequência, ocorrências e indicadores das suas turmas."
              : "Visão consolidada de frequência, notas e ocorrências da unidade."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.primary
                    ? "inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)]"
                    : "inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.09] dark:bg-[#131518] dark:text-zinc-200 dark:hover:bg-[#1A1D21]"
                }
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Faixa limpa de KPIs */}
      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const valueClass =
            card.tone === "danger"
              ? "text-red-600 dark:text-red-400"
              : card.tone === "warning"
                ? "text-amber-700 dark:text-amber-400"
                : "text-zinc-900 dark:text-zinc-100";

          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-zinc-300 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none dark:hover:border-white/[0.15]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {card.label}
                </p>
                <Icon
                  className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${valueClass}`}
              >
                {card.value}
              </p>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {card.helper}
              </p>
            </Link>
          );
        })}
      </section>

      {/* Graficos interativos Recharts */}
      <DashboardCharts
        attendanceByClassroom={attendanceByClassroom}
        occurrencesByType={occurrencesByType}
        schoolPrimaryColor={schoolConfig.primaryColor}
      />

      {/* Alertas Pedagogicos + Ocorrencias Recentes */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        <section
          id="alertas-pedagogicos"
          aria-labelledby="alertas-heading"
          className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
        >
          <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-3.5 dark:border-white/[0.08]">
            <div>
              <h3
                id="alertas-heading"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Alertas Pedagógicos
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Estudantes com frequência inferior a 75% ou média geral abaixo de 6,0
              </p>
            </div>
            <span className="font-mono text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              {alertStudents.length}
            </span>
          </div>

          {alertStudents.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Nenhum estudante em alerta no momento
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Todos os alunos acompanhados estão dentro dos índices mínimos de frequência e
                desempenho.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
              {alertStudents.map((student) => (
                <li
                  key={student.studentId}
                  className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-white/[0.02]"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={student.studentName} size="sm" className="mt-0.5" />
                    <div className="min-w-0 space-y-1">
                      <div>
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {student.studentName}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {student.classroomName} · {student.classroomSubject} ·{" "}
                          <span className="font-mono tabular-nums">{student.registration}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {student.reasons.includes("LOW_ATTENDANCE") &&
                        student.attendanceRate !== null ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-red-200/80 bg-red-50/70 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                            Freq.: {student.attendanceRate}%
                          </span>
                        ) : null}
                        {student.reasons.includes("LOW_GRADE") &&
                        student.overallAverage !== null ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50/70 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                            Média: {formatScoreBr(student.overallAverage)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/alunos/${student.studentId}/ficha`}
                    className="inline-flex h-8 w-fit shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Abrir Ficha</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="ocorrencias-recentes-heading"
          className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
        >
          <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-3.5 dark:border-white/[0.08]">
            <div>
              <h3
                id="ocorrencias-recentes-heading"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Ocorrências Recentes
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Últimos 5 registros disciplinares e pedagógicos
              </p>
            </div>
            <Link
              href="/dashboard/ocorrencias"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <span>Ver todas</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>

          {recentOccurrences.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
                <FileWarning className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Sem ocorrências registradas
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Os registros adicionados em Ocorrências aparecerão neste resumo.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
              {recentOccurrences.map((item) => {
                const isPraise = item.type === "ELOGIO";

                return (
                  <li
                    key={item.id}
                    className="space-y-2 px-5 py-3.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            isPraise
                              ? OCCURRENCE_PRAISE_STYLE
                              : "border border-zinc-200/80 bg-zinc-50 text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300"
                          }`}
                        >
                          {OCCURRENCE_TYPE_LABELS[item.type]}
                        </span>
                        {!isPraise ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${OCCURRENCE_SEVERITY_STYLES[item.severity]}`}
                          >
                            {OCCURRENCE_SEVERITY_LABELS[item.severity]}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${OCCURRENCE_STATUS_STYLES[item.status]}`}
                        >
                          {OCCURRENCE_STATUS_LABELS[item.status]}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                        <Calendar className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        {formatIsoDateBr(item.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar name={item.student.name} size="xs" />
                      <div className="min-w-0 truncate">
                        <Link
                          href={`/dashboard/alunos/${item.student.id}/ficha`}
                          className="text-sm font-medium text-zinc-900 hover:text-[var(--school-primary)] hover:underline dark:text-zinc-100"
                        >
                          {item.student.name}
                        </Link>
                        <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {item.classroom.name} · {item.classroom.subject}
                        </span>
                      </div>
                    </div>

                    <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
