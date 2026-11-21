"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  FileText,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { useToast } from "@/shared/components/ToastProvider";
import { SHIFT_BADGE_STYLES, SHIFT_LABELS } from "../constants";
import type { ApiErrorPayload, ClassroomDetail, StudentRecord } from "../types";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { ImportStudentsCsvModal } from "./ImportStudentsCsvModal";
import { StudentFormModal } from "./StudentFormModal";

interface ClassroomDetailViewProps {
  initialClassroom: ClassroomDetail;
  canManage?: boolean;
}

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

function sortAlphabetically(items: StudentRecord[]): StudentRecord[] {
  return [...items].sort((a, b) => ptBrCollator.compare(a.name, b.name));
}

export function ClassroomDetailView({
  initialClassroom,
  canManage = false,
}: ClassroomDetailViewProps): React.JSX.Element {
  const toast = useToast();
  const [students, setStudents] = useState<StudentRecord[]>(() =>
    sortAlphabetically(initialClassroom.students)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentRecord | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activeCount = useMemo(
    () => students.filter((student) => student.active).length,
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return students;
    }

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.registration.toLowerCase().includes(query) ||
        student.guardianName.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  function openCreateModal(): void {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  }

  function openEditModal(student: StudentRecord): void {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  }

  function handleStudentSaved(saved: StudentRecord, mode: "create" | "edit"): void {
    setStudents((prev) => {
      const updatedList =
        mode === "edit"
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved];
      return sortAlphabetically(updatedList);
    });
    setIsStudentModalOpen(false);
    setStudentToEdit(null);
    toast.success(
      mode === "edit"
        ? `Dados de ${saved.name} atualizados.`
        : `Estudante ${saved.name} matriculado na turma.`
    );
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!studentToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/students/${studentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "Não foi possível excluir o aluno.";
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

      const removedName = studentToDelete.name;
      setStudents((prev) => prev.filter((item) => item.id !== studentToDelete.id));
      setStudentToDelete(null);
      toast.success(`Estudante ${removedName} removido da turma.`);
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
      <div>
        <Link
          href="/dashboard/turmas"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition-colors hover:text-[var(--school-primary)] dark:text-slate-300 dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          <span>Voltar para Turmas</span>
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${SHIFT_BADGE_STYLES[initialClassroom.shift]}`}
              >
                {SHIFT_LABELS[initialClassroom.shift]}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                Ano letivo {initialClassroom.year}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
                {initialClassroom.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--school-primary)] dark:text-blue-400">
                <BookOpen className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>{initialClassroom.subject}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[340px]">
            <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-800/60 dark:ring-slate-700/80">
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <UserCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Professor responsável</span>
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {initialClassroom.teacher.name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-800/60 dark:ring-slate-700/80">
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Users className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Total de alunos</span>
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                {students.length} ({activeCount} {activeCount === 1 ? "ativo" : "ativos"})
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800">
          <div className="relative w-full sm:max-w-sm">
            <label htmlFor="students-search" className="sr-only">
              Buscar aluno por nome ou matrícula
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              id="students-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por nome ou matrícula..."
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/classrooms/${initialClassroom.id}/export-csv`}
              download
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Exportar Planilha (CSV)</span>
            </a>

            {canManage ? (
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Importar CSV</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--school-primary-hover)] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              <span>Adicionar Aluno</span>
            </button>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Users className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              {students.length === 0
                ? "Nenhum aluno matriculado nesta turma"
                : "Nenhum aluno encontrado"}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
              {students.length === 0
                ? "Clique em Adicionar Aluno para registrar o primeiro estudante desta turma."
                : "Nenhum registro corresponde ao nome ou matrícula pesquisados."}
            </p>
            {students.length > 0 ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-4 inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Limpar busca
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50/90 text-xs font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="py-3.5 pr-3 pl-6">
                      Matrícula
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Nome do aluno
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Responsável
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Telefone
                    </th>
                    <th scope="col" className="py-3.5 pr-6 pl-3 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap py-3.5 pr-3 pl-6 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {student.registration}
                      </td>
                      <td className="px-3 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={student.name} size="sm" />
                          <span>{student.name}</span>
                          {!student.active ? (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                              Inativo
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-700 dark:text-slate-300">
                        {student.guardianName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {student.guardianPhone}
                      </td>
                      <td className="whitespace-nowrap py-3.5 pr-6 pl-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/dashboard/alunos/${student.id}/ficha`}
                            aria-label={`Abrir ficha e boletim em PDF de ${student.name}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--school-primary)] transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/15"
                          >
                            <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                            <span>Ficha / PDF</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(student)}
                            aria-label={`Editar aluno ${student.name}`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[var(--school-primary)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setStudentToDelete(student);
                            }}
                            aria-label={`Excluir aluno ${student.name}`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lista em cards para mobile */}
            <ul className="divide-y divide-slate-200/80 md:hidden dark:divide-slate-800">
              {filteredStudents.map((student) => (
                <li key={student.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <Avatar name={student.name} size="sm" className="mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          Matrícula {student.registration}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {student.name}
                          </p>
                          {!student.active ? (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                              Inativo
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/dashboard/alunos/${student.id}/ficha`}
                        aria-label={`Abrir ficha e boletim em PDF de ${student.name}`}
                        title="Ficha / PDF"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--school-primary)] hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/15"
                      >
                        <FileText className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEditModal(student)}
                        aria-label={`Editar aluno ${student.name}`}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[var(--school-primary)] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setStudentToDelete(student);
                        }}
                        aria-label={`Excluir aluno ${student.name}`}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>Resp.: {student.guardianName}</span>
                    <span className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                      <Phone className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                      {student.guardianPhone}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <StudentFormModal
        isOpen={isStudentModalOpen}
        classroomId={initialClassroom.id}
        studentToEdit={studentToEdit}
        onClose={() => {
          setIsStudentModalOpen(false);
          setStudentToEdit(null);
        }}
        onSaved={handleStudentSaved}
      />

      <ImportStudentsCsvModal
        isOpen={isImportModalOpen}
        classroomId={initialClassroom.id}
        onClose={() => setIsImportModalOpen(false)}
        onImported={(imported) => {
          if (imported.length > 0) {
            setStudents((prev) => sortAlphabetically([...prev, ...imported]));
          }
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(studentToDelete)}
        title="Excluir aluno"
        description={
          studentToDelete
            ? `Tem certeza que deseja remover "${studentToDelete.name}" (matrícula ${studentToDelete.registration}) desta turma?`
            : ""
        }
        confirmLabel="Excluir aluno"
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setStudentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
