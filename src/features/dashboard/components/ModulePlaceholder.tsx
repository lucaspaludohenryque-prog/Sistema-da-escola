import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  plannedCapabilities: string[];
  icon: LucideIcon;
}

export function ModulePlaceholder({
  title,
  description,
  plannedCapabilities,
  icon: Icon,
}: ModulePlaceholderProps): React.JSX.Element {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF] ring-1 ring-inset ring-blue-100">
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">{description}</p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
          Módulo previsto na próxima fase
        </span>
      </div>

      <div className="mt-6 border-t border-slate-200/80 pt-6">
        <h3 className="text-xs font-semibold text-slate-700">Escopo planejado para este módulo</h3>
        <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {plannedCapabilities.map((capability) => (
            <li
              key={capability}
              className="flex items-start gap-2.5 rounded-lg bg-slate-50/90 px-3.5 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-slate-200/70"
            >
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E40AF]"
                aria-hidden="true"
              />
              <span>{capability}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Voltar para Início</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
