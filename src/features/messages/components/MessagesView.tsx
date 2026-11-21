"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Unlock,
  X,
} from "lucide-react";
import type { PublicUser } from "@/features/auth/types";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { Avatar } from "@/shared/components/Avatar";
import { Skeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";
import {
  MESSAGES_UPDATED_EVENT,
  type MessageThreadSummary,
  type ThreadDetailPayload,
  type ThreadStudentOption,
} from "../types";

interface MessagesViewProps {
  currentUser: PublicUser;
  initialThreads: MessageThreadSummary[];
  studentOptions: ThreadStudentOption[];
}

function formatTimeShort(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function MessagesView({
  currentUser,
  initialThreads,
  studentOptions,
}: MessagesViewProps): React.JSX.Element {
  const toast = useToast();
  const isStaff =
    currentUser.role === "ADMIN" ||
    currentUser.role === "COORDENACAO" ||
    currentUser.role === "PROFESSOR";

  const [threads, setThreads] = useState<MessageThreadSummary[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreads[0]?.id ?? null
  );
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [threadDetail, setThreadDetail] = useState<ThreadDetailPayload | null>(
    null
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Modal Novo Atendimento
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [formStudentId, setFormStudentId] = useState(
    studentOptions[0]?.studentId ?? ""
  );
  const [formGuardianId, setFormGuardianId] = useState(
    studentOptions[0]?.guardians[0]?.id ?? ""
  );
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedStudentOption = useMemo(
    () => studentOptions.find((s) => s.studentId === formStudentId) ?? studentOptions[0],
    [studentOptions, formStudentId]
  );

  const openThread = useCallback(
    async (threadId: string) => {
      setActiveThreadId(threadId);
      setIsLoadingDetail(true);
      try {
        const res = await fetch(`/api/messages/threads/${threadId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          toast.error("Não foi possível carregar esta conversa.");
          return;
        }
        const data = (await res.json()) as ThreadDetailPayload & {
          unreadThreadsCount: number;
        };
        setThreadDetail({ thread: data.thread, messages: data.messages });
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
        );
        window.dispatchEvent(
          new CustomEvent(MESSAGES_UPDATED_EVENT, {
            detail: { unreadThreadsCount: data.unreadThreadsCount },
          })
        );
      } catch {
        toast.error("Falha de conexão ao abrir atendimento.");
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (activeThreadId) {
      void openThread(activeThreadId);
    }
  }, [activeThreadId, openThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadDetail?.messages.length]);

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (!activeThreadId || !composerText.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/messages/threads/${activeThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: composerText.trim() }),
      });

      if (!res.ok) {
        let message = "Não foi possível enviar a mensagem.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await res.json()) as {
        message: ThreadDetailPayload["messages"][number];
      };

      setThreadDetail((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, payload.message] }
          : prev
      );
      setThreads((prev) => {
        const updated = prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                lastMessage: {
                  content: payload.message.content,
                  senderName: payload.message.senderName,
                  createdAt: payload.message.createdAt,
                },
                updatedAt: payload.message.createdAt,
              }
            : t
        );
        return updated.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      setComposerText("");
    } catch {
      toast.error("Erro de conexão ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleToggleThreadStatus(): Promise<void> {
    if (!threadDetail || !isStaff || isTogglingStatus) return;
    const nextStatus =
      threadDetail.thread.status === "ABERTO" ? "ENCERRADO" : "ABERTO";
    setIsTogglingStatus(true);
    try {
      const res = await fetch(
        `/api/messages/threads/${threadDetail.thread.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (!res.ok) {
        toast.error("Não foi possível alterar o status do atendimento.");
        return;
      }

      setThreadDetail((prev) =>
        prev
          ? { ...prev, thread: { ...prev.thread, status: nextStatus } }
          : prev
      );
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadDetail.thread.id ? { ...t, status: nextStatus } : t
        )
      );
      toast.success(
        nextStatus === "ENCERRADO"
          ? "Atendimento encerrado."
          : "Atendimento reaberto."
      );
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setIsTogglingStatus(false);
    }
  }

  async function handleCreateThread(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: formStudentId,
          guardianId: isStaff ? formGuardianId : undefined,
          subject: formSubject,
          content: formContent,
        }),
      });

      if (!res.ok) {
        let message = "Não foi possível iniciar o atendimento.";
        try {
          const payload = (await res.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await res.json()) as { thread: MessageThreadSummary };
      setThreads((prev) => [payload.thread, ...prev]);
      setIsNewOpen(false);
      setFormSubject("");
      setFormContent("");
      setMobileShowChat(true);
      void openThread(payload.thread.id);
      toast.success("Atendimento iniciado com sucesso.");
    } catch {
      toast.error("Erro de conexão ao abrir atendimento.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Canal direto e registrado entre responsáveis, professores e coordenação.
        </p>
        {studentOptions.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsNewOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--school-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] sm:text-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span>Novo Atendimento</span>
          </button>
        ) : null}
      </div>

      {/* Layout 2 colunas: lista de conversas + chat */}
      <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-ambient)] lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
        {/* Coluna Esquerda: Lista de Conversas */}
        <aside
          className={`flex flex-col border-r border-slate-200/80 lg:col-span-4 dark:border-slate-800 ${
            mobileShowChat ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3.5 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Conversas ({threads.length})
            </h2>
          </div>

          {threads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                Nenhum atendimento iniciado
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Clique em &ldquo;Novo Atendimento&rdquo; para iniciar uma conversa.
              </p>
            </div>
          ) : (
            <ul className="rco-thin-scrollbar flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {threads.map((t) => {
                const isSelected = t.id === activeThreadId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileShowChat(true);
                        void openThread(t.id);
                      }}
                      className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Avatar
                        name={isStaff ? t.guardianName : t.studentName}
                        size="sm"
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {t.subject}
                          </p>
                          {t.unreadCount > 0 ? (
                            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                              {t.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                          {t.studentName} · {t.classroomName}
                        </p>
                        {t.lastMessage ? (
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                            {t.lastMessage.content}
                          </p>
                        ) : null}
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              t.status === "ABERTO"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {t.status === "ABERTO" ? "Aberto" : "Encerrado"}
                          </span>
                          <span className="font-mono">
                            {formatTimeShort(t.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Coluna Direita: Chat */}
        <section
          className={`flex flex-col lg:col-span-8 ${
            mobileShowChat ? "flex" : "hidden lg:flex"
          }`}
        >
          {isLoadingDetail ? (
            <div className="flex-1 space-y-4 p-6">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-16 w-2/3 rounded-2xl" />
              <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl" />
            </div>
          ) : !threadDetail ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              Selecione uma conversa à esquerda para visualizar as mensagens.
            </div>
          ) : (
            <>
              {/* Topo do chat */}
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 sm:px-5 dark:border-slate-800">
                <div className="flex min-w-0 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    aria-label="Voltar para lista de conversas"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                      {threadDetail.thread.subject}
                    </h3>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      Estudante: <strong>{threadDetail.thread.studentName}</strong> (
                      {threadDetail.thread.classroomName} ·{" "}
                      {threadDetail.thread.classroomSubject}) · Responsável:{" "}
                      {threadDetail.thread.guardianName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openThread(threadDetail.thread.id)}
                    aria-label="Atualizar mensagens"
                    title="Atualizar"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>

                  {isStaff ? (
                    <button
                      type="button"
                      disabled={isTogglingStatus}
                      onClick={handleToggleThreadStatus}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {threadDetail.thread.status === "ABERTO" ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span>Encerrar Atendimento</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Reabrir</span>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </header>

              {/* Mensagens */}
              <div className="rco-thin-scrollbar flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5 dark:bg-slate-950/60">
                {threadDetail.messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-xs sm:max-w-[75%] ${
                          isMine
                            ? "rounded-br-sm bg-[var(--school-primary)] text-white"
                            : "rounded-bl-sm border border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {!isMine ? (
                          <p className="mb-1 text-[11px] font-semibold text-[var(--school-primary)] dark:text-blue-400">
                            {msg.senderName}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                        <div
                          className={`mt-1.5 flex items-center justify-end gap-1 font-mono text-[10px] ${
                            isMine ? "text-white/75" : "text-slate-400"
                          }`}
                        >
                          <span>{formatTimeShort(msg.createdAt)}</span>
                          {isMine ? (
                            msg.readAt ? (
                              <CheckCheck className="h-3.5 w-3.5 text-emerald-300" aria-label="Lida" />
                            ) : (
                              <Check className="h-3.5 w-3.5" aria-label="Enviada" />
                            )
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              {threadDetail.thread.status === "ABERTO" ? (
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-slate-200/80 bg-white p-3.5 sm:px-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <input
                    type="text"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder="Escreva sua mensagem..."
                    disabled={isSending}
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[var(--school-primary)] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !composerText.trim()}
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--school-primary)] px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[var(--school-primary-hover)] disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" strokeWidth={1.75} />
                    )}
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>
              ) : (
                <div className="border-t border-slate-200/80 bg-slate-50 px-5 py-3 text-center text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  Este atendimento foi encerrado.
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Modal Novo Atendimento */}
      {isNewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-thread-title"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => setIsNewOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="new-thread-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                Novo Atendimento
              </h2>
              <button
                type="button"
                onClick={() => setIsNewOpen(false)}
                aria-label="Fechar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estudante
                </label>
                <select
                  required
                  value={formStudentId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setFormStudentId(nextId);
                    const opt = studentOptions.find((s) => s.studentId === nextId);
                    setFormGuardianId(opt?.guardians[0]?.id ?? "");
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {studentOptions.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.studentName} ({s.classroomName} - {s.classroomSubject})
                    </option>
                  ))}
                </select>
              </div>

              {isStaff && (selectedStudentOption?.guardians.length ?? 0) > 0 ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Responsável Vinculado
                  </label>
                  <select
                    required
                    value={formGuardianId}
                    onChange={(e) => setFormGuardianId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {(selectedStudentOption?.guardians ?? []).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.relationship})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assunto
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Ex.: Dúvida sobre recuperação ou saída antecipada"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mensagem Inicial
                </label>
                <textarea
                  required
                  rows={4}
                  minLength={2}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Descreva como podemos ajudar..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--school-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>{isCreating ? "Enviando..." : "Iniciar Conversa"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
