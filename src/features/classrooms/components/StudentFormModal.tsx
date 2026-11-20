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
              id="student-modal-title"
              className="text-lg font-semibold tracking-tight text-slate-900"
            >
              {isEditing ? "Editar Aluno" : "Adicionar Aluno"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
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

          <div className="space-y-1.5">
            <label
              htmlFor="student-name"
              className="block text-sm font-medium text-slate-800"
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
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="student-registration"
                className="block text-sm font-medium text-slate-800"
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
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="student-phone"
                className="block text-sm font-medium text-slate-800"
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
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="student-guardian"
              className="block text-sm font-medium text-slate-800"
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
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
            />
          </div>

          {isEditing ? (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 ring-1 ring-inset ring-slate-200/80">
              <div>
                <label
                  htmlFor="student-active"
                  className="text-sm font-medium text-slate-800"
                >
                  Matrícula ativa
                </label>
                <p className="text-xs text-slate-500">
                  Desmarque caso o estudante esteja transferido ou inativo.
                </p>
              </div>
              <input
                id="student-active"
                type="checkbox"
                disabled={isSubmitting}
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#1E40AF]"
              />
            </div>
          ) : null}

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
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#1E3A8A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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
