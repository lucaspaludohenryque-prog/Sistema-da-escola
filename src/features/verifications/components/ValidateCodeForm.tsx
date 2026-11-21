"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

interface ValidateCodeFormProps {
  variant?: "default" | "inline";
}

export function ValidateCodeForm({
  variant = "default",
}: ValidateCodeFormProps): React.JSX.Element {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (cleaned.length < 6) {
      setError("Informe um código válido no formato RCO-2026-XXXXXX.");
      return;
    }
    setError(null);
    router.push(`/validar/${encodeURIComponent(cleaned)}`);
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className="w-full" noValidate>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="quick-verification-code" className="sr-only">
              Código de verificação do documento
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              id="quick-verification-code"
              type="text"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="Cole o código (ex.: RCO-2026-A7F9K2)"
              autoComplete="off"
              spellCheck={false}
              className="block h-10 w-full rounded-lg border border-zinc-200/90 bg-white pr-3 pl-9 font-mono text-sm tracking-wide text-zinc-900 uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-400 transition-colors focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)]"
          >
            <span>Validar</span>
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        {error ? (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="verification-code"
          className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Código de autenticidade
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            id="verification-code"
            type="text"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="RCO-2026-A7F9K2"
            autoComplete="off"
            spellCheck={false}
            className="block h-11 w-full rounded-lg border border-zinc-200/90 bg-white pr-3.5 pl-10 font-mono text-sm font-medium tracking-wider text-zinc-900 uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-400 transition-colors focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
        {error ? (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)]"
      >
        <span>Consultar autenticidade</span>
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </form>
  );
}
