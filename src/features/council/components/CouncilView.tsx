"use client";
/* eslint-disable @next/next/no-img-element -- Brasao da escola na versao imprimivel da Ata A4. */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  AlertTriangle,
  BookOpenCheck,
  FileWarning,
  GraduationCap,
  Loader2,
  Printer,
  Save,
  ScrollText,
  Users,
} from "lucide-react";
import {
  LOW_ATTENDANCE_THRESHOLD,
  formatIsoDateBr,
  getTodayIsoDate,
} from "@/features/attendance/constants";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import {
  PASSING_GRADE_THRESHOLD,
  TERM_LABELS,
  formatScoreBr,
} from "@/features/grades/constants";
import { ACADEMIC_TERMS, type AcademicTerm } from "@/features/grades/types";
import { Avatar } from "@/shared/components/Avatar";
import { DashboardPageSkeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import type { ClassCouncilPayload } from "../types";

interface CouncilViewProps {
  classrooms: ClassroomSummary[];
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500";

export function CouncilView({
  classrooms,
}: CouncilViewProps): React.JSX.Element {
  const toast = useToast();
  const [selectedClassroomId, setSelectedClassroomId] = useState(
    () => classrooms[0]?.id ?? ""
  );
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm>(1);
  const [data, setData] = useState<ClassCouncilPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [date, setDate] = useState(() => getTodayIsoDate());
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const fetchCouncil = useCallback(
    async (classroomId: string, term: AcademicTerm) => {
      if (!classroomId) return;
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          classroomId,
          term: String(term),
        });
        const response = await fetch(`/api/council?${params.toString()}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const payload = (await response.json()) as ClassCouncilPayload;
          setData(payload);
          setDate(payload.minute?.date ?? getTodayIsoDate());
          setSummary(payload.minute?.summary ?? "");
          setDecisions(payload.minute?.decisions ?? "");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedClassroomId) return;
    setVerificationCode(null);
    setQrCodeDataUrl(null);
    void fetchCouncil(selectedClassroomId, selectedTerm);
  }, [selectedClassroomId, selectedTerm, fetchCouncil]);

  async function handlePrintWithVerification(): Promise<void> {
    if (!data || isPreparingPrint) return;
    setIsPreparingPrint(true);
    try {
      let currentCode = verificationCode;
      if (!currentCode) {
        const res = await fetch("/api/verifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docType: "ATA_CONSELHO",
            title: `Ata de Conselho de Classe - ${TERM_LABELS[selectedTerm]}`,
            subjectName: data.classroom.name,
            classroomName: `${data.classroom.name} - ${data.classroom.subject}`,
            summary: {
              schoolYear: data.classroom.year,
              termLabel: TERM_LABELS[selectedTerm],
              totalStudents: data.metrics.totalStudents,
              belowAverageCount: data.metrics.belowAverageCount,
              lowAttendanceCount: data.metrics.lowAttendanceCount,
            },
          }),
        });
        if (res.ok) {
          const payload = (await res.json()) as {
            code: string;
            verificationUrl: string;
          };
          currentCode = payload.code;
          setVerificationCode(payload.code);
          const dataUrl = await QRCode.toDataURL(payload.verificationUrl, {
            width: 144,
            margin: 1,
            color: { dark: "#0f172a", light: "#ffffff" },
          });
          setQrCodeDataUrl(dataUrl);
          // Aguarda um frame para garantir que a imagem do QR Code esteja no DOM antes do print
          await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));
        }
      }
    } catch {
      // Prossegue para impressao mesmo se offline.
    } finally {
      setIsPreparingPrint(false);
      window.print();
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (summary.trim().length < 5 || decisions.trim().length < 5) {
      toast.warning(
        "Preencha o Parecer Geral e as Decisões/Encaminhamentos (mínimo 5 caracteres cada)."
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          term: selectedTerm,
          date,
          summary: summary.trim(),
          decisions: decisions.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível salvar a ata do conselho.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as ClassCouncilPayload;
      setData(payload);
      toast.success(
        `Ata do ${TERM_LABELS[selectedTerm]} salva com sucesso.`,
        "Conselho de Classe"
      );
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsSaving(false);
    }
  }

  if (classrooms.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-200/80 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
          <ScrollText className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h2 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Nenhuma turma disponível para Conselho de Classe
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
          Cadastre ou vincule uma turma em Turmas para elaborar atas do conselho.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecalho de pagina (oculto na impressao) */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
            Conselho de Classe
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Consolidado trimestral da turma, redação da ata oficial e emissão em folha A4.
          </p>
        </div>

        <button
          type="button"
          disabled={!data || isLoading || isPreparingPrint}
          onClick={() => void handlePrintWithVerification()}
          className="inline-flex h-9 w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200/90 bg-white px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-white/[0.09] dark:bg-[#131518] dark:text-zinc-200 dark:hover:bg-[#1A1D21]"
        >
          {isPreparingPrint ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" strokeWidth={1.75} />
          )}
          <span>
            {isPreparingPrint ? "Gerando selo..." : "Imprimir / Salvar Ata (PDF)"}
          </span>
        </button>
      </header>

      {/* Seletores (ocultos na impressao) */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none print:hidden">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
          <div className="space-y-1.5">
            <label
              htmlFor="council-classroom"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Turma
            </label>
            <select
              id="council-classroom"
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className={INPUT_CLASS}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.subject} ({SHIFT_LABELS[c.shift]} / {c.year})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="council-term"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Trimestre
            </label>
            <select
              id="council-term"
              value={selectedTerm}
              onChange={(e) =>
                setSelectedTerm(Number(e.target.value) as AcademicTerm)
              }
              className={INPUT_CLASS}
            >
              {ACADEMIC_TERMS.map((t) => (
                <option key={t} value={t}>
                  {TERM_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {isLoading || !data ? (
        <div className="print:hidden">
          <DashboardPageSkeleton />
        </div>
      ) : (
        <>
          {/* Visao interativa de tela (oculta na impressao) */}
          <div className="space-y-6 print:hidden">
            {/* Resumo limpo dos numeros da turma */}
            <section className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Alunos Ativos
                  </p>
                  <Users className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
                  {data.metrics.totalStudents}
                </p>
                <p className="mt-1.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  {data.metrics.lessonsCount} aulas registradas
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Abaixo da Média (&lt; 6,0)
                  </p>
                  <GraduationCap className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />
                </div>
                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
                    data.metrics.belowAverageCount > 0
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {data.metrics.belowAverageCount}
                </p>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {TERM_LABELS[selectedTerm]} (com recuperação)
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Frequência &lt; 75%
                  </p>
                  <AlertTriangle className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />
                </div>
                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
                    data.metrics.lowAttendanceCount > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {data.metrics.lowAttendanceCount}
                </p>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Abaixo do mínimo legal
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Ocorrências da Turma
                  </p>
                  <FileWarning className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
                  {data.metrics.occurrencesCount}
                </p>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Registros disciplinares e pedagógicos
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
              {/* Editor da Ata */}
              <form
                onSubmit={handleSave}
                className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 pb-3.5 dark:border-white/[0.07]">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Ata do Conselho de Classe ({TERM_LABELS[selectedTerm]})
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {data.minute
                        ? `Última atualização por ${data.minute.authorName}`
                        : "Nenhuma ata registrada ainda para este trimestre"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="max-w-xs space-y-1.5">
                    <label
                      htmlFor="council-date"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Data da Reunião
                    </label>
                    <input
                      id="council-date"
                      type="date"
                      required
                      disabled={isSaving}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="council-summary"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Parecer Geral da Turma
                    </label>
                    <textarea
                      id="council-summary"
                      rows={5}
                      required
                      disabled={isSaving}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Descreva o perfil pedagógico da turma, avanços, dificuldades coletivas, participação e disciplina no trimestre..."
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="council-decisions"
                      className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Decisões e Encaminhamentos Pedagógicos
                    </label>
                    <textarea
                      id="council-decisions"
                      rows={5}
                      required
                      disabled={isSaving}
                      value={decisions}
                      onChange={(e) => setDecisions(e.target.value)}
                      placeholder="Registre convocações de responsáveis, planos de recuperação, reforço escolar e encaminhamentos definidos em conselho..."
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end border-t border-zinc-200/70 pt-4 dark:border-white/[0.07]">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)] disabled:opacity-65"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvando Ata...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" strokeWidth={1.75} />
                        <span>Salvar Ata</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Alunos em ponto de atencao */}
              <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
                <div className="border-b border-zinc-200/80 px-5 py-3.5 dark:border-white/[0.08]">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Estudantes em Ponto de Atenção ({data.attentionStudents.length})
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Média final do trimestre &lt; 6,0 ou frequência &lt; 75%
                  </p>
                </div>

                {data.attentionStudents.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Nenhum estudante da turma em alerta neste trimestre.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
                    {data.attentionStudents.map((st) => (
                      <li
                        key={st.studentId}
                        className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar name={st.name} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/alunos/${st.studentId}/ficha`}
                              className="block truncate text-sm font-medium text-zinc-900 hover:text-[var(--school-primary)] hover:underline dark:text-zinc-100"
                            >
                              {st.name}
                            </Link>
                            <p className="font-mono text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                              {st.registration}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {st.termFinalAverage !== null &&
                          st.termFinalAverage < PASSING_GRADE_THRESHOLD ? (
                            <span className="rounded-md border border-amber-200/80 bg-amber-50/70 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                              Média {formatScoreBr(st.termFinalAverage)}
                            </span>
                          ) : null}
                          {st.attendanceRate !== null &&
                          st.attendanceRate < LOW_ATTENDANCE_THRESHOLD ? (
                            <span className="rounded-md border border-red-200/80 bg-red-50/70 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                              Freq. {st.attendanceRate}%
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          {/* Documento A4 oficial para impressao / PDF */}
          <article className="rco-print-sheet hidden bg-white text-zinc-900 print:block">
            <header className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-zinc-900 pb-4">
              <div>
                {data.school.logoUrl ? (
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border border-zinc-200 bg-white p-1">
                    <img
                      src={data.school.logoUrl}
                      alt={`Logo ${data.school.name}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-zinc-900 bg-zinc-900 text-white">
                    <BookOpenCheck className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold tracking-wider text-zinc-600 uppercase">
                  {data.school.name}
                </p>
                <h1 className="mt-0.5 text-lg font-bold tracking-[-0.02em] text-zinc-900">
                  Ata de Conselho de Classe · {TERM_LABELS[selectedTerm]}
                </h1>
                <p className="mt-0.5 text-xs text-zinc-600 tabular-nums">
                  {data.classroom.name} · {data.classroom.subject} (
                  {SHIFT_LABELS[data.classroom.shift]}) · Ano Letivo{" "}
                  {data.classroom.year}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-zinc-500 tabular-nums">
                  Data: {formatIsoDateBr(date)} · Prof. {data.classroom.teacherName}
                </p>
              </div>

              <div className="flex justify-end">
                {qrCodeDataUrl ? (
                  <div className="flex flex-col items-center rounded border border-zinc-300 bg-white p-1.5 text-center">
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code de validação antifraude da Ata"
                      width={68}
                      height={68}
                      className="h-[68px] w-[68px]"
                    />
                    {verificationCode ? (
                      <span className="mt-1 font-mono text-[8.5px] font-semibold text-zinc-900">
                        {verificationCode}
                      </span>
                    ) : null}
                    <span className="text-[8px] text-zinc-500">
                      Validação digital
                    </span>
                  </div>
                ) : null}
              </div>
            </header>

            <section className="print-avoid-break mt-6">
              <h2 className="border-b border-zinc-300 pb-1 text-xs font-semibold tracking-wider text-zinc-700 uppercase">
                1. Indicadores Consolidados da Turma
              </h2>
              <div className="mt-3 overflow-hidden rounded border border-zinc-300">
                <div className="grid grid-cols-4 divide-x divide-zinc-300 text-center text-xs">
                  <div className="p-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">Alunos Ativos</p>
                    <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                      {data.metrics.totalStudents}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">Abaixo da Média</p>
                    <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                      {data.metrics.belowAverageCount}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">Freq. &lt; 75%</p>
                    <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                      {data.metrics.lowAttendanceCount}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">Ocorrências</p>
                    <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                      {data.metrics.occurrencesCount}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {data.attentionStudents.length > 0 ? (
              <section className="print-avoid-break mt-6">
                <h2 className="border-b border-zinc-300 pb-1 text-xs font-semibold tracking-wider text-zinc-700 uppercase">
                  2. Estudantes em Acompanhamento Prioritário
                </h2>
                <table className="mt-2.5 w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-300 text-[11px] text-zinc-600 uppercase">
                      <th className="py-1.5 font-semibold">Estudante</th>
                      <th className="py-1.5 font-semibold">Matrícula</th>
                      <th className="py-1.5 text-center font-semibold">Média Final</th>
                      <th className="py-1.5 text-center font-semibold">Frequência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {data.attentionStudents.map((st) => (
                      <tr key={st.studentId}>
                        <td className="py-1.5 font-medium">{st.name}</td>
                        <td className="py-1.5 font-mono tabular-nums">{st.registration}</td>
                        <td className="py-1.5 text-center font-mono tabular-nums">
                          {formatScoreBr(st.termFinalAverage)}
                        </td>
                        <td className="py-1.5 text-center font-mono tabular-nums">
                          {st.attendanceRate !== null ? `${st.attendanceRate}%` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            <section className="print-avoid-break mt-6">
              <h2 className="border-b border-zinc-300 pb-1 text-xs font-semibold tracking-wider text-zinc-700 uppercase">
                {data.attentionStudents.length > 0 ? "3." : "2."} Parecer Geral da Turma
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-800">
                {summary || "(Sem parecer registrado)"}
              </p>
            </section>

            <section className="print-avoid-break mt-6">
              <h2 className="border-b border-zinc-300 pb-1 text-xs font-semibold tracking-wider text-zinc-700 uppercase">
                {data.attentionStudents.length > 0 ? "4." : "3."} Decisões e Encaminhamentos
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-800">
                {decisions || "(Sem encaminhamentos registrados)"}
              </p>
            </section>

            <footer className="print-avoid-break mt-14 grid grid-cols-3 gap-6 border-t border-zinc-300 pt-8 text-center text-xs text-zinc-600">
              <div>
                <div className="mx-auto mb-2 w-44 border-b border-zinc-400" />
                <p className="font-semibold text-zinc-900">
                  {data.classroom.teacherName}
                </p>
                <p className="text-[11px] text-zinc-500">Professor(a)</p>
              </div>
              <div>
                <div className="mx-auto mb-2 w-44 border-b border-zinc-400" />
                <p className="font-semibold text-zinc-900">Coordenação Pedagógica</p>
                <p className="text-[11px] text-zinc-500">Assinatura / Carimbo</p>
              </div>
              <div>
                <div className="mx-auto mb-2 w-44 border-b border-zinc-400" />
                <p className="font-semibold text-zinc-900">Direção Escolar</p>
                <p className="text-[11px] text-zinc-500">Assinatura / Carimbo</p>
              </div>
            </footer>
          </article>
        </>
      )}
    </div>
  );
}
