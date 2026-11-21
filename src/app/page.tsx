/* eslint-disable @next/next/no-img-element -- Exibe brasao/logo da escola em Base64 ou URL configuravel. */

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2 } from "lucide-react";
import { getAuthenticatedUser, getDefaultDashboardPath } from "@/features/auth";
import {
  buildSchoolThemeStyle,
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";
import { ValidateCodeForm } from "@/features/verifications/components/ValidateCodeForm";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";

export const dynamic = "force-dynamic";

const ROLE_PROFILES = [
  {
    index: "01",
    title: "Professores",
    description:
      "Registro diário de frequência, conteúdo ministrado, avaliações trimestrais, recuperação paralela e tarefas da turma.",
  },
  {
    index: "02",
    title: "Coordenação e Direção",
    description:
      "Acompanhamento de alertas de frequência e notas, análise de justificativas, fechamento trimestral e atas do Conselho de Classe.",
  },
  {
    index: "03",
    title: "Pais e Responsáveis",
    description:
      "Consulta ao boletim atualizado, confirmação de ciência em avisos e ocorrências, envio de justificativas e atendimento direto com a escola.",
  },
  {
    index: "04",
    title: "Estudantes",
    description:
      "Acesso organizado à grade de horários, calendário de provas, entregas de tarefas, médias trimestrais e ficha individual.",
  },
] as const;

const PREVIEW_STUDENTS = [
  {
    name: "Ana Clara Ferreira",
    attendance: "94%",
    average: "8,4",
    status: "Regular",
    attention: false,
  },
  {
    name: "Bruno Henrique Costa",
    attendance: "96%",
    average: "8,9",
    status: "Regular",
    attention: false,
  },
  {
    name: "Camila Martins Rocha",
    attendance: "82%",
    average: "6,2",
    status: "Atenção",
    attention: true,
  },
  {
    name: "Lucas Eduardo Silva",
    attendance: "92%",
    average: "7,8",
    status: "Regular",
    attention: false,
  },
] as const;

export default async function HomePage(): Promise<React.JSX.Element> {
  const [schoolConfig, user] = await Promise.all([
    getSchoolConfig().catch(() => getDefaultSchoolConfig()),
    getAuthenticatedUser().catch(() => null),
  ]);

  const locationLine = [schoolConfig.city, schoolConfig.state]
    .filter((part) => part.trim().length > 0)
    .join(" - ");

  const themeStyle = buildSchoolThemeStyle(
    schoolConfig.primaryColor
  ) as CSSProperties;

  const primaryHref = user ? getDefaultDashboardPath(user.role) : "/login";
  const navCtaLabel = user ? "Ir para o painel" : "Acessar portal";
  const heroCtaLabel = user ? "Ir para o painel" : "Entrar no sistema";

  return (
    <div
      style={themeStyle}
      className="flex min-h-[100dvh] flex-col bg-[#F7F7F8] text-zinc-900 dark:bg-[#0C0D0F] dark:text-zinc-100"
    >
      {/* Navegacao superior limpa (h-16) */}
      <header className="sticky top-0 z-40 h-16 border-b border-zinc-200/80 bg-white/95 dark:border-white/[0.08] dark:bg-[#131518]/95">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {schoolConfig.logoUrl ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 p-1 ring-1 ring-zinc-200/80 dark:bg-[#1A1D21] dark:ring-white/[0.08]">
                <img
                  src={schoolConfig.logoUrl}
                  alt={`Brasão ${schoolConfig.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--school-primary)] text-white">
                <BookOpenCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
                {schoolConfig.name}
              </p>
              <p className="hidden truncate text-[11px] text-zinc-500 sm:block dark:text-zinc-400">
                Registro de Classe Online
              </p>
            </div>
          </Link>

          <nav
            aria-label="Navegação institucional"
            className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-400"
          >
            <a
              href="#perfis"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Sobre o portal
            </a>
            <a
              href="#validacao"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Validar documento
            </a>
            <Link
              href="/login"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Entrar
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggleButton />
            <Link
              href={primaryHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-xs font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)] sm:px-4 sm:text-sm"
            >
              <span>{navCtaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section assimetrica e respiravel */}
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-6 lg:col-span-5">
              <p className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                />
                <span>
                  Ano Letivo {schoolConfig.schoolYear} · Registro de Classe Online
                </span>
              </p>

              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[42px] lg:leading-[1.12] dark:text-zinc-100">
                A rotina escolar organizada em um só lugar.
              </h1>

              <p className="max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                Chamada diária, lançamento de notas, registro de ocorrências e acompanhamento
                transparente das famílias em um portal único para toda a escola.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={primaryHref}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--school-primary)] px-5 text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)]"
                >
                  <span>{heroCtaLabel}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </Link>

                <Link
                  href="/validar"
                  className="inline-flex h-10 items-center rounded-lg border border-zinc-200/90 bg-white px-4 text-sm font-medium whitespace-nowrap text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.1] dark:bg-[#131518] dark:text-zinc-200 dark:hover:bg-[#1A1D21]"
                >
                  Validar boletim ou ata
                </Link>
              </div>
            </div>

            {/* Previa realista do sistema em janela minimalista */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
                {/* Barra discreta de janela */}
                <div className="flex h-9 items-center justify-between border-b border-zinc-200/80 bg-zinc-50/80 px-3.5 dark:border-white/[0.08] dark:bg-[#1A1D21]/70">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-white/15" />
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    diario / 9o-ano-a
                  </span>
                  <span className="text-[11px] text-zinc-400 tabular-nums dark:text-zinc-500">
                    2º Trimestre
                  </span>
                </div>

                {/* Conteudo realista da turma + aviso lateral */}
                <div className="grid grid-cols-1 divide-y divide-zinc-200/80 sm:grid-cols-12 sm:divide-x sm:divide-y-0 dark:divide-white/[0.08]">
                  <div className="p-4 sm:col-span-8 sm:p-5">
                    <div className="mb-3.5 flex items-baseline justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
                          9º Ano A · Matemática
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Resumo de frequência e média parcial
                        </p>
                      </div>
                      <span className="font-mono text-xs font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
                        28 aulas
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-200/80 text-[11px] font-medium text-zinc-400 dark:border-white/[0.08] dark:text-zinc-500">
                            <th className="pb-2 font-medium">Estudante</th>
                            <th className="pb-2 text-right font-medium">Freq.</th>
                            <th className="pb-2 text-right font-medium">Média</th>
                            <th className="pb-2 text-right font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
                          {PREVIEW_STUDENTS.map((student) => (
                            <tr key={student.name}>
                              <td className="py-2.5 pr-2 font-medium text-zinc-800 dark:text-zinc-200">
                                {student.name}
                              </td>
                              <td className="py-2.5 text-right font-mono text-zinc-600 tabular-nums dark:text-zinc-400">
                                {student.attendance}
                              </td>
                              <td className="py-2.5 text-right font-mono font-medium text-zinc-900 tabular-nums dark:text-zinc-100">
                                {student.average}
                              </td>
                              <td className="py-2.5 pl-2 text-right">
                                <span
                                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                    student.attention
                                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/12 dark:text-amber-300"
                                      : "bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300"
                                  }`}
                                >
                                  {student.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Painel lateral discreto de comunicacao */}
                  <div className="flex flex-col justify-between bg-zinc-50/60 p-4 sm:col-span-4 sm:p-5 dark:bg-[#0C0D0F]/50">
                    <div className="space-y-3">
                      <p className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                        Acompanhamento
                      </p>

                      <div className="rounded-lg border border-zinc-200/80 bg-white p-3 dark:border-white/[0.08] dark:bg-[#131518]">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          Aviso enviado ao responsável
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                          Falta registrada na 1ª aula de Matemática.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5 border-t border-zinc-100 pt-2 text-[11px] font-medium text-emerald-700 tabular-nums dark:border-white/[0.06] dark:text-emerald-400">
                          <CheckCircle2
                            className="h-3.5 w-3.5 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <span>Ciente às 14:22</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-zinc-200/70 pt-3 dark:border-white/[0.08]">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>Média da turma</span>
                        <span className="font-mono font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                          7,8
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>Presença geral</span>
                        <span className="font-mono font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                          94%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Secao de Perfis em grade editorial dividida por linhas finas */}
        <section
          id="perfis"
          className="border-t border-zinc-200/80 bg-white py-16 sm:py-20 dark:border-white/[0.08] dark:bg-[#131518]"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl">
              <p className="text-xs font-medium tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                Perfis de acesso
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-zinc-900 sm:text-[28px] dark:text-zinc-100">
                Cada perfil acessa exatamente o que precisa no dia a dia.
              </h2>
            </div>

            <div className="mt-10 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-200/80 dark:border-white/[0.08] dark:bg-white/[0.08]">
              <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
                {ROLE_PROFILES.map((profile) => (
                  <article
                    key={profile.title}
                    className="flex flex-col bg-white p-6 dark:bg-[#131518]"
                  >
                    <span className="font-mono text-xs text-zinc-400 tabular-nums dark:text-zinc-500">
                      {profile.index}
                    </span>
                    <h3 className="mt-3 text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
                      {profile.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {profile.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Faixa discreta de validacao publica de documentos */}
        <section
          id="validacao"
          className="border-t border-zinc-200/80 bg-[#F7F7F8] py-14 sm:py-16 dark:border-white/[0.08] dark:bg-[#0C0D0F]"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-6">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-900 sm:text-xl dark:text-zinc-100">
                Validar documento emitido pela escola
              </h2>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                Digite o código impresso no boletim ou na ata do Conselho de Classe para
                confirmar a autenticidade junto à secretaria.
              </p>
            </div>
            <div className="lg:col-span-6">
              <ValidateCodeForm variant="inline" />
            </div>
          </div>
        </section>
      </main>

      {/* Rodape institucional minimalista de uma linha */}
      <footer className="border-t border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#131518]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:px-6 lg:px-8 dark:text-zinc-400">
          <p className="tabular-nums">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {schoolConfig.name}
            </span>
            {locationLine ? ` · ${locationLine}` : ""} · Ano letivo {schoolConfig.schoolYear}
          </p>

          <div className="flex items-center gap-5">
            <a
              href="#perfis"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Sobre o portal
            </a>
            <Link
              href="/validar"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Validar documento
            </Link>
            <Link
              href={primaryHref}
              className="font-medium text-zinc-900 transition-colors hover:text-[var(--school-primary)] dark:text-zinc-100"
            >
              {navCtaLabel}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
