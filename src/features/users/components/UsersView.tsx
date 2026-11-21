"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  KeyRound,
  Plus,
  Power,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";
import { ROLE_BADGE_STYLES, ROLE_LABELS } from "@/features/auth/constants";
import type { UserRole } from "@/features/auth/types";
import { DeleteConfirmModal } from "@/features/classrooms/components/DeleteConfirmModal";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import type { ManagedUser } from "../types";
import { UserFormModal } from "./UserFormModal";

interface UsersViewProps {
  initialUsers: ManagedUser[];
  currentUserId: string;
}

type RoleFilter = "ALL" | UserRole;

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

function sortUsers(items: ManagedUser[]): ManagedUser[] {
  return [...items].sort((a, b) => ptBrCollator.compare(a.name, b.name));
}

export function UsersView({
  initialUsers,
  currentUserId,
}: UsersViewProps): React.JSX.Element {
  const [users, setUsers] = useState<ManagedUser[]>(() => sortUsers(initialUsers));
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery, roleFilter]);

  function openCreateModal(): void {
    setUserToEdit(null);
    setIsFormModalOpen(true);
  }

  function openEditModal(user: ManagedUser): void {
    setUserToEdit(user);
    setIsFormModalOpen(true);
  }

  function handleUserSaved(saved: ManagedUser, mode: "create" | "edit"): void {
    setUsers((prev) => {
      const updated =
        mode === "edit"
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved];
      return sortUsers(updated);
    });
    setIsFormModalOpen(false);
    setUserToEdit(null);
    setActionError(null);
  }

  async function handleToggleActive(user: ManagedUser): Promise<void> {
    if (user.id === currentUserId || togglingUserId) {
      return;
    }

    setTogglingUserId(user.id);
    setActionError(null);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          active: !user.active,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível alterar o status do usuário.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setActionError(message);
        return;
      }

      const payload = (await response.json()) as { user: ManagedUser };
      setUsers((prev) =>
        sortUsers(prev.map((item) => (item.id === payload.user.id ? payload.user : item)))
      );
    } catch {
      setActionError("Falha de conexão com o servidor.");
    } finally {
      setTogglingUserId(null);
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "Não foi possível excluir o usuário.";
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

      setUsers((prev) => prev.filter((item) => item.id !== userToDelete.id));
      setUserToDelete(null);
    } catch {
      setDeleteError("Falha de conexão com o servidor. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              Gestão de Usuários
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Cadastre professores, coordenação e administradores, redefina senhas ou controle
              acessos ativos.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#1E3A8A] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span>Novo Usuário</span>
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200/80 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <label htmlFor="users-search" className="sr-only">
              Buscar usuário por nome ou e-mail
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              id="users-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none"
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filtrar por perfil"
          >
            {(
              ["ALL", "PROFESSOR", "COORDENACAO", "ADMIN", "RESPONSAVEL", "ALUNO"] as const
            ).map((option) => {
              const isSelected = roleFilter === option;
              const label = option === "ALL" ? "Todos" : ROLE_LABELS[option];

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRoleFilter(option)}
                  aria-pressed={isSelected}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-[#1E40AF] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {actionError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" strokeWidth={1.75} />
          <span>{actionError}</span>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
        {filteredUsers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <UserCog className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Nenhum usuário encontrado
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
              Ajuste o termo de busca ou o filtro de perfil selecionado.
            </p>
          </div>
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
                <thead className="bg-slate-50/90 text-xs font-semibold text-slate-600">
                  <tr>
                    <th scope="col" className="py-3.5 pr-3 pl-6">
                      Usuário
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Perfil
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center">
                      Turmas
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="py-3.5 pr-6 pl-3 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const isToggling = togglingUserId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 pr-3 pl-6">
                          <p className="font-semibold text-slate-900">
                            {user.name}
                            {isSelf ? (
                              <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
                                Você
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_STYLES[user.role]}`}
                          >
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-center font-mono text-xs font-medium text-slate-700">
                          {user.classroomCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                              user.active
                                ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
                                : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                            }`}
                          >
                            {user.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3.5 pr-6 pl-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#1E40AF]"
                            >
                              <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                              <span>Editar / Senha</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSelf || isToggling}
                              onClick={() => handleToggleActive(user)}
                              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                user.active
                                  ? "text-amber-800 hover:bg-amber-50"
                                  : "text-emerald-800 hover:bg-emerald-50"
                              }`}
                            >
                              <Power className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                              <span>{user.active ? "Desativar" : "Ativar"}</span>
                            </button>

                            {!isSelf ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setUserToDelete(user);
                                }}
                                aria-label={`Excluir usuário ${user.name}`}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards mobile/tablet */}
            <ul className="divide-y divide-slate-200/80 lg:hidden">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentUserId;
                const isToggling = togglingUserId === user.id;

                return (
                  <li key={user.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {user.name}
                          {isSelf ? (
                            <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
                              Você
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>

                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                          user.active
                            ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200"
                            : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                        }`}
                      >
                        {user.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-medium ${ROLE_BADGE_STYLES[user.role]}`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                      <span className="font-mono text-slate-600">
                        {user.classroomCount}{" "}
                        {user.classroomCount === 1 ? "turma" : "turmas"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-blue-50 hover:text-[#1E40AF]"
                      >
                        <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        <span>Editar / Senha</span>
                      </button>

                      {!isSelf ? (
                        <>
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleActive(user)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Power className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                            <span>{user.active ? "Desativar" : "Ativar"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setUserToDelete(user);
                            }}
                            aria-label={`Excluir usuário ${user.name}`}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                            <span>Excluir</span>
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <UserFormModal
        isOpen={isFormModalOpen}
        userToEdit={userToEdit}
        currentUserId={currentUserId}
        onClose={() => {
          setIsFormModalOpen(false);
          setUserToEdit(null);
        }}
        onSaved={handleUserSaved}
      />

      <DeleteConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Excluir usuário"
        description={
          userToDelete
            ? `Tem certeza que deseja excluir permanentemente "${userToDelete.name}" (${userToDelete.email})? Usuários com turmas ou ocorrências vinculadas não podem ser excluídos.`
            : ""
        }
        confirmLabel="Excluir usuário"
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
