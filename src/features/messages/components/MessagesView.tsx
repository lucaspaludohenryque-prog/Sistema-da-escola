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
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
            Atendimento e Mensagens
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Canal direto e registrado entre responsáveis, professores e coordenação.
          </p>
        </div>
        {studentOptions.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsNewOpen(true)}
            className="inline-flex h-9 w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span>Novo Atendimento</span>
          </button>
        ) : null}
      </header>

      {/* Layout 2 colunas limpo: conversas + chat */}
      <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:grid-cols-12 dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        {/* Coluna Esquerda: Lista de Conversas */}
        <aside
          className={`flex flex-col border-r border-zinc-200/80 lg:col-span-4 dark:border-white/[0.08] ${
            mobileShowChat ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between border-b border-zinc-200/80 px-4 py-3 dark:border-white/[0.08]">
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Conversas ({threads.length})
            </h3>
          </div>

          {threads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
                <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Nenhum atendimento iniciado
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Clique em &ldquo;Novo Atendimento&rdquo; para iniciar uma conversa.
              </p>
            </div>
          ) : (
            <ul className="rco-thin-scrollbar flex-1 divide-y divide-zinc-200/70 overflow-y-auto dark:divide-white/[0.06]">
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
                      className={`relative flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "bg-zinc-100/90 dark:bg-white/[0.06]"
                          : "hover:bg-zinc-50/80 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      {isSelected ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-2 bottom-2 left-0 w-[2.5px] rounded-r bg-[var(--school-primary)]"
                        />
                      ) : null}
                      <Avatar
                        name={isStaff ? t.guardianName : t.studentName}
                        size="sm"
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {t.subject}
                          </p>
                          {t.unreadCount > 0 ? (
                            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                              {t.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {t.studentName} · {t.classroomName}
                        </p>
                        {t.lastMessage ? (
                          <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {t.lastMessage.content}
                          </p>
                        ) : null}
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                              t.status === "ABERTO"
                                ? "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "border border-zinc-200/80 bg-zinc-50 text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400"
                            }`}
                          >
                            {t.status === "ABERTO" ? "Aberto" : "Encerrado"}
                          </span>
                          <span className="font-mono text-[10px] tabular-nums">
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
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-14 w-2/3 rounded-xl" />
              <Skeleton className="ml-auto h-14 w-2/3 rounded-xl" />
            </div>
          ) : !threadDetail ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Selecione uma conversa à esquerda para visualizar as mensagens.
            </div>
          ) : (
            <>
              {/* Topo do chat */}
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3 sm:px-5 dark:border-white/[0.08]">
                <div className="flex min-w-0 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    aria-label="Voltar para lista de conversas"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden dark:hover:bg-[#1A1D21]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {threadDetail.thread.subject}
                    </h3>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      Estudante: <strong className="font-medium text-zinc-700 dark:text-zinc-300">{threadDetail.thread.studentName}</strong> (
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
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
                  >
                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>

                  {isStaff ? (
                    <button
                      type="button"
                      disabled={isTogglingStatus}
                      onClick={handleToggleThreadStatus}
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                    >
                      {threadDetail.thread.status === "ABERTO" ? (
                        <>
                          <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                          <span>Encerrar</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3.5 w-3.5" strokeWidth={1.75} />
                          <span>Reabrir</span>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </header>

              {/* Area de mensagens */}
              <div className="rco-thin-scrollbar flex-1 space-y-2.5 overflow-y-auto bg-[#F7F7F8] p-4 sm:p-5 dark:bg-[#0C0D0F]/70">
                {threadDetail.messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm sm:max-w-[75%] ${
                          isMine
                            ? "rounded-br-sm bg-[var(--school-primary)] text-white"
                            : "rounded-bl-sm border border-zinc-200/80 bg-white text-zinc-900 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-100"
                        }`}
                      >
                        {!isMine ? (
                          <p className="mb-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            {msg.senderName}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 font-mono text-[10px] tabular-nums ${
                            isMine ? "text-white/75" : "text-zinc-400 dark:text-zinc-500"
                          }`}
                        >
                          <span>{formatTimeShort(msg.createdAt)}</span>
                          {isMine ? (
                            msg.readAt ? (
                              <CheckCheck className="h-3.5 w-3.5 text-white" aria-label="Lida" />
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
                  className="flex items-center gap-2 border-t border-zinc-200/80 bg-white p-3 sm:px-4 dark:border-white/[0.08] dark:bg-[#131518]"
                >
                  <input
                    type="text"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder="Escreva sua mensagem..."
                    disabled={isSending}
                    className="h-9 flex-1 rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-[var(--school-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !composerText.trim()}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)] disabled:opacity-50"
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
                <div className="border-t border-zinc-200/80 bg-zinc-50 px-5 py-3 text-center text-xs font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-400">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setIsNewOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200/90 bg-white p-6 shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#131518]">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-200/80 pb-3.5 dark:border-white/[0.08]">
              <h2
                id="new-thread-title"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Novo Atendimento
              </h2>
              <button
                type="button"
                onClick={() => setIsNewOpen(false)}
                aria-label="Fechar"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
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
                  <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Responsável Vinculado
                  </label>
                  <select
                    required
                    value={formGuardianId}
                    onChange={(e) => setFormGuardianId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
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
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Mensagem Inicial
                </label>
                <textarea
                  required
                  rows={4}
                  minLength={2}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Descreva como podemos ajudar..."
                  className="w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200/80 pt-4 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="h-9 cursor-pointer rounded-lg border border-zinc-200/90 bg-white px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
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
