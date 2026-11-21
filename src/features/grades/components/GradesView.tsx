"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Award,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import {
  LOW_ATTENDANCE_THRESHOLD,
  formatIsoDateBr,
} from "@/features/attendance/constants";
import { DeleteConfirmModal } from "@/features/classrooms/components/DeleteConfirmModal";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import { Avatar } from "@/shared/components/Avatar";
import { TableSkeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import {
  calculateFinalTermAverage,
  calculateWeightedTermAverage,
} from "../calculations";
import {
  FINAL_STATUS_LABELS,
  FINAL_STATUS_STYLES,
  PASSING_GRADE_THRESHOLD,
  TERM_LABELS,
  formatScoreBr,
} from "../constants";
import {
  ACADEMIC_TERMS,
  type AcademicTerm,
  type AssessmentItem,
  type GradeSheetData,
} from "../types";
import { CreateAssessmentModal } from "./CreateAssessmentModal";

interface GradesViewProps {
  classrooms: ClassroomSummary[];
  canLockTerms: boolean;
}

type GradesTab = "term" | "annual";

function buildCellKey(studentId: string, assessmentId: string): string {
  return `${studentId}:${assessmentId}`;
}

function parseCellValue(raw: string): number | null | "INVALID" {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") {
    return null;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    return "INVALID";
  }
  return num;
}

export function GradesView({
  classrooms,
  canLockTerms,
}: GradesViewProps): React.JSX.Element {
  const toast = useToast();
  const [selectedClassroomId, setSelectedClassroomId] = useState(
    () => classrooms[0]?.id ?? ""
  );
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm>(1);
  const [activeTab, setActiveTab] = useState<GradesTab>("term");

  const [sheet, setSheet] = useState<GradeSheetData | null>(null);
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [recoveryValues, setRecoveryValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] =
    useState<AssessmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hydrateSheet = useCallback((data: GradeSheetData) => {
    setSheet(data);
    const nextValues: Record<string, string> = {};
    const nextRecoveries: Record<string, string> = {};

    for (const student of data.students) {
      nextRecoveries[student.studentId] =
        student.recoveryScore !== null ? String(student.recoveryScore) : "";
      for (const assessment of data.assessments) {
        const score = student.scores[assessment.id];
        nextValues[buildCellKey(student.studentId, assessment.id)] =
          score !== null && score !== undefined ? String(score) : "";
      }
    }
    setCellValues(nextValues);
    setRecoveryValues(nextRecoveries);
  }, []);

  const fetchGradeSheet = useCallback(
    async (classroomId: string, term: AcademicTerm) => {
      if (!classroomId) return;
      setIsLoading(true);
      setLoadError(null);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({
          classroomId,
          term: String(term),
        });
        const response = await fetch(`/api/grades?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          let message = "Não foi possível carregar as notas.";
          try {
            const payload = (await response.json()) as Partial<ApiErrorPayload>;
            if (payload.error) {
              message = payload.error;
            }
          } catch {
            // Mantem mensagem padrao.
          }
          setLoadError(message);
          return;
        }

        const data = (await response.json()) as GradeSheetData;
        hydrateSheet(data);
      } catch {
        setLoadError("Falha de conexão ao carregar a planilha de notas.");
      } finally {
        setIsLoading(false);
      }
    },
    [hydrateSheet]
  );

  useEffect(() => {
    if (!selectedClassroomId) return;
    void fetchGradeSheet(selectedClassroomId, selectedTerm);
  }, [selectedClassroomId, selectedTerm, fetchGradeSheet]);

  function handleCellChange(
    studentId: string,
    assessmentId: string,
    value: string
  ): void {
    setCellValues((prev) => ({
      ...prev,
      [buildCellKey(studentId, assessmentId)]: value,
    }));
    setErrorMessage(null);
  }

  function handleRecoveryChange(studentId: string, value: string): void {
    setRecoveryValues((prev) => ({
      ...prev,
      [studentId]: value,
    }));
    setErrorMessage(null);
  }

  function handleAssessmentCreated(created: AssessmentItem): void {
    setIsCreateModalOpen(false);
    toast.success(`Avaliação "${created.title}" criada no ${TERM_LABELS[selectedTerm]}.`);
    void fetchGradeSheet(selectedClassroomId, selectedTerm);
  }

  async function handleToggleLock(): Promise<void> {
    if (!sheet || !canLockTerms || isTogglingLock) return;

    setIsTogglingLock(true);
    setErrorMessage(null);

    try {
      const nextLocked = !sheet.isLocked;
      const response = await fetch("/api/grades/term-lock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          term: selectedTerm,
          locked: nextLocked,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível alterar o bloqueio do trimestre.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {
          // Mantem mensagem padrao.
        }
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as {
        isLocked: boolean;
        lockedAt: string | null;
      };
      setSheet((prev) =>
        prev
          ? {
              ...prev,
              isLocked: payload.isLocked,
              lockedAt: payload.lockedAt,
            }
          : prev
      );
      toast.success(
        payload.isLocked
          ? `${TERM_LABELS[selectedTerm]} trancado para edição.`
          : `${TERM_LABELS[selectedTerm]} destrancado para lançamento de notas.`
      );
    } catch {
      const msg = "Falha de conexão com o servidor.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsTogglingLock(false);
    }
  }

  async function handleConfirmDeleteAssessment(): Promise<void> {
    if (!assessmentToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/assessments/${assessmentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "Não foi possível excluir a avaliação.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setDeleteError(message);
        toast.error(message);
        return;
      }

      const deletedTitle = assessmentToDelete.title;
      setAssessmentToDelete(null);
      toast.success(`Avaliação "${deletedTitle}" excluída.`);
      await fetchGradeSheet(selectedClassroomId, selectedTerm);
    } catch {
      const msg = "Falha de conexão com o servidor. Tente novamente.";
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSaveGrades(): Promise<void> {
    if (!sheet || sheet.students.length === 0 || sheet.isLocked) return;

    setErrorMessage(null);

    const gradeEntries: Array<{
      assessmentId: string;
      studentId: string;
      score: number | null;
    }> = [];

    const recoveryEntries: Array<{
      studentId: string;
      score: number | null;
    }> = [];

    for (const student of sheet.students) {
      for (const assessment of sheet.assessments) {
        const raw = cellValues[buildCellKey(student.studentId, assessment.id)] ?? "";
        const parsed = parseCellValue(raw);

        if (parsed === "INVALID") {
          const msg = `Valor inválido na nota de ${student.name} em "${assessment.title}".`;
          setErrorMessage(msg);
          toast.warning(msg);
          return;
        }

        if (parsed !== null && (parsed < 0 || parsed > assessment.maxScore)) {
          const msg = `A nota de ${student.name} em "${assessment.title}" deve estar entre 0 e ${assessment.maxScore}.`;
          setErrorMessage(msg);
          toast.warning(msg);
          return;
        }

        gradeEntries.push({
          assessmentId: assessment.id,
          studentId: student.studentId,
          score: parsed,
        });
      }

      const rawRec = recoveryValues[student.studentId] ?? "";
      const parsedRec = parseCellValue(rawRec);
      if (parsedRec === "INVALID" || (parsedRec !== null && (parsedRec < 0 || parsedRec > 10))) {
        const msg = `A nota de recuperação de ${student.name} deve estar entre 0 e 10.`;
        setErrorMessage(msg);
        toast.warning(msg);
        return;
      }

      recoveryEntries.push({
        studentId: student.studentId,
        score: parsedRec,
      });
    }

    setIsSaving(true);

    try {
      if (sheet.assessments.length > 0) {
        const gradesRes = await fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classroomId: selectedClassroomId,
            term: selectedTerm,
            entries: gradeEntries,
          }),
        });

        if (!gradesRes.ok) {
          let message = "Não foi possível salvar as notas.";
          try {
            const payload = (await gradesRes.json()) as Partial<ApiErrorPayload>;
            if (payload.error) message = payload.error;
          } catch {
            // Mantem mensagem padrao.
          }
          setErrorMessage(message);
          toast.error(message);
          return;
        }
      }

      const recoveryRes = await fetch("/api/grades/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          term: selectedTerm,
          entries: recoveryEntries,
        }),
      });

      if (!recoveryRes.ok) {
        let message = "Não foi possível salvar as notas de recuperação.";
        try {
          const payload = (await recoveryRes.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {
          // Mantem mensagem padrao.
        }
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const payload = (await recoveryRes.json()) as { sheet: GradeSheetData };
      hydrateSheet(payload.sheet);
      toast.success(
        `Notas e recuperação do ${TERM_LABELS[selectedTerm]} salvas com sucesso.`,
        "Planilha atualizada"
      );
    } catch {
      const msg = "Falha de conexão com o servidor. Tente salvar novamente.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  if (classrooms.length === 0) {
    return (
      <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <GraduationCap className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          Nenhuma turma disponível para lançamento de notas
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Cadastre ou vincule uma turma em Turmas para criar avaliações e lançar notas.
        </p>
        <div className="mt-5">
          <Link
            href="/dashboard/turmas"
            className="inline-flex items-center rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--school-primary-hover)]"
          >
            Ir para Turmas
          </Link>
        </div>
      </section>
    );
  }

  const isLocked = Boolean(sheet?.isLocked);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-[1.5fr_1fr]">
            <div className="space-y-1.5">
              <label
                htmlFor="grades-classroom"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Turma
              </label>
              <select
                id="grades-classroom"
                value={selectedClassroomId}
                onChange={(event) => setSelectedClassroomId(event.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name} - {classroom.subject} ({SHIFT_LABELS[classroom.shift]} /{" "}
                    {classroom.year})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="grades-term"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Trimestre
              </label>
              <select
                id="grades-term"
                value={selectedTerm}
                onChange={(event) =>
                  setSelectedTerm(Number(event.target.value) as AcademicTerm)
                }
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {ACADEMIC_TERMS.map((term) => (
                  <option key={term} value={term}>
                    {TERM_LABELS[term]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedClassroomId ? (
              <a
                href={`/api/classrooms/${selectedClassroomId}/export-csv`}
                download
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span>Exportar Planilha (CSV)</span>
              </a>
            ) : null}

            {canLockTerms && sheet ? (
              <button
                type="button"
                onClick={handleToggleLock}
                disabled={isTogglingLock || isLoading}
                className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  isLocked
                    ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {isTogglingLock ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : isLocked ? (
                  <LockOpen className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Lock className="h-4 w-4" strokeWidth={1.75} />
                )}
                <span>{isLocked ? "Destrancar Trimestre" : "Trancar Trimestre"}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isLocked || isLoading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              <span>Nova Avaliação</span>
            </button>

            <button
              type="button"
              onClick={handleSaveGrades}
              disabled={
                isSaving ||
                isLoading ||
                isLocked ||
                !sheet ||
                sheet.students.length === 0
              }
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  <span>Salvar Notas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-barra: abas + indicador de status do trimestre */}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div
            className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
            role="tablist"
            aria-label="Visualização da planilha de notas"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "term"}
              onClick={() => setActiveTab("term")}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "term"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Notas e Recuperação ({selectedTerm}º Trim.)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "annual"}
              onClick={() => setActiveTab("annual")}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "annual"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              <Award className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Resumo Anual / Situação Final</span>
            </button>
          </div>

          {sheet ? (
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                isLocked
                  ? "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30"
                  : "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30"
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>Trimestre Trancado</span>
                </>
              ) : (
                <>
                  <LockOpen className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>Trimestre Aberto</span>
                </>
              )}
            </span>
          ) : null}
        </div>
      </section>

      {isLocked ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={1.75} />
          <span>
            O {TERM_LABELS[selectedTerm]} está fechado para edições.{" "}
            {canLockTerms
              ? "Use o botão Destrancar Trimestre acima caso precise realizar correções."
              : "Solicite à Coordenação ou Administração caso seja necessário destrancar."}
          </span>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" strokeWidth={1.75} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {loadError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" strokeWidth={1.75} />
          <span>{loadError}</span>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
        {isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : !sheet || sheet.students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Users className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Nenhum aluno ativo nesta turma
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Cadastre alunos na turma para habilitar o lançamento de notas.
            </p>
          </div>
        ) : activeTab === "annual" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300">
                  <th scope="col" className="min-w-[230px] py-3.5 pr-4 pl-5">
                    Estudante
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    1º Trim.
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    2º Trim.
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    3º Trim.
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    Média Anual
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    Frequência
                  </th>
                  <th scope="col" className="py-3.5 pr-5 pl-3 text-right">
                    Situação Final
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {sheet.students.map((student, index) => {
                  const isLowAtt =
                    student.attendanceRate !== null &&
                    student.attendanceRate < LOW_ATTENDANCE_THRESHOLD;
                  const isLowAnnual =
                    student.annualAverage !== null &&
                    student.annualAverage < PASSING_GRADE_THRESHOLD;

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3 pr-4 pl-5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[11px] text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <Avatar name={student.name} size="xs" />
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/alunos/${student.studentId}/ficha`}
                              className="block truncate font-medium text-slate-900 hover:text-[var(--school-primary)] hover:underline dark:text-slate-100 dark:hover:text-blue-400"
                            >
                              {student.name}
                            </Link>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {student.registration}
                            </p>
                          </div>
                        </div>
                      </td>
                      {ACADEMIC_TERMS.map((t) => {
                        const val = student.termFinals[t];
                        return (
                          <td
                            key={t}
                            className="px-3 py-3 text-center font-mono text-xs font-semibold text-slate-800 dark:text-slate-200"
                          >
                            {formatScoreBr(val)}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex min-w-[48px] items-center justify-center rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                            student.annualAverage === null
                              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              : isLowAnnual
                                ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
                                : "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30"
                          }`}
                        >
                          {formatScoreBr(student.annualAverage)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-xs font-semibold">
                        <span
                          className={
                            isLowAtt
                              ? "text-red-700 dark:text-red-400"
                              : "text-slate-700 dark:text-slate-300"
                          }
                        >
                          {student.attendanceRate !== null
                            ? `${student.attendanceRate}%`
                            : "-"}
                        </span>
                      </td>
                      <td className="py-3 pr-5 pl-3 text-right">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${FINAL_STATUS_STYLES[student.finalStatus]}`}
                        >
                          {FINAL_STATUS_LABELS[student.finalStatus]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : sheet.assessments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[var(--school-primary)] dark:bg-blue-500/15 dark:text-blue-300">
              <FileSpreadsheet className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Nenhuma avaliação cadastrada no {TERM_LABELS[selectedTerm]}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Crie provas, trabalhos ou atividades clicando em Nova Avaliação para liberar a
              planilha de notas e recuperação paralela.
            </p>
            {!isLocked ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--school-primary-hover)]"
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                <span>Criar primeira avaliação</span>
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 min-w-[235px] border-r border-slate-200 bg-slate-50 py-3.5 pr-4 pl-5 dark:border-slate-800 dark:bg-slate-800"
                  >
                    Estudante
                  </th>
                  {sheet.assessments.map((assessment) => (
                    <th
                      key={assessment.id}
                      scope="col"
                      className="min-w-[140px] border-r border-slate-200/80 px-3 py-3 align-top dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {assessment.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            {formatIsoDateBr(assessment.date)}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            Máx {assessment.maxScore} · Peso {assessment.weight}
                          </p>
                        </div>
                        {!isLocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setAssessmentToDelete(assessment);
                            }}
                            aria-label={`Excluir avaliação ${assessment.title}`}
                            title="Excluir avaliação"
                            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                        ) : null}
                      </div>
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="min-w-[100px] border-r border-slate-200/80 bg-slate-100/70 px-3 py-3.5 text-center font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
                  >
                    Média Orig.
                  </th>
                  <th
                    scope="col"
                    className="min-w-[125px] border-r border-slate-200/80 bg-amber-50/60 px-3 py-3.5 text-center font-semibold text-amber-900 dark:border-slate-800 dark:bg-amber-500/10 dark:text-amber-300"
                  >
                    Recuperação
                  </th>
                  <th
                    scope="col"
                    className="min-w-[115px] bg-slate-100/90 px-4 py-3.5 text-center font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  >
                    Média Final
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {sheet.students.map((student, index) => {
                  const liveOriginalAvg = calculateWeightedTermAverage(
                    sheet.assessments.map((assessment) => {
                      const raw =
                        cellValues[buildCellKey(student.studentId, assessment.id)] ?? "";
                      const parsed = parseCellValue(raw);
                      return {
                        score:
                          parsed !== null &&
                          parsed !== "INVALID" &&
                          parsed >= 0 &&
                          parsed <= assessment.maxScore
                            ? parsed
                            : null,
                        maxScore: assessment.maxScore,
                        weight: assessment.weight,
                      };
                    })
                  );

                  const rawRecovery = recoveryValues[student.studentId] ?? "";
                  const parsedRecovery = parseCellValue(rawRecovery);
                  const isRecoveryInvalid =
                    parsedRecovery === "INVALID" ||
                    (parsedRecovery !== null &&
                      (parsedRecovery < 0 || parsedRecovery > 10));
                  const validRecovery =
                    parsedRecovery !== null &&
                    parsedRecovery !== "INVALID" &&
                    parsedRecovery >= 0 &&
                    parsedRecovery <= 10
                      ? parsedRecovery
                      : null;

                  const liveFinalAverage = calculateFinalTermAverage(
                    liveOriginalAvg,
                    validRecovery
                  );

                  const finalAvgClass =
                    liveFinalAverage === null
                      ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      : liveFinalAverage >= PASSING_GRADE_THRESHOLD
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30"
                        : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30";

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="sticky left-0 z-10 border-r border-slate-200 bg-white py-3 pr-4 pl-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <Avatar name={student.name} size="xs" />
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/alunos/${student.studentId}/ficha`}
                              className="block truncate font-medium text-slate-900 hover:text-[var(--school-primary)] hover:underline dark:text-slate-100 dark:hover:text-blue-400"
                            >
                              {student.name}
                            </Link>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {student.registration}
                            </p>
                          </div>
                        </div>
                      </td>

                      {sheet.assessments.map((assessment) => {
                        const cellKey = buildCellKey(student.studentId, assessment.id);
                        const raw = cellValues[cellKey] ?? "";
                        const parsed = parseCellValue(raw);
                        const isOutOfRange =
                          parsed === "INVALID" ||
                          (parsed !== null &&
                            (parsed < 0 || parsed > assessment.maxScore));

                        return (
                          <td
                            key={assessment.id}
                            className="border-r border-slate-100 px-3 py-2.5 dark:border-slate-800"
                          >
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              max={assessment.maxScore}
                              step="0.1"
                              disabled={isSaving || isLocked}
                              aria-label={`Nota de ${student.name} em ${assessment.title}`}
                              value={raw}
                              onChange={(event) =>
                                handleCellChange(
                                  student.studentId,
                                  assessment.id,
                                  event.target.value
                                )
                              }
                              placeholder="-"
                              className={`block w-full rounded-lg border px-2.5 py-2 text-center font-mono text-sm transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-500 ${
                                isOutOfRange
                                  ? "border-red-400 bg-red-50/60 text-red-900 focus:border-red-600 focus:ring-red-200 dark:border-red-500 dark:bg-red-500/15 dark:text-red-200"
                                  : "border-slate-300 bg-white text-slate-900 focus:border-[var(--school-primary)] focus:ring-[var(--school-primary-ring)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              }`}
                            />
                          </td>
                        );
                      })}

                      <td className="border-r border-slate-100 px-3 py-2.5 text-center font-mono text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-400">
                        {formatScoreBr(liveOriginalAvg)}
                      </td>

                      <td className="border-r border-slate-100 bg-amber-50/30 px-3 py-2.5 dark:border-slate-800 dark:bg-amber-500/5">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={10}
                          step="0.1"
                          disabled={isSaving || isLocked}
                          aria-label={`Recuperação de ${student.name}`}
                          value={rawRecovery}
                          onChange={(event) =>
                            handleRecoveryChange(student.studentId, event.target.value)
                          }
                          placeholder="-"
                          className={`block w-full rounded-lg border px-2.5 py-2 text-center font-mono text-sm transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-800/40 ${
                            isRecoveryInvalid
                              ? "border-red-400 bg-red-50/60 text-red-900 dark:border-red-500 dark:bg-red-500/15 dark:text-red-200"
                              : "border-amber-300/80 bg-white text-slate-900 focus:border-amber-600 focus:ring-amber-500/20 dark:border-amber-500/40 dark:bg-slate-800 dark:text-slate-100"
                          }`}
                        />
                      </td>

                      <td className="bg-slate-50/60 px-4 py-2.5 text-center dark:bg-slate-800/40">
                        <span
                          className={`inline-flex min-w-[54px] items-center justify-center rounded-md px-2.5 py-1 font-mono text-xs font-bold ${finalAvgClass}`}
                        >
                          {formatScoreBr(liveFinalAverage)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CreateAssessmentModal
        isOpen={isCreateModalOpen}
        classroomId={selectedClassroomId}
        term={selectedTerm}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleAssessmentCreated}
      />

      <DeleteConfirmModal
        isOpen={Boolean(assessmentToDelete)}
        title="Excluir avaliação"
        description={
          assessmentToDelete
            ? `Tem certeza que deseja excluir a avaliação "${assessmentToDelete.title}"? Todas as notas lançadas nesta coluna serão removidas permanentemente.`
            : ""
        }
        confirmLabel="Excluir avaliação"
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setAssessmentToDelete(null);
        }}
        onConfirm={handleConfirmDeleteAssessment}
      />
    </div>
  );
}
