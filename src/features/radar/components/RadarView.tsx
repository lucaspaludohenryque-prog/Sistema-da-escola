"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileWarning,
  Lightbulb,
  MessageCircle,
  Radar,
  Search,
} from "lucide-react";
import { formatScoreBr } from "@/features/grades/constants";
import { Avatar } from "@/shared/components/Avatar";
import { buildWhatsAppUrl } from "@/shared/utils/whatsapp";
import type { RadarAnalyticsPayload, RiskLevel } from "../types";

interface RadarViewProps {
  data: RadarAnalyticsPayload;
}

const RISK_META: Record<
  RiskLevel,
  {
    label: string;
    dotClass: string;
    badgeClass: string;
    barClass: string;
  }
> = {
  CRITICO: {
    label: "Crítico",
    dotClass: "bg-red-500",
    badgeClass:
      "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
    barClass: "bg-red-500/85",
  },
  ATENCAO: {
    label: "Em Atenção",
    dotClass: "bg-amber-500",
    badgeClass:
      "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    barClass: "bg-amber-500/85",
  },
  ESTAVEL: {
    label: "Estável",
    dotClass: "bg-emerald-500",
    badgeClass:
      "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    barClass: "bg-emerald-500/80",
  },
};

export function RadarView({ data }: RadarViewProps): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState<"ALL" | RiskLevel>("ALL");

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.students.filter((st) => {
      if (classroomFilter !== "ALL" && st.classroomId !== classroomFilter) {
        return false;
      }
      if (levelFilter !== "ALL" && st.riskLevel !== levelFilter) {
        return false;
      }
      if (query.length > 0) {
        const hay =
          `${st.studentName} ${st.registration} ${st.classroomName} ${st.classroomSubject}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [data.students, search, classroomFilter, levelFilter]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
          Radar de Risco Pedagógico
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Monitoramento preventivo de frequência, rendimento e ocorrências por estudante.
        </p>
      </header>

      {/* Faixa limpa de KPIs clicaveis */}
      <section
        aria-label="Resumo do Radar Pedagógico"
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-3"
      >
        <button
          type="button"
          onClick={() =>
            setLevelFilter((prev) => (prev === "CRITICO" ? "ALL" : "CRITICO"))
          }
          className={`cursor-pointer rounded-xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors dark:bg-[#131518] dark:shadow-none ${
            levelFilter === "CRITICO"
              ? "border-red-500/80 ring-1 ring-red-500/20"
              : "border-zinc-200/80 hover:border-zinc-300 dark:border-white/[0.08] dark:hover:border-white/[0.15]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Risco Crítico (65–100)
            </p>
            <AlertOctagon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
              data.summary.criticalCount > 0
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {data.summary.criticalCount}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Intervenção imediata recomendada
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setLevelFilter((prev) => (prev === "ATENCAO" ? "ALL" : "ATENCAO"))
          }
          className={`cursor-pointer rounded-xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors dark:bg-[#131518] dark:shadow-none ${
            levelFilter === "ATENCAO"
              ? "border-amber-500/80 ring-1 ring-amber-500/20"
              : "border-zinc-200/80 hover:border-zinc-300 dark:border-white/[0.08] dark:hover:border-white/[0.15]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Em Atenção (35–64)
            </p>
            <AlertTriangle className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
              data.summary.attentionCount > 0
                ? "text-amber-700 dark:text-amber-400"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {data.summary.attentionCount}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Acompanhamento preventivo semanal
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setLevelFilter((prev) => (prev === "ESTAVEL" ? "ALL" : "ESTAVEL"))
          }
          className={`cursor-pointer rounded-xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors dark:bg-[#131518] dark:shadow-none ${
            levelFilter === "ESTAVEL"
              ? "border-emerald-500/80 ring-1 ring-emerald-500/20"
              : "border-zinc-200/80 hover:border-zinc-300 dark:border-white/[0.08] dark:hover:border-white/[0.15]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Estáveis (0–34)
            </p>
            <CheckCircle2 className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
            {data.summary.stableCount}
          </p>
          <p className="mt-1.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            Média geral da escola: {formatScoreBr(data.summary.schoolAverageGrade)}
          </p>
        </button>
      </section>

      {/* Filtros e busca */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por aluno, matrícula ou turma..."
              className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="md:col-span-4">
            <select
              aria-label="Filtrar por turma"
              value={classroomFilter}
              onChange={(e) => setClassroomFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
            >
              <option value="ALL">Todas as turmas</option>
              {data.classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.subject}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filtrar por nível de risco"
              value={levelFilter}
              onChange={(e) =>
                setLevelFilter(e.target.value as "ALL" | RiskLevel)
              }
              className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
            >
              <option value="ALL">Todos os níveis</option>
              <option value="CRITICO">Crítico (65+)</option>
              <option value="ATENCAO">Em Atenção (35–64)</option>
              <option value="ESTAVEL">Estável (&lt; 35)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Lista de alunos analisados */}
      {filteredStudents.length === 0 ? (
        <section className="rounded-xl border border-zinc-200/80 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
            <Radar className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Nenhum estudante corresponde aos filtros atuais
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Altere a turma ou o nível de risco para visualizar os demais alunos monitorados.
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredStudents.map((st) => {
            const meta = RISK_META[st.riskLevel];
            const waText = `Olá, ${st.guardianName}! Aqui é da equipe pedagógica do(a) ${data.schoolName}. Gostaria de conversar sobre o acompanhamento escolar de ${st.studentName} (${st.classroomName} - ${st.classroomSubject}).`;
            const waUrl = buildWhatsAppUrl(st.guardianPhone, waText);

            return (
              <article
                key={st.studentId}
                className="flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={st.studentName} size="sm" />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {st.studentName}
                        </h3>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {st.classroomName} · {st.classroomSubject} ·{" "}
                          <span className="font-mono tabular-nums">{st.registration}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`}
                        />
                        {meta.label}
                      </span>
                      <p className="mt-1 font-mono text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                        {st.riskScore}/100
                      </p>
                    </div>
                  </div>

                  {/* Medidor discreto do score */}
                  <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${meta.barClass}`}
                      style={{ width: `${Math.max(4, st.riskScore)}%` }}
                    />
                  </div>

                  {/* Fatores detectados */}
                  {st.factors.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {st.factors.map((factor) => (
                        <span
                          key={factor}
                          className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                      Nenhum indicador de risco detectado nas aulas e avaliações atuais.
                    </p>
                  )}

                  {/* Recomendacao */}
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-zinc-200/70 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-600 dark:border-white/[0.06] dark:bg-[#1A1D21]/60 dark:text-zinc-300">
                    <Lightbulb
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <p className="leading-relaxed">{st.recommendations[0]}</p>
                  </div>
                </div>

                {/* Atalhos rapidos */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200/70 pt-3.5 dark:border-white/[0.07]">
                  <Link
                    href={`/dashboard/alunos/${st.studentId}/ficha`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Abrir Ficha</span>
                  </Link>

                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100/70 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                    >
                      <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}

                  <Link
                    href="/dashboard/ocorrencias"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
                  >
                    <FileWarning className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Encaminhamento</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
