"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { SHIFT_LABELS } from "../constants";
import {
  CLASSROOM_SHIFTS,
  type ApiErrorPayload,
  type ClassroomShift,
  type ClassroomSummary,
  type TeacherSummary,
} from "../types";

interface CreateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (classroom: ClassroomSummary) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export function CreateClassroomModal({
  isOpen,
  onClose,
  onCreated,
}: CreateClassroomModalProps): React.JSX.Element | null {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [shift, setShift] = useState<ClassroomShift>("MANHA");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;

    async function loadTeachers(): Promise<void> {
      setIsLoadingTeachers(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/teachers", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Falha ao carregar professores.");
        }
        const payload = (await response.json()) as { teachers: TeacherSummary[] };
        if (!isCancelled) {
          setTeachers(payload.teachers);
          setTeacherId((current) => current || payload.teachers[0]?.id || "");
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("Não foi possível carregar a lista de professores.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTeachers(false);
        }
      }
    }

    void loadTeachers();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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

  function resetForm(): void {
    setName("");
    setSubject("");
    setYear(String(CURRENT_YEAR));
    setShift("MANHA");
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !subject.trim() || !teacherId) {
      setErrorMessage("Preencha todos os campos obrigatórios para criar a turma.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          year: Number(year),
          shift,
          teacherId,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível cadastrar a turma.";
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

      const payload = (await response.json()) as { classroom: ClassroomSummary };
      resetForm();
      onCreated(payload.classroom);
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
      aria-labelledby="create-classroom-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h2
              id="create-classroom-title"
              className="text-lg font-semibold tracking-tight text-slate-900"
            >
              Nova Turma
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Cadastre a turma e associe o professor responsável pela disciplina.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar formulário de nova turma"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" strokeWidth={1.75} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="classroom-name"
                className="block text-sm font-medium text-slate-800"
              >
                Nome da turma
              </label>
              <input
                id="classroom-name"
                type="text"
                required
                disabled={isSubmitting}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: 9º Ano A"
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="classroom-subject"
                className="block text-sm font-medium text-slate-800"
              >
                Disciplina
              </label>
              <input
                id="classroom-subject"
                type="text"
                required
                disabled={isSubmitting}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Ex: Matemática"
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="classroom-year"
                className="block text-sm font-medium text-slate-800"
              >
                Ano letivo
              </label>
              <input
                id="classroom-year"
                type="number"
                min={2000}
                max={2100}
                required
                disabled={isSubmitting}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="classroom-shift"
                className="block text-sm font-medium text-slate-800"
              >
                Turno
              </label>
              <select
                id="classroom-shift"
                disabled={isSubmitting}
                value={shift}
                onChange={(event) => setShift(event.target.value as ClassroomShift)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
              >
                {CLASSROOM_SHIFTS.map((option) => (
                  <option key={option} value={option}>
                    {SHIFT_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="classroom-teacher"
              className="block text-sm font-medium text-slate-800"
            >
              Professor responsável
            </label>
            <select
              id="classroom-teacher"
              required
              disabled={isSubmitting || isLoadingTeachers || teachers.length === 0}
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            >
              {isLoadingTeachers ? (
                <option value="">Carregando professores...</option>
              ) : teachers.length === 0 ? (
                <option value="">Nenhum professor disponível</option>
              ) : (
                teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200/80 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingTeachers || teachers.length === 0}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#1E3A8A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Cadastrar Turma</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
