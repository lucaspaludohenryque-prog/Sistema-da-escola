"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { getTodayIsoDate } from "@/features/attendance/constants";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import type {
  ApiErrorPayload,
  ClassroomDetail,
  ClassroomSummary,
  StudentRecord,
} from "@/features/classrooms/types";
import {
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_TYPE_LABELS,
} from "../constants";
import {
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_TYPES,
  type OccurrenceItem,
  type OccurrenceSeverity,
  type OccurrenceType,
} from "../types";

interface CreateOccurrenceModalProps {
  isOpen: boolean;
  classrooms: ClassroomSummary[];
  defaultClassroomId?: string;
  onClose: () => void;
  onCreated: (occurrence: OccurrenceItem) => void;
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:bg-slate-800/50";

export function CreateOccurrenceModal({
  isOpen,
  classrooms,
  defaultClassroomId,
  onClose,
  onCreated,
}: CreateOccurrenceModalProps): React.JSX.Element | null {
  const [classroomId, setClassroomId] = useState(
    () => defaultClassroomId || classrooms[0]?.id || ""
  );
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState<OccurrenceType>("INDISCIPLINA");
  const [severity, setSeverity] = useState<OccurrenceSeverity>("LEVE");
  const [date, setDate] = useState(() => getTodayIsoDate());
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initialClass = defaultClassroomId || classrooms[0]?.id || "";
    setClassroomId(initialClass);
    setDate(getTodayIsoDate());
    setType("INDISCIPLINA");
    setSeverity("LEVE");
    setDescription("");
    setErrorMessage(null);
  }, [isOpen, defaultClassroomId, classrooms]);

  useEffect(() => {
    if (!isOpen || !classroomId) {
      setStudents([]);
      setStudentId("");
      return;
    }

    let isCancelled = false;

    async function loadStudents(): Promise<void> {
      setIsLoadingStudents(true);
      setStudentId("");
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/classrooms/${classroomId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Falha ao carregar alunos da turma.");
        }
        const payload = (await response.json()) as { classroom: ClassroomDetail };
        if (!isCancelled) {
          const activeStudents = payload.classroom.students.filter((s) => s.active);
          setStudents(activeStudents);
          setStudentId(activeStudents[0]?.id ?? "");
        }
      } catch {
        if (!isCancelled) {
          setStudents([]);
          setErrorMessage("Não foi possível carregar os alunos desta turma.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingStudents(false);
        }
      }
    }

    void loadStudents();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, classroomId]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    if (!classroomId || !studentId || description.trim().length < 5) {
      setErrorMessage(
        "Selecione a turma, o aluno e informe uma descrição com ao menos 5 caracteres."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/occurrences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          studentId,
          type,
          severity,
          date,
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível registrar a ocorrência.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setErrorMessage(message);
        return;
      }

      const payload = (await response.json()) as { occurrence: OccurrenceItem };
      onCreated(payload.occurrence);
    } catch {
      setErrorMessage("Falha de conexão com o servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-occurrence-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="create-occurrence-title"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Nova Ocorrência
            </h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              Registre um acompanhamento disciplinar, pedagógico ou elogio do estudante.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar janela de nova ocorrência"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" strokeWidth={1.75} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="occurrence-classroom"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Turma
            </label>
            <select
              id="occurrence-classroom"
              required
              disabled={isSubmitting}
              value={classroomId}
              onChange={(event) => setClassroomId(event.target.value)}
              className={INPUT_CLASS}
            >
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} - {classroom.subject} ({SHIFT_LABELS[classroom.shift]})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="occurrence-student"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Aluno
            </label>
            <select
              id="occurrence-student"
              required
              disabled={isSubmitting || isLoadingStudents || students.length === 0}
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              className={INPUT_CLASS}
            >
              {isLoadingStudents ? (
                <option value="">Carregando alunos da turma...</option>
              ) : students.length === 0 ? (
                <option value="">Nenhum aluno ativo nesta turma</option>
              ) : (
                students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.registration})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="occurrence-type"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Tipo
              </label>
              <select
                id="occurrence-type"
                disabled={isSubmitting}
                value={type}
                onChange={(event) => setType(event.target.value as OccurrenceType)}
                className={INPUT_CLASS}
              >
                {OCCURRENCE_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {OCCURRENCE_TYPE_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="occurrence-severity"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Gravidade
              </label>
              <select
                id="occurrence-severity"
                disabled={isSubmitting}
                value={severity}
                onChange={(event) => setSeverity(event.target.value as OccurrenceSeverity)}
                className={INPUT_CLASS}
              >
                {OCCURRENCE_SEVERITIES.map((option) => (
                  <option key={option} value={option}>
                    {OCCURRENCE_SEVERITY_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="occurrence-date"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Data
              </label>
              <input
                id="occurrence-date"
                type="date"
                required
                disabled={isSubmitting}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="occurrence-description"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Descrição detalhada
            </label>
            <textarea
              id="occurrence-description"
              rows={4}
              required
              disabled={isSubmitting}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva objetivamente o fato ocorrido, contexto e eventuais orientações dadas em sala..."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200/80 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingStudents || students.length === 0}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                  <span>Registrando...</span>
                </>
              ) : (
                <span>Registrar Ocorrência</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
