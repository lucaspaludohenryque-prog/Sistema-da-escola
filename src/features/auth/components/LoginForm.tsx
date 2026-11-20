"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import type { AuthErrorResponse } from "../types";

interface LoginFormProps {
  redirectTo?: string;
}

type FormStatus = "idle" | "submitting" | "error";

function resolveSafeNextPath(nextPath?: string): string {
  if (nextPath && nextPath.startsWith("/dashboard") && !nextPath.startsWith("//")) {
    return nextPath;
  }
  return "/dashboard";
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

      const targetPath = resolveSafeNextPath(redirectTo);
      router.replace(targetPath);
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Falha de conexão com o servidor. Verifique sua rede e tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errorMessage ? (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" strokeWidth={1.75} />
          <p className="leading-snug font-medium">{errorMessage}</p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-slate-800"
        >
          E-mail institucional
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
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
            className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-500 transition-[border-color,box-shadow] duration-150 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-sm font-medium text-slate-800"
        >
          Senha
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
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
            className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-11 pl-10 text-sm text-slate-900 placeholder:text-slate-500 transition-[border-color,box-shadow] duration-150 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isSubmitting}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-50"
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
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#1E3A8A] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-800/70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            <span>Entrando...</span>
          </>
        ) : (
          <span>Entrar no sistema</span>
        )}
      </button>
    </form>
  );
}
