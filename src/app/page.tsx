/* eslint-disable @next/next/no-img-element -- Exibe brasao/logo da escola em Base64 ou URL configuravel. */

import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  GraduationCap,
  HeartHandshake,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getAuthenticatedUser, getDefaultDashboardPath } from "@/features/auth";
import {
  buildSchoolThemeStyle,
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";

export const dynamic = "force-dynamic";

const ROLE_PORTALS = [
  {
    title: "Professores",
    description:
      "Chamada diária em segundos, diário de conteúdo, lançamento de avaliações, recuperação paralela e planejamento de aulas.",
    icon: BookOpen,
    accentClass:
      "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:bg-blue-400/15 dark:text-blue-300 dark:ring-blue-400/25",
  },
  {
    title: "Coordenação & Direção",
    description:
      "Painel gerencial com alertas pedagógicos, aprovação de justificativas de falta, Conselho de Classe e relatórios em PDF.",
    icon: ShieldCheck,
    accentClass:
      "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:bg-indigo-400/15 dark:text-indigo-300 dark:ring-indigo-400/25",
  },
  {
    title: "Pais e Responsáveis",
    description:
      "Boletim em tempo real, alertas de falta e ocorrências com confirmação de ciência, justificativa online e mural de comunicados.",
    icon: HeartHandshake,
    accentClass:
      "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/25",
  },
  {
    title: "Estudantes",
    description:
      "Consulta clara da grade de horários, calendário de provas e trabalhos, médias trimestrais e ficha escolar oficial.",
    icon: GraduationCap,
    accentClass:
      "bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/25",
  },
];

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
  const primaryLabel = user ? "Ir para meu Painel" : "Acessar Sistema";

  return (
    <div
      style={themeStyle}
      className="min-h-[100dvh] bg-[#F6F8FA] text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100"
    >
      {/* Cabecalho institucional translucido */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {schoolConfig.logoUrl ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-slate-200/90 dark:ring-slate-700">
                <img
                  src={schoolConfig.logoUrl}
                  alt={`Brasão ${schoolConfig.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--school-primary)] text-white shadow-xs">
                <BookOpenCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base dark:text-white">
                {schoolConfig.name}
              </p>
              <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
                Registro de Classe Online
              </p>
            </div>
          </Link>

          <nav
            aria-label="Navegação institucional"
            className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-300"
          >
            <a
              href="#recursos"
              className="transition-colors hover:text-[var(--school-primary)] dark:hover:text-white"
            >
              Recursos
            </a>
            <a
              href="#perfis"
              className="transition-colors hover:text-[var(--school-primary)] dark:hover:text-white"
            >
              Portal da Família
            </a>
            <a
              href="#validacao"
              className="transition-colors hover:text-[var(--school-primary)] dark:hover:text-white"
            >
              Validar Documento
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <ThemeToggleButton />
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--school-primary)] px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--school-primary-hover)] active:scale-[0.98] sm:px-5 sm:text-sm"
            >
              <span>{primaryLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section em split-screen assimetrico */}
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white dark:border-slate-800/80 dark:bg-slate-950">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-24 h-80 opacity-40 dark:opacity-25"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 0%, var(--school-primary-soft), transparent 75%)",
            }}
          />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pt-20 lg:pb-24">
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <span
                  className="h-2 w-2 rounded-full bg-[var(--school-primary)]"
                  aria-hidden="true"
                />
                <span>
                  Ano letivo {schoolConfig.schoolYear}
                  {locationLine ? ` · ${locationLine}` : ""}
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.08] dark:text-white">
                Gestão pedagógica integrada da sala de aula até a família.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                Frequência diária, boletim trimestral, comunicados oficiais e ficha escolar
                em PDF reunidos em um ambiente seguro para toda a comunidade.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={primaryHref}
                  className="group inline-flex items-center gap-3 rounded-full bg-[var(--school-primary)] py-2.5 pr-2.5 pl-6 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--school-primary-hover)] active:scale-[0.98]"
                >
                  <span>{primaryLabel}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  </span>
                </Link>

                <a
                  href="#recursos"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold whitespace-nowrap text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  <span>Explorar recursos</span>
                </a>
              </div>
            </div>

            {/* Vitrine visual em HTML/Tailwind simulando os cartoes reais do RCO */}
            <div className="lg:col-span-6">
              <div className="rounded-[1.75rem] bg-slate-900/[0.04] p-2 ring-1 ring-slate-900/[0.08] dark:bg-white/[0.04] dark:ring-white/10">
                <div className="space-y-3.5 rounded-[1.35rem] bg-[#F8FAFC] p-4 shadow-[var(--shadow-ambient)] sm:p-5 dark:bg-slate-900">
                  {/* Card 1: Frequencia diaria */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: "var(--school-primary-soft)",
                            color: "var(--school-primary)",
                          }}
                        >
                          <ClipboardCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Chamada · 9º Ano A
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Matemática · 1ª aula registrada
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        94% presença
                      </span>
                    </div>
                    <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full w-[94%] rounded-full"
                        style={{ backgroundColor: "var(--school-primary)" }}
                      />
                    </div>
                  </div>

                  {/* Card 2 + Card 3 */}
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Boletim Trimestral
                        </span>
                        <span className="rounded-md bg-emerald-500/12 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          Aprovado
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        8,6
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                        <div className="rounded-lg bg-slate-50 py-1.5 dark:bg-slate-900">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">1º Trim</p>
                          <p className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                            8,2
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 py-1.5 dark:bg-slate-900">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">2º Trim</p>
                          <p className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                            8,7
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 py-1.5 dark:bg-slate-900">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">3º Trim</p>
                          <p className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                            8,9
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-300">
                          <BellRing className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            Aviso para a Família
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            Comunicado escolar e justificativa de falta acompanhados direto pelo celular.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] font-medium text-emerald-700 dark:border-slate-800 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                        <span>Ciência confirmada pelo responsável</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Secao de Recursos em Bento assimetrico */}
        <section id="recursos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Fluxos reais para a rotina pedagógica
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
              Cada tela elimina retrabalho entre professores, coordenação e secretaria, com
              rastreabilidade completa por trimestre.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "var(--school-primary-soft)",
                  color: "var(--school-primary)",
                }}
              >
                <ClipboardCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                Chamada, Planejamento e Conselho de Classe
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Registre presença, falta ou falta justificada em lote, vincule o conteúdo
                ministrado ao plano de ensino e gere atas oficiais do Conselho prontas para
                impressão.
              </p>
            </article>

            <article
              className="rounded-2xl p-6 text-white shadow-sm lg:col-span-5"
              style={{
                background:
                  "linear-gradient(145deg, var(--school-primary) 0%, var(--school-primary-hover) 100%)",
              }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                <FileSpreadsheet className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                Planilhas CSV e Fechamento Trimestral
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Importe turmas por CSV com validação de matrículas, lance recuperação paralela,
                trave trimestres encerrados e exporte planilhas prontas para o Excel.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                <BellRing className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                Comunicação Direta com as Famílias
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Mural oficial de comunicados, alertas automáticos de falta e ocorrências, envio de
                resumos no WhatsApp e aprovação online de justificativas.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-slate-900 p-6 text-slate-100 shadow-xs lg:col-span-7 dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-300">
                <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                Instalável no celular como aplicativo (PWA)
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                Navegação inferior nativa no celular, tema claro e escuro sincronizado e busca
                rápida global com teclado para acessar qualquer estudante ou turma em segundos.
              </p>
            </article>
          </div>
        </section>

        {/* Secao de Perfis */}
        <section
          id="perfis"
          className="border-y border-slate-200/80 bg-white py-20 dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Um portal para cada integrante da escola
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                Permissões isoladas por perfil garantem sigilo acadêmico e experiência focada no
                que cada pessoa precisa consultar ou registrar.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ROLE_PORTALS.map((portal) => {
                const Icon = portal.icon;
                return (
                  <article
                    key={portal.title}
                    className="flex flex-col rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${portal.accentClass}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">
                      {portal.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {portal.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Secao Validar Documento / Ficha A4 com QR Code */}
        <section id="validacao" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-ambient)] sm:p-10 lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-4 lg:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <FileCheck2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Ficha Individual e Boletim Oficial</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Documentos escolares prontos para impressão e consulta digital
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                Todas as fichas individuais geradas pelo sistema trazem brasão institucional,
                resumo de frequência, aproveitamento por trimestre e QR Code para conferência
                direta no portal autenticado.
              </p>
              <div className="pt-1">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--school-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98]"
                >
                  <span>{user ? "Abrir meu Painel" : "Entrar para consultar documentos"}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:col-span-4 lg:justify-end">
              <div className="flex w-full max-w-[260px] flex-col items-center rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 text-center dark:border-slate-800 dark:bg-slate-950">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-xs ring-1 ring-slate-200">
                  <QrCode className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                  Consulta digital protegida
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Aponte a câmera do celular para o QR Code impresso no boletim e autentique-se
                  para visualizar os dados atualizados.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rodape institucional */}
      <footer className="border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8 dark:text-slate-400">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {schoolConfig.name}
            </p>
            <p className="mt-0.5">
              Registro de Classe Online · Ano letivo {schoolConfig.schoolYear}
              {locationLine ? ` · ${locationLine}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <a href="#recursos" className="hover:text-slate-900 dark:hover:text-white">
              Recursos
            </a>
            <a href="#perfis" className="hover:text-slate-900 dark:hover:text-white">
              Portal da Família
            </a>
            <Link
              href={primaryHref}
              className="font-semibold text-[var(--school-primary)] hover:underline dark:text-blue-400"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
