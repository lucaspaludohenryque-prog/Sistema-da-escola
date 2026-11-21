"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Link2,
  Loader2,
  Unlink,
} from "lucide-react";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import type { AdminFamilyLinksPayload } from "../types";

interface FamilyLinksAdminViewProps {
  initialData: AdminFamilyLinksPayload;
}

const RELATIONSHIP_PRESETS = ["Mãe", "Pai", "Responsável", "Avó/Avô", "Tutor"];

export function FamilyLinksAdminView({
  initialData,
}: FamilyLinksAdminViewProps): React.JSX.Element {
  const [data, setData] = useState<AdminFamilyLinksPayload>(initialData);

  // Formulario GuardianStudent
  const [guardianId, setGuardianId] = useState(
    () => initialData.availableGuardians[0]?.id ?? ""
  );
  const [guardianStudentId, setGuardianStudentId] = useState(
    () => initialData.availableStudents[0]?.id ?? ""
  );
  const [relationship, setRelationship] = useState("Mãe");
  const [isSavingGuardian, setIsSavingGuardian] = useState(false);

  // Formulario StudentAccount
  const [studentAccountUserId, setStudentAccountUserId] = useState(
    () => initialData.studentAccounts.find((a) => !a.linkedStudent)?.userId ?? ""
  );
  const [studentAccountTargetId, setStudentAccountTargetId] = useState(
    () => initialData.availableStudents.find((s) => !s.userId)?.id ?? ""
  );
  const [isSavingStudentLink, setIsSavingStudentLink] = useState(false);

  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleLinkGuardian(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFeedback(null);

    if (!guardianId || !guardianStudentId) {
      setFeedback({
        type: "error",
        message: "Selecione um responsável e um estudante para vincular.",
      });
      return;
    }

    setIsSavingGuardian(true);

    try {
      const response = await fetch("/api/admin/family-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "GUARDIAN",
          guardianId,
          studentId: guardianStudentId,
          relationship: relationship.trim() || "Responsável",
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível criar o vínculo.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {
          // Mantem mensagem padrao.
        }
        setFeedback({ type: "error", message });
        return;
      }

      const updated = (await response.json()) as AdminFamilyLinksPayload;
      setData(updated);
      setFeedback({
        type: "success",
        message: "Vínculo entre responsável e estudante criado com sucesso.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha de conexão com o servidor.",
      });
    } finally {
      setIsSavingGuardian(false);
    }
  }

  async function handleLinkStudentAccount(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setFeedback(null);

    if (!studentAccountUserId || !studentAccountTargetId) {
      setFeedback({
        type: "error",
        message: "Selecione uma conta de aluno e a matrícula correspondente.",
      });
      return;
    }

    setIsSavingStudentLink(true);

    try {
      const response = await fetch("/api/admin/family-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "STUDENT_ACCOUNT",
          userId: studentAccountUserId,
          studentId: studentAccountTargetId,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível vincular a conta ao aluno.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {
          // Mantem mensagem padrao.
        }
        setFeedback({ type: "error", message });
        return;
      }

      const updated = (await response.json()) as AdminFamilyLinksPayload;
      setData(updated);
      setStudentAccountUserId(
        updated.studentAccounts.find((a) => !a.linkedStudent)?.userId ?? ""
      );
      setStudentAccountTargetId(
        updated.availableStudents.find((s) => !s.userId)?.id ?? ""
      );
      setFeedback({
        type: "success",
        message: "Conta de acesso vinculada ao estudante com sucesso.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha de conexão com o servidor.",
      });
    } finally {
      setIsSavingStudentLink(false);
    }
  }

  async function handleRemoveGuardianLink(linkId: string): Promise<void> {
    setRemovingKey(`g:${linkId}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/family-links/${linkId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: "Não foi possível remover o vínculo.",
        });
        return;
      }

      setData((prev) => ({
        ...prev,
        guardianLinks: prev.guardianLinks.filter((item) => item.id !== linkId),
      }));
      setFeedback({
        type: "success",
        message: "Vínculo de responsável removido.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha de conexão com o servidor.",
      });
    } finally {
      setRemovingKey(null);
    }
  }

  async function handleUnlinkStudentAccount(studentId: string): Promise<void> {
    setRemovingKey(`s:${studentId}`);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/family-links/${studentId}?kind=student-account`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: "Não foi possível desvincular a conta do aluno.",
        });
        return;
      }

      const refreshedRes = await fetch("/api/admin/family-links", {
        cache: "no-store",
      });
      if (refreshedRes.ok) {
        const refreshed = (await refreshedRes.json()) as AdminFamilyLinksPayload;
        setData(refreshed);
      }
      setFeedback({
        type: "success",
        message: "Conta de acesso desvinculada do estudante.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "Falha de conexão com o servidor.",
      });
    } finally {
      setRemovingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              Vínculos de Responsáveis e Contas de Alunos
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Associe contas com perfil Responsável ou Aluno às matrículas escolares para habilitar
              os portais e avisos automáticos.
            </p>
          </div>
          <Link
            href="/dashboard/usuarios"
            className="inline-flex w-fit shrink-0 items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Cadastrar contas em Usuários
          </Link>
        </div>
      </section>

      {feedback ? (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ring-1 ring-inset ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
              : "bg-red-50 text-red-800 ring-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={1.75} />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" strokeWidth={1.75} />
          )}
          <span>{feedback.message}</span>
        </div>
      ) : null}

      {/* Secao 1: Vinculos de Responsaveis */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <HeartHandshake className="h-5 w-5 text-[#1E40AF]" strokeWidth={1.75} aria-hidden="true" />
          <h3 className="text-base font-semibold text-slate-900">
            Responsáveis vinculados a Estudantes ({data.guardianLinks.length})
          </h3>
        </div>

        <form
          onSubmit={handleLinkGuardian}
          className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1.3fr_0.8fr_auto] md:items-end"
        >
          <div className="space-y-1">
            <label htmlFor="link-guardian" className="block text-xs font-medium text-slate-700">
              Responsável (conta)
            </label>
            <select
              id="link-guardian"
              disabled={isSavingGuardian || data.availableGuardians.length === 0}
              value={guardianId}
              onChange={(event) => setGuardianId(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
            >
              {data.availableGuardians.length === 0 ? (
                <option value="">Nenhuma conta RESPONSAVEL ativa</option>
              ) : (
                data.availableGuardians.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="link-guardian-student"
              className="block text-xs font-medium text-slate-700"
            >
              Estudante
            </label>
            <select
              id="link-guardian-student"
              disabled={isSavingGuardian || data.availableStudents.length === 0}
              value={guardianStudentId}
              onChange={(event) => setGuardianStudentId(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
            >
              {data.availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.classroomName} · {s.registration})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="link-relationship"
              className="block text-xs font-medium text-slate-700"
            >
              Parentesco
            </label>
            <select
              id="link-relationship"
              disabled={isSavingGuardian}
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none"
            >
              {RELATIONSHIP_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={
              isSavingGuardian ||
              data.availableGuardians.length === 0 ||
              data.availableStudents.length === 0
            }
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingGuardian ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Link2 className="h-4 w-4" strokeWidth={1.75} />
            )}
            <span>Vincular</span>
          </button>
        </form>

        <div className="mt-5 divide-y divide-slate-100 border-t border-slate-200/80">
          {data.guardianLinks.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Nenhum vínculo de responsável cadastrado ainda.
            </p>
          ) : (
            data.guardianLinks.map((link) => (
              <div
                key={link.id}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-slate-900">
                    {link.guardian.name}{" "}
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                      {link.relationship}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {link.guardian.email} →{" "}
                    <strong className="font-medium text-slate-900">
                      {link.student.name}
                    </strong>{" "}
                    ({link.student.classroom.name} ·{" "}
                    <span className="font-mono">{link.student.registration}</span>)
                  </p>
                </div>

                <button
                  type="button"
                  disabled={removingKey === `g:${link.id}`}
                  onClick={() => handleRemoveGuardianLink(link.id)}
                  className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <Unlink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>Desvincular</span>
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Secao 2: Contas de Alunos */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <GraduationCap className="h-5 w-5 text-[#1E40AF]" strokeWidth={1.75} aria-hidden="true" />
          <h3 className="text-base font-semibold text-slate-900">
            Contas de Acesso de Estudantes ({data.studentAccounts.length})
          </h3>
        </div>

        <form
          onSubmit={handleLinkStudentAccount}
          className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1.4fr_auto] md:items-end"
        >
          <div className="space-y-1">
            <label
              htmlFor="link-student-user"
              className="block text-xs font-medium text-slate-700"
            >
              Conta com perfil Aluno
            </label>
            <select
              id="link-student-user"
              disabled={isSavingStudentLink || data.studentAccounts.length === 0}
              value={studentAccountUserId}
              onChange={(event) => setStudentAccountUserId(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
            >
              <option value="">Selecione uma conta...</option>
              {data.studentAccounts.map((acc) => (
                <option key={acc.userId} value={acc.userId}>
                  {acc.userName} ({acc.userEmail})
                  {acc.linkedStudent ? " [já vinculada]" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="link-student-record"
              className="block text-xs font-medium text-slate-700"
            >
              Matrícula do Estudante
            </label>
            <select
              id="link-student-record"
              disabled={isSavingStudentLink || data.availableStudents.length === 0}
              value={studentAccountTargetId}
              onChange={(event) => setStudentAccountTargetId(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
            >
              <option value="">Selecione o aluno...</option>
              {data.availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.classroomName} · {s.registration})
                  {s.userId ? " [já vinculada]" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={
              isSavingStudentLink || !studentAccountUserId || !studentAccountTargetId
            }
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingStudentLink ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Link2 className="h-4 w-4" strokeWidth={1.75} />
            )}
            <span>Associar Conta</span>
          </button>
        </form>

        <div className="mt-5 divide-y divide-slate-100 border-t border-slate-200/80">
          {data.studentAccounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Nenhuma conta com perfil ALUNO cadastrada.
            </p>
          ) : (
            data.studentAccounts.map((acc) => (
              <div
                key={acc.userId}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-slate-900">{acc.userName}</p>
                  <p className="text-xs text-slate-500">{acc.userEmail}</p>
                  {acc.linkedStudent ? (
                    <p className="mt-1 text-xs text-emerald-800">
                      Vinculada a <strong>{acc.linkedStudent.name}</strong> (
                      {acc.linkedStudent.classroomName} ·{" "}
                      <span className="font-mono">{acc.linkedStudent.registration}</span>)
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-800">
                      Sem matrícula associada
                    </p>
                  )}
                </div>

                {acc.linkedStudent ? (
                  <button
                    type="button"
                    disabled={removingKey === `s:${acc.linkedStudent.id}`}
                    onClick={() =>
                      acc.linkedStudent &&
                      handleUnlinkStudentAccount(acc.linkedStudent.id)
                    }
                    className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Unlink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Desvincular</span>
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
