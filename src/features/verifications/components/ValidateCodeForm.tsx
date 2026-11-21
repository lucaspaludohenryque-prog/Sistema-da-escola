"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SearchCheck } from "lucide-react";

export function ValidateCodeForm(): React.JSX.Element {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="verification-code"
          className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
        >
          Código de Autenticidade
        </label>
        <div className="relative">
          <SearchCheck
            className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            id="verification-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="Ex.: RCO-2026-A7F9K2"
            autoComplete="off"
            spellCheck={false}
            className="block w-full rounded-2xl border border-slate-300 bg-white py-4 pr-4 pl-12 font-mono text-base font-semibold tracking-wider text-slate-900 uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--school-primary)] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98]"
      >
        <span>Verificar Autenticidade do Documento</span>
        <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  );
}
