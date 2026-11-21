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
      {/* Saudacao e atalhos rapidos */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass}`}
              >
                {roleLabel}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {user.role === "PROFESSOR"
                  ? "Indicadores das suas turmas"
                  : "Visão consolidada da unidade escolar"}
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
              Olá, {user.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.primary
                      ? "inline-flex items-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98]"
                      : "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 cards de resumo */}
      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const iconWrapClass =
            card.tone === "danger"
              ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
              : card.tone === "warning"
                ? "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30"
                : card.tone === "success"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30"
                  : "bg-blue-50 text-[var(--school-primary)] ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30";

          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:ring-[var(--school-primary-soft-border)] dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${iconWrapClass}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
        <section
          id="alertas-pedagogicos"
          aria-labelledby="alertas-heading"
          className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800"
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 sm:px-6 dark:border-slate-800">
            <div>
              <h3
                id="alertas-heading"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Alertas Pedagógicos
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Estudantes com frequência inferior a 75% ou média geral abaixo de 6,0
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
              {alertStudents.length}
            </span>
          </div>

          {alertStudents.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Nenhum estudante em alerta no momento
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Todos os alunos acompanhados estão dentro dos índices mínimos de frequência e
                desempenho.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {alertStudents.map((student) => (
                <li
                  key={student.studentId}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:hover:bg-slate-800/50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={student.studentName} size="md" className="mt-0.5" />
                    <div className="min-w-0 space-y-1.5">
                      <div>
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {student.studentName}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {student.classroomName} - {student.classroomSubject} ·{" "}
                          <span className="font-mono">{student.registration}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {student.reasons.includes("LOW_ATTENDANCE") &&
                        student.attendanceRate !== null ? (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30">
                            Freq.: {student.attendanceRate}%
                          </span>
                        ) : null}
                        {student.reasons.includes("LOW_GRADE") &&
                        student.overallAverage !== null ? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30">
                            Média: {formatScoreBr(student.overallAverage)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/alunos/${student.studentId}/ficha`}
                    className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
          className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800"
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 sm:px-6 dark:border-slate-800">
            <div>
              <h3
                id="ocorrencias-recentes-heading"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Ocorrências Recentes
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Últimos 5 registros disciplinares e pedagógicos
              </p>
            </div>
            <Link
              href="/dashboard/ocorrencias"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--school-primary)] hover:underline dark:text-blue-400"
            >
              <span>Ver todas</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>

          {recentOccurrences.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <FileWarning className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Sem ocorrências registradas
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Os registros adicionados em Ocorrências aparecerão neste resumo.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOccurrences.map((item) => {
                const isPraise = item.type === "ELOGIO";

                return (
                  <li key={item.id} className="space-y-2 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            isPraise
                              ? OCCURRENCE_PRAISE_STYLE
                              : "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                          }`}
                        >
                          {OCCURRENCE_TYPE_LABELS[item.type]}
                        </span>
                        {!isPraise ? (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${OCCURRENCE_SEVERITY_STYLES[item.severity]}`}
                          >
                            {OCCURRENCE_SEVERITY_LABELS[item.severity]}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${OCCURRENCE_STATUS_STYLES[item.status]}`}
                        >
                          {OCCURRENCE_STATUS_LABELS[item.status]}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        {formatIsoDateBr(item.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Avatar name={item.student.name} size="xs" />
                      <div className="min-w-0 truncate">
                        <Link
                          href={`/dashboard/alunos/${item.student.id}/ficha`}
                          className="text-sm font-semibold text-slate-900 hover:text-[var(--school-primary)] hover:underline dark:text-slate-100 dark:hover:text-blue-400"
                        >
                          {item.student.name}
                        </Link>
                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                          {item.classroom.name} - {item.classroom.subject}
                        </span>
                      </div>
                    </div>

                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
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
