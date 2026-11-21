"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import type { ApiErrorPayload, StudentRecord } from "../types";

interface StudentFormModalProps {
  isOpen: boolean;
  classroomId: string;
  studentToEdit: StudentRecord | null;
  onClose: () => void;
  onSaved: (student: StudentRecord, mode: "create" | "edit") => void;
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:disabled:bg-white/[0.03]";

export function StudentFormModal({
  isOpen,
  classroomId,
  studentToEdit,
  onClose,
  onSaved,
}: StudentFormModalProps): React.JSX.Element | null {
  const isEditing = Boolean(studentToEdit);
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (studentToEdit) {
      setName(studentToEdit.name);
      setRegistration(studentToEdit.registration);
      setGuardianName(studentToEdit.guardianName);
      setGuardianPhone(studentToEdit.guardianPhone);
      setActive(studentToEdit.active);
    } else {
      setName("");
      setRegistration("");
      setGuardianName("");
      setGuardianPhone("");
      setActive(true);
    }
    setErrorMessage(null);
  }, [isOpen, studentToEdit]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    if (
      !name.trim() ||
      !registration.trim() ||
      !guardianName.trim() ||
      !guardianPhone.trim()
    ) {
      setErrorMessage("Preencha todos os campos obrigatórios do aluno.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = studentToEdit
        ? `/api/students/${studentToEdit.id}`
        : `/api/classrooms/${classroomId}/students`;
      const method = studentToEdit ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          registration: registration.trim(),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          active,
        }),
      });

      if (!response.ok) {
        let message = isEditing
          ? "Não foi possível atualizar o aluno."
          : "Não foi possível cadastrar o aluno.";
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

      const payload = (await response.json()) as { student: StudentRecord };
      onSaved(payload.student, isEditing ? "edit" : "create");
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
      aria-labelledby="student-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl ring-1 ring-zinc-200/90 dark:bg-[#131518] dark:ring-white/[0.1]">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
          <div>
            <h2
              id="student-modal-title"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              {isEditing ? "Editar Aluno" : "Adicionar Aluno"}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              {isEditing
                ? "Atualize os dados cadastrais e o vínculo do estudante na turma."
                : "Informe os dados do estudante e do responsável legal."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar formulário de aluno"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-white"
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
              htmlFor="student-name"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Nome completo
            </label>
            <input
              id="student-name"
              type="text"
              required
              disabled={isSubmitting}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Mariana Oliveira Costa"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="student-registration"
                className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                Matrícula / CGM
              </label>
              <input
                id="student-registration"
                type="text"
                required
                disabled={isSubmitting}
                value={registration}
                onChange={(event) => setRegistration(event.target.value)}
                placeholder="Ex: 2026090107"
                className={`${INPUT_CLASS} font-mono placeholder:font-sans`}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="student-phone"
                className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                Telefone do responsável
              </label>
              <input
                id="student-phone"
                type="tel"
                required
                disabled={isSubmitting}
                value={guardianPhone}
                onChange={(event) => setGuardianPhone(event.target.value)}
                placeholder="(41) 99999-0000"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="student-guardian"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Nome do responsável
            </label>
            <input
              id="student-guardian"
              type="text"
              required
              disabled={isSubmitting}
              value={guardianName}
              onChange={(event) => setGuardianName(event.target.value)}
              placeholder="Ex: Carla Regina Oliveira"
              className={INPUT_CLASS}
            />
          </div>

          {isEditing ? (
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3.5 py-2.5 ring-1 ring-inset ring-zinc-200/80 dark:bg-white/[0.04] dark:ring-white/[0.1]">
              <div>
                <label
                  htmlFor="student-active"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Matrícula ativa
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Desmarque caso o estudante esteja transferido ou inativo.
                </p>
              </div>
              <input
                id="student-active"
                type="checkbox"
                disabled={isSubmitting}
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-200/90 accent-[var(--school-primary)]"
              />
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2.5 border-t border-zinc-200/80 pt-4 sm:flex-row sm:justify-end dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-60 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{isEditing ? "Salvar Alterações" : "Adicionar Aluno"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
