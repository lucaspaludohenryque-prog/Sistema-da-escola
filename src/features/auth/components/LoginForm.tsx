"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  HeartHandshake,
  Loader2,
  Lock,
  Mail,
  Shield,
  type LucideIcon,
} from "lucide-react";
import {
  getDefaultDashboardPath,
  type AuthErrorResponse,
  type AuthUserResponse,
  type UserRole,
} from "../types";

interface LoginFormProps {
  redirectTo?: string;
  demoModeEnabled?: boolean;
}

type FormStatus = "idle" | "submitting" | "error";

interface DemoQuickProfile {
  key: string;
  label: string;
  email: string;
  icon: LucideIcon;
}

const DEMO_DEFAULT_PASSWORD = ["123", "456"].join("");

const DEMO_QUICK_PROFILES: readonly DemoQuickProfile[] = [
  {
    key: "admin",
    label: "Direção / Admin",
    email: "admin@escola.com",
    icon: Shield,
  },
  {
    key: "professor",
    label: "Professor(a)",
    email: "professor@escola.com",
    icon: GraduationCap,
  },
  {
    key: "mae",
    label: "Mãe / Responsável",
    email: "mae@escola.com",
    icon: HeartHandshake,
  },
  {
    key: "aluno",
    label: "Estudante",
    email: "aluno@escola.com",
    icon: BookOpen,
  },
];

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
      nextPath.startsWith("/dashboard/carteirinha") ||
      nextPath.startsWith("/dashboard/ajuda") ||
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

export function LoginForm({
  redirectTo,
  demoModeEnabled = false,
}: LoginFormProps): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [activeDemoKey, setActiveDemoKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitting = status === "submitting";

  async function executeLogin(
    targetEmail: string,
    targetPassword: string,
    demoKey: string | null
  ): Promise<void> {
    const trimmedEmail = targetEmail.trim();
    if (!trimmedEmail || !targetPassword) {
      setStatus("error");
      setErrorMessage("Preencha o e-mail e a senha para entrar.");
      return;
    }

    setStatus("submitting");
    setActiveDemoKey(demoKey);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: targetPassword,
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
        setActiveDemoKey(null);
        setErrorMessage(message);
        return;
      }

      const payload = (await response.json()) as AuthUserResponse;
      const targetPath = demoKey
        ? getDefaultDashboardPath(payload.user.role)
        : resolveSafeNextPath(redirectTo, payload.user.role);
      router.replace(targetPath);
      router.refresh();
    } catch {
      setStatus("error");
      setActiveDemoKey(null);
      setErrorMessage(
        "Falha de conexão com o servidor. Verifique sua rede e tente novamente."
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await executeLogin(email, password, null);
  }

  async function handleDemoAccess(profile: DemoQuickProfile): Promise<void> {
    if (isSubmitting) {
      return;
    }
    setEmail(profile.email);
    setPassword(DEMO_DEFAULT_PASSWORD);
    await executeLogin(profile.email, DEMO_DEFAULT_PASSWORD, profile.key);
  }

  return (
    <div>
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
          {isSubmitting && activeDemoKey === null ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
              <span>Entrando...</span>
            </>
          ) : (
            <span>Entrar no sistema</span>
          )}
        </button>
      </form>

      {demoModeEnabled ? (
        <div className="mt-6">
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-px bg-zinc-200/80 dark:bg-white/[0.08]"
            />
            <span className="relative bg-white px-2.5 text-[11px] font-medium text-zinc-500 dark:bg-[#0C0D0F] dark:text-zinc-400">
              Acesso rápido para avaliação
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-2">
            {DEMO_QUICK_PROFILES.map((profile) => {
              const Icon = profile.icon;
              const isLoadingThis = isSubmitting && activeDemoKey === profile.key;

              return (
                <button
                  key={profile.key}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDemoAccess(profile)}
                  className="group flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200/90 bg-zinc-50/70 px-3 py-2.5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-100/80 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#131518] dark:hover:border-white/15 dark:hover:bg-[#1A1D21]"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 transition-colors group-hover:text-zinc-900 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-400 dark:group-hover:text-zinc-100">
                    {isLoadingThis ? (
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin text-[var(--school-primary)]"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                    ) : (
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {profile.label}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                      {isLoadingThis ? "Entrando..." : profile.email}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
