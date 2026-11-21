"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useToast } from "@/shared/components/ToastProvider";
import { SHIFT_BADGE_STYLES, SHIFT_LABELS } from "../constants";
import type { ApiErrorPayload, ClassroomShift, ClassroomSummary } from "../types";
import { CreateClassroomModal } from "./CreateClassroomModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface ClassroomsViewProps {
  initialClassrooms: ClassroomSummary[];
  canManage: boolean;
}

type ShiftFilter = "ALL" | ClassroomShift;

export function ClassroomsView({
  initialClassrooms,
  canManage,
}: ClassroomsViewProps): React.JSX.Element {
  const toast = useToast();
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>(initialClassrooms);
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<ClassroomSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredClassrooms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return classrooms.filter((classroom) => {
      if (shiftFilter !== "ALL" && classroom.shift !== shiftFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        classroom.name.toLowerCase().includes(normalizedQuery) ||
        classroom.subject.toLowerCase().includes(normalizedQuery) ||
        classroom.teacher.name.toLowerCase().includes(normalizedQuery) ||
        String(classroom.year).includes(normalizedQuery)
      );
    });
  }, [classrooms, searchQuery, shiftFilter]);

  function handleClassroomCreated(created: ClassroomSummary): void {
    setClassrooms((prev) =>
      [created, ...prev].sort(
        (a, b) => b.year - a.year || a.name.localeCompare(b.name, "pt-BR")
      )
    );
    setIsCreateModalOpen(false);
    toast.success(`Turma "${created.name} - ${created.subject}" cadastrada.`);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!classroomToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/classrooms/${classroomToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "Não foi possível excluir a turma.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setDeleteError(message);
        toast.error(message);
        return;
      }

      const deletedName = classroomToDelete.name;
      setClassrooms((prev) => prev.filter((item) => item.id !== classroomToDelete.id));
      setClassroomToDelete(null);
      toast.success(`Turma "${deletedName}" excluída.`);
    } catch {
      const msg = "Falha de conexão com o servidor. Tente novamente.";
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
              Turmas cadastradas
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {canManage
                ? "Gerencie turmas, turnos, professores responsáveis e matrículas de estudantes."
                : "Consulte suas turmas vinculadas e acesse a lista de estudantes."}
            </p>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--school-primary-hover)] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              <span>Nova Turma</span>
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/80 pt-5 md:flex-row md:items-center md:justify-between dark:border-slate-800">
          <div className="relative w-full md:max-w-md">
            <label htmlFor="classrooms-search" className="sr-only">
              Buscar turma por nome, disciplina ou professor
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              id="classrooms-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por turma, disciplina ou professor..."
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filtrar por turno"
          >
            {(["ALL", "MANHA", "TARDE", "NOITE"] as const).map((option) => {
              const isSelected = shiftFilter === option;
              const label = option === "ALL" ? "Todos os turnos" : SHIFT_LABELS[option];

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setShiftFilter(option)}
                  aria-pressed={isSelected}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-[var(--school-primary)] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {filteredClassrooms.length === 0 ? (
        <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Users className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            {classrooms.length === 0
              ? "Nenhuma turma cadastrada"
              : "Nenhuma turma encontrada"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
            {classrooms.length === 0
              ? canManage
                ? "Cadastre a primeira turma para iniciar o controle de alunos e chamadas."
                : "Nenhuma turma foi vinculada ao seu perfil de professor até o momento."
              : "Tente ajustar o termo de busca ou o filtro de turno selecionado."}
          </p>
          {classrooms.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShiftFilter("ALL");
              }}
              className="mt-4 inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Limpar filtros
            </button>
          ) : null}
        </section>
      ) : (
        <section
          aria-label="Lista de turmas"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredClassrooms.map((classroom) => (
            <article
              key={classroom.id}
              className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:ring-[var(--school-primary-soft-border)] dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-slate-700"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${SHIFT_BADGE_STYLES[classroom.shift]}`}
                      >
                        {SHIFT_LABELS[classroom.shift]}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        {classroom.year}
                      </span>
                    </div>

                    <h3 className="mt-3 truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {classroom.name}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-[var(--school-primary)] dark:text-blue-400">
                      <BookOpen className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span className="truncate">{classroom.subject}</span>
                    </p>
                  </div>

                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setClassroomToDelete(classroom);
                      }}
                      aria-label={`Excluir turma ${classroom.name} - ${classroom.subject}`}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  ) : null}
                </div>

                <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <UserCheck className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span>Professor</span>
                    </dt>
                    <dd className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {classroom.teacher.name}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Users className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span>Alunos</span>
                    </dt>
                    <dd className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                      {classroom.studentCount}{" "}
                      {classroom.studentCount === 1 ? "aluno" : "alunos"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Link
                  href={`/dashboard/turmas/${classroom.id}`}
                  className="group inline-flex w-full items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 ring-1 ring-inset ring-slate-200/80 transition-colors hover:bg-slate-100 hover:text-[var(--school-primary)] dark:bg-slate-800/80 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                >
                  <span>Gerenciar alunos</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      <CreateClassroomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleClassroomCreated}
      />

      <DeleteConfirmModal
        isOpen={Boolean(classroomToDelete)}
        title="Excluir turma"
        description={
          classroomToDelete
            ? `Tem certeza que deseja excluir "${classroomToDelete.name} (${classroomToDelete.subject})"? Todos os ${classroomToDelete.studentCount} alunos vinculados a esta turma também serão removidos.`
            : ""
        }
        confirmLabel="Excluir turma"
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setClassroomToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
