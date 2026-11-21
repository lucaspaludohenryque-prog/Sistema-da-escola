"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileWarning,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { formatIsoDateBr } from "@/features/attendance/constants";
import { formatShortDateTimeBr } from "@/features/notifications/constants";
import { DeleteConfirmModal } from "@/features/classrooms/components/DeleteConfirmModal";
import type { ApiErrorPayload, ClassroomSummary } from "@/features/classrooms/types";
import {
  OCCURRENCE_PRAISE_STYLE,
  OCCURRENCE_SEVERITY_LABELS,
  OCCURRENCE_SEVERITY_STYLES,
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_STATUS_STYLES,
  OCCURRENCE_TYPE_LABELS,
} from "../constants";
import {
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_STATUSES,
  type OccurrenceItem,
  type OccurrenceSeverity,
  type OccurrenceStatus,
} from "../types";
import { CreateOccurrenceModal } from "./CreateOccurrenceModal";
import { ResolveOccurrenceModal } from "./ResolveOccurrenceModal";

interface OccurrencesViewProps {
  classrooms: ClassroomSummary[];
  initialOccurrences: OccurrenceItem[];
}

export function OccurrencesView({
  classrooms,
  initialOccurrences,
}: OccurrencesViewProps): React.JSX.Element {
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>(initialOccurrences);
  const [classroomFilter, setClassroomFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"" | OccurrenceSeverity>("");
  const [statusFilter, setStatusFilter] = useState<"" | OccurrenceStatus>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteractedWithFilters, setHasInteractedWithFilters] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [occurrenceToResolve, setOccurrenceToResolve] =
    useState<OccurrenceItem | null>(null);
  const [occurrenceToDelete, setOccurrenceToDelete] =
    useState<OccurrenceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasInteractedWithFilters) {
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (classroomFilter) params.set("classroomId", classroomFilter);
        if (severityFilter) params.set("severity", severityFilter);
        if (statusFilter) params.set("status", statusFilter);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());

        const queryString = params.toString();
        const url = queryString
          ? `/api/occurrences?${queryString}`
          : "/api/occurrences";

        const response = await fetch(url, { cache: "no-store" });
        if (response.ok && !isCancelled) {
          const payload = (await response.json()) as { occurrences: OccurrenceItem[] };
          setOccurrences(payload.occurrences);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    classroomFilter,
    severityFilter,
    statusFilter,
    searchQuery,
    hasInteractedWithFilters,
  ]);

  function handleCreated(created: OccurrenceItem): void {
    setOccurrences((prev) => [created, ...prev]);
    setIsCreateOpen(false);
  }

  function handleUpdated(updated: OccurrenceItem): void {
    setOccurrences((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setOccurrenceToResolve(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!occurrenceToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/occurrences/${occurrenceToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "Não foi possível excluir a ocorrência.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setDeleteError(message);
        return;
      }

      setOccurrences((prev) =>
        prev.filter((item) => item.id !== occurrenceToDelete.id)
      );
      setOccurrenceToDelete(null);
    } catch {
      setDeleteError("Falha de conexão com o servidor. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }

  function clearFilters(): void {
    setHasInteractedWithFilters(true);
    setClassroomFilter("");
    setSeverityFilter("");
    setStatusFilter("");
    setSearchQuery("");
  }

  const hasActiveFilters = Boolean(
    classroomFilter || severityFilter || statusFilter || searchQuery.trim()
  );

  if (classrooms.length === 0) {
    return (
      <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <FileWarning className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">
          Nenhuma turma vinculada para ocorrências
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
          Cadastre ou vincule uma turma em Turmas para registrar acompanhamentos pedagógicos e
          disciplinares.
        </p>
        <div className="mt-5">
          <Link
            href="/dashboard/turmas"
            className="inline-flex items-center rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E3A8A]"
          >
            Ir para Turmas
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              Registro de Ocorrências
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Acompanhe registros disciplinares, pedagógicos e elogios por turma e estudante.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#1E3A8A] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span>Nova Ocorrência</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-5 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.9fr_0.9fr]">
          <div className="relative">
            <label htmlFor="occurrences-search" className="sr-only">
              Buscar por nome do aluno
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              id="occurrences-search"
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setHasInteractedWithFilters(true);
                setSearchQuery(event.target.value);
              }}
              placeholder="Buscar por nome do aluno..."
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-classroom" className="sr-only">
              Filtrar por turma
            </label>
            <select
              id="filter-classroom"
              value={classroomFilter}
              onChange={(event) => {
                setHasInteractedWithFilters(true);
                setClassroomFilter(event.target.value);
              }}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none"
            >
              <option value="">Todas as turmas</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} - {classroom.subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-severity" className="sr-only">
              Filtrar por gravidade
            </label>
            <select
              id="filter-severity"
              value={severityFilter}
              onChange={(event) => {
                setHasInteractedWithFilters(true);
                setSeverityFilter(event.target.value as "" | OccurrenceSeverity);
              }}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none"
            >
              <option value="">Todas gravidades</option>
              {OCCURRENCE_SEVERITIES.map((option) => (
                <option key={option} value={option}>
                  {OCCURRENCE_SEVERITY_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="sr-only">
              Filtrar por status
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(event) => {
                setHasInteractedWithFilters(true);
                setStatusFilter(event.target.value as "" | OccurrenceStatus);
              }}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none"
            >
              <option value="">Todos status</option>
              {OCCURRENCE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {OCCURRENCE_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="h-36 animate-pulse rounded-2xl bg-white p-6 ring-1 ring-slate-900/[0.06]"
            />
          ))}
        </div>
      ) : occurrences.length === 0 ? (
        <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FileWarning className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            {hasActiveFilters
              ? "Nenhuma ocorrência encontrada com estes filtros"
              : "Nenhuma ocorrência registrada"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
            {hasActiveFilters
              ? "Limpe ou ajuste os filtros acima para visualizar outros registros."
              : "Clique em Nova Ocorrência para documentar um acompanhamento ou elogio."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Limpar filtros
            </button>
          ) : null}
        </section>
      ) : (
        <section aria-label="Lista de ocorrências" className="space-y-4">
          {occurrences.map((item) => {
            const isPraise = item.type === "ELOGIO";

            return (
              <article
                key={item.id}
                className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          isPraise
                            ? OCCURRENCE_PRAISE_STYLE
                            : "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        {OCCURRENCE_TYPE_LABELS[item.type]}
                      </span>

                      {!isPraise ? (
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${OCCURRENCE_SEVERITY_STYLES[item.severity]}`}
                        >
                          {OCCURRENCE_SEVERITY_LABELS[item.severity]}
                        </span>
                      ) : null}

                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${OCCURRENCE_STATUS_STYLES[item.status]}`}
                      >
                        {OCCURRENCE_STATUS_LABELS[item.status]}
                      </span>

                      {item.familyReceipt.status === "ACKNOWLEDGED" &&
                      item.familyReceipt.acknowledgedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                          <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                          <span>
                            Responsável ciente em{" "}
                            {formatShortDateTimeBr(item.familyReceipt.acknowledgedAt)}
                          </span>
                        </span>
                      ) : item.familyReceipt.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                          <span>Aguardando ciência do responsável</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                          Sem responsável vinculado
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {item.student.name}
                        <span className="ml-2 font-mono text-xs font-normal text-slate-500">
                          {item.student.registration}
                        </span>
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                          {item.classroom.name} - {item.classroom.subject}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                          {formatIsoDateBr(item.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                          Registrado por {item.author.name}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-700">
                      {item.description}
                    </p>

                    {item.resolutionNote ? (
                      <div className="rounded-xl bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950 ring-1 ring-inset ring-emerald-200/80">
                        <p className="text-xs font-semibold text-emerald-800">
                          Encaminhamento / Resolução
                        </p>
                        <p className="mt-1 leading-relaxed">{item.resolutionNote}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <button
                      type="button"
                      onClick={() => setOccurrenceToResolve(item)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-[#1E40AF]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      <span>
                        {item.status === "RESOLVIDO"
                          ? "Editar resolução"
                          : "Resolver / Encaminhar"}
                      </span>
                    </button>

                    {item.canDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setOccurrenceToDelete(item);
                        }}
                        aria-label={`Excluir ocorrência de ${item.student.name}`}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        <span>Excluir</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <CreateOccurrenceModal
        isOpen={isCreateOpen}
        classrooms={classrooms}
        defaultClassroomId={classroomFilter || classrooms[0]?.id}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />

      <ResolveOccurrenceModal
        occurrence={occurrenceToResolve}
        onClose={() => setOccurrenceToResolve(null)}
        onUpdated={handleUpdated}
      />

      <DeleteConfirmModal
        isOpen={Boolean(occurrenceToDelete)}
        title="Excluir ocorrência"
        description={
          occurrenceToDelete
            ? `Tem certeza que deseja excluir o registro de "${OCCURRENCE_TYPE_LABELS[occurrenceToDelete.type]}" do aluno ${occurrenceToDelete.student.name}?`
            : ""
        }
        confirmLabel="Excluir ocorrência"
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setOccurrenceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
