"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import {
  getDefaultDashboardPath,
  type AuthErrorResponse,
  type AuthUserResponse,
  type UserRole,
} from "../types";

interface LoginFormProps {
  redirectTo?: string;
}

type FormStatus = "idle" | "submitting" | "error";

function resolveSafeNextPath(nextPath: string | undefined, role: UserRole): string {
  const defaultPath = getDefaultDashboardPath(role);
  if (!nextPath || !nextPath.startsWith("/dashboard") || nextPath.startsWith("//")) {
    return defaultPath;
  }

  if (role === "RESPONSAVEL" || role === "ALUNO") {
    if (
      nextPath.startsWith("/dashboard/avisos") ||
      nextPath.startsWith("/dashboard/comunicados") ||
      nextPath.startsWith("/dashboard/tarefas") ||
      nextPath.startsWith("/dashboard/horarios") ||
      nextPath.startsWith("/dashboard/calendario") ||
      nextPath.startsWith("/dashboard/alunos/") ||
      (role === "RESPONSAVEL" &&
        (nextPath.startsWith("/dashboard/mensagens") ||
          nextPath.startsWith("/dashboard/reunioes") ||
          (nextPath.startsWith("/dashboard/familia") &&
            !nextPath.startsWith("/dashboard/familia-vinculos")))) ||
      (role === "ALUNO" && nextPath.startsWith("/dashboard/aluno"))
    ) {
      return nextPath;
    }
    return defaultPath;
  }

  return nextPath;
}

export function LoginForm({ redirectTo }: LoginFormProps): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setStatus("error");
      setErrorMessage("Preencha o e-mail e a senha para entrar.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      if (!response.ok) {
        let message = "E-mail ou senha incorretos";
        try {
          const payload = (await response.json()) as Partial<AuthErrorResponse>;
          if (typeof payload.error === "string" && payload.error.length > 0) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao caso a resposta nao seja JSON valido.
        }

        setStatus("error");
        setErrorMessage(message);
        return;
      }

      const payload = (await response.json()) as AuthUserResponse;
      const targetPath = resolveSafeNextPath(redirectTo, payload.user.role);
      router.replace(targetPath);
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage(
        "Falha de conexão com o servidor. Verifique sua rede e tente novamente."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errorMessage ? (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-lg border border-red-200/90 bg-red-50/80 px-3.5 py-2.5 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
            strokeWidth={1.75}
          />
          <p className="leading-snug">{errorMessage}</p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          E-mail
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === "error") {
                setStatus("idle");
                setErrorMessage(null);
              }
            }}
            placeholder="nome@escola.com"
            className="block h-10 w-full rounded-lg border border-zinc-200/90 bg-white pr-3.5 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:opacity-60"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Senha
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (status === "error") {
                setStatus("idle");
                setErrorMessage(null);
              }
            }}
            placeholder="Digite sua senha"
            className="block h-10 w-full rounded-lg border border-zinc-200/90 bg-white pr-10 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isSubmitting}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)] disabled:cursor-not-allowed disabled:opacity-65"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
            <span>Entrando...</span>
          </>
        ) : (
          <span>Entrar no sistema</span>
        )}
      </button>
    </form>
  );
}
