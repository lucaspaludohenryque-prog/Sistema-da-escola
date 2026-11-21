"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, X } from "lucide-react";
import { ROLE_LABELS } from "@/features/auth/constants";
import { USER_ROLES, type UserRole } from "@/features/auth/types";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import type { ManagedUser } from "../types";

interface UserFormModalProps {
  isOpen: boolean;
  userToEdit: ManagedUser | null;
  currentUserId: string;
  onClose: () => void;
  onSaved: (user: ManagedUser, mode: "create" | "edit") => void;
}

const INPUT_CLASS =
  "block w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:disabled:bg-white/[0.03]";

export function UserFormModal({
  isOpen,
  userToEdit,
  currentUserId,
  onClose,
  onSaved,
}: UserFormModalProps): React.JSX.Element | null {
  const isEditing = Boolean(userToEdit);
  const isSelf = userToEdit?.id === currentUserId;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("PROFESSOR");
  const [active, setActive] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setActive(userToEdit.active);
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setRole("PROFESSOR");
      setActive(true);
      setPassword("");
    }
    setShowPassword(false);
    setErrorMessage(null);
  }, [isOpen, userToEdit]);

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

    if (!name.trim() || !email.trim()) {
      setErrorMessage("Informe o nome completo e o e-mail institucional.");
      return;
    }

    if (!isEditing && password.length < 6) {
      setErrorMessage("A senha inicial deve ter no mínimo 6 caracteres.");
      return;
    }

    if (isEditing && password.length > 0 && password.length < 6) {
      setErrorMessage("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = userToEdit ? `/api/users/${userToEdit.id}` : "/api/users";
      const method = userToEdit ? "PUT" : "POST";

      const payloadBody = userToEdit
        ? {
            name: name.trim(),
            email: email.trim(),
            role,
            active,
            ...(password.length > 0 ? { password } : {}),
          }
        : {
            name: name.trim(),
            email: email.trim(),
            role,
            password,
            active: true,
          };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });

      if (!response.ok) {
        let message = isEditing
          ? "Não foi possível atualizar o usuário."
          : "Não foi possível cadastrar o usuário.";
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

      const payload = (await response.json()) as { user: ManagedUser };
      onSaved(payload.user, isEditing ? "edit" : "create");
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
      aria-labelledby="user-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl ring-1 ring-zinc-200/90 dark:bg-[#131518] dark:ring-white/[0.1]">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
          <div>
            <h2
              id="user-modal-title"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              {isEditing ? "Editar Usuário / Redefinir Senha" : "Novo Usuário"}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              {isEditing
                ? "Atualize os dados da conta ou informe uma nova senha para redefinição."
                : "Cadastre um professor, coordenador, administrador, responsável ou aluno."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar janela de usuário"
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
              htmlFor="user-name"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Nome completo
            </label>
            <input
              id="user-name"
              type="text"
              required
              disabled={isSubmitting}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Prof. Juliana Ribeiro"
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-email"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              E-mail institucional
            </label>
            <input
              id="user-email"
              type="email"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@escola.com"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="user-role"
                className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                Perfil de acesso
              </label>
              <select
                id="user-role"
                disabled={isSubmitting || isSelf}
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className={`${INPUT_CLASS} disabled:cursor-not-allowed`}
              >
                {USER_ROLES.map((option) => (
                  <option key={option} value={option}>
                    {ROLE_LABELS[option]}
                  </option>
                ))}
              </select>
              {isSelf ? (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Você não pode alterar seu próprio perfil de Administrador.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="user-password"
                className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
              >
                {isEditing ? "Nova senha (opcional)" : "Senha inicial"}
              </label>
              <div className="relative">
                <input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  required={!isEditing}
                  disabled={isSubmitting}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isEditing ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                  className={`${INPUT_CLASS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3.5 py-2.5 ring-1 ring-inset ring-zinc-200/80 dark:bg-white/[0.04] dark:ring-white/[0.1]">
              <div>
                <label
                  htmlFor="user-active"
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Conta ativa
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isSelf
                    ? "Não é possível desativar a conta atualmente autenticada."
                    : "Contas inativas têm o login bloqueado preservando todo o histórico."}
                </p>
              </div>
              <input
                id="user-active"
                type="checkbox"
                disabled={isSubmitting || isSelf}
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-200/90 accent-[var(--school-primary)] disabled:cursor-not-allowed"
              />
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2.5 border-t border-zinc-200/80 pt-4 sm:flex-row sm:justify-end dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
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
                <span>{isEditing ? "Salvar Alterações" : "Cadastrar Usuário"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
