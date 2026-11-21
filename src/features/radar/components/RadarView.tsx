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
    badgeClass: string;
    barClass: string;
    borderClass: string;
  }
> = {
  CRITICO: {
    label: "Crítico",
    badgeClass:
      "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
    barClass: "bg-red-600",
    borderClass: "border-red-200/90 dark:border-red-500/30",
  },
  ATENCAO: {
    label: "Em Atenção",
    badgeClass:
      "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    barClass: "bg-amber-500",
    borderClass: "border-amber-200/90 dark:border-amber-500/30",
  },
  ESTAVEL: {
    label: "Estável",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
    barClass: "bg-emerald-500",
    borderClass: "border-slate-200/80 dark:border-slate-800",
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
      {/* 3 cards de destaque por nivel de risco */}
      <section
        aria-label="Resumo do Radar Pedagógico"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <button
          type="button"
          onClick={() =>
            setLevelFilter((prev) => (prev === "CRITICO" ? "ALL" : "CRITICO"))
          }
          className={`cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-[var(--shadow-ambient)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
            levelFilter === "CRITICO"
              ? "border-red-500 ring-2 ring-red-500/20"
              : "border-slate-200/80 dark:border-slate-800"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-red-600 uppercase dark:text-red-400">
                Risco Crítico (65–100)
              </p>
              <p className="mt-1.5 font-mono text-3xl font-bold text-slate-900 dark:text-white">
                {data.summary.criticalCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/20 dark:bg-red-500/15 dark:text-red-300">
              <AlertOctagon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Intervenção imediata recomendada
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setLevelFilter((prev) => (prev === "ATENCAO" ? "ALL" : "ATENCAO"))
          }
          className={`cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-[var(--shadow-ambient)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
            levelFilter === "ATENCAO"
              ? "border-amber-500 ring-2 ring-amber-500/20"
              : "border-slate-200/80 dark:border-slate-800"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-400">
                Em Atenção (35–64)
              </p>
              <p className="mt-1.5 font-mono text-3xl font-bold text-slate-900 dark:text-white">
                {data.summary.attentionCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Acompanhamento preventivo semanal
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setLevelFilter((prev) => (prev === "ESTAVEL" ? "ALL" : "ESTAVEL"))
          }
          className={`cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-[var(--shadow-ambient)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
            levelFilter === "ESTAVEL"
              ? "border-emerald-500 ring-2 ring-emerald-500/20"
              : "border-slate-200/80 dark:border-slate-800"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                Estáveis (0–34)
              </p>
              <p className="mt-1.5 font-mono text-3xl font-bold text-slate-900 dark:text-white">
                {data.summary.stableCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Média geral da escola: {formatScoreBr(data.summary.schoolAverageGrade)}
          </p>
        </button>
      </section>

      {/* Filtros e busca */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-ambient)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por aluno, matrícula ou turma..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--school-primary)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="md:col-span-4">
            <select
              aria-label="Filtrar por turma"
              value={classroomFilter}
              onChange={(e) => setClassroomFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
        <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Radar className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            Nenhum estudante corresponde aos filtros atuais
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
                className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-[var(--shadow-ambient)] dark:bg-slate-900 ${meta.borderClass}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={st.studentName} size="md" />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                          {st.studentName}
                        </h3>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {st.classroomName} - {st.classroomSubject} ·{" "}
                          <span className="font-mono">{st.registration}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      <p className="mt-1 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                        Score {st.riskScore}/100
                      </p>
                    </div>
                  </div>

                  {/* Medidor visual do score */}
                  <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${meta.barClass}`}
                      style={{ width: `${Math.max(4, st.riskScore)}%` }}
                    />
                  </div>

                  {/* Fatores detectados */}
                  {st.factors.length > 0 ? (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {st.factors.map((factor) => (
                        <span
                          key={factor}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Nenhum indicador de risco detectado nas aulas e avaliações atuais.
                    </p>
                  )}

                  {/* Recomendacao automatica */}
                  <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    <Lightbulb
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--school-primary)] dark:text-blue-400"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <p className="leading-relaxed">{st.recommendations[0]}</p>
                  </div>
                </div>

                {/* Atalhos rapidos */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                  <Link
                    href={`/dashboard/alunos/${st.studentId}/ficha`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Abrir Ficha</span>
                  </Link>

                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
                    >
                      <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}

                  <Link
                    href="/dashboard/ocorrencias"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700"
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
