"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { AuditLogItem } from "@/app/api/admin/audit/route";
import { getTodayIsoDate } from "@/features/attendance/constants";
import { Skeleton } from "@/shared/components/Skeleton";
import { useToast } from "@/shared/components/ToastProvider";

interface AuditBackupViewProps {
  initialLogs: AuditLogItem[];
  initialActions: string[];
}

function getActionBadgeStyle(action: string): string {
  if (action.includes("EXCLUIR") || action.includes("DESATIVAR") || action.includes("RECUSAR")) {
    return "border border-red-200/80 bg-red-50/70 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300";
  }
  if (action.includes("TRANCAR") || action.includes("CONFIG")) {
    return "border border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";
  }
  if (action.includes("APROVAR") || action.includes("CRIAR") || action.includes("BACKUP")) {
    return "border border-emerald-200/80 bg-emerald-50/70 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  return "border border-zinc-200/80 bg-zinc-50 text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300";
}

function formatDateTimeBr(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}

export function AuditBackupView({
  initialLogs,
  initialActions,
}: AuditBackupViewProps): React.JSX.Element {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs);
  const [actions, setActions] = useState<string[]>(initialActions);
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (roleFilter) params.set("userRole", roleFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/admin/audit?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        toast.error("Não foi possível atualizar os logs de auditoria.");
        return;
      }
      const data = (await res.json()) as {
        logs: AuditLogItem[];
        actions: string[];
      };
      setLogs(data.logs);
      setActions(data.actions);
    } catch {
      toast.error("Erro de conexão ao consultar auditoria.");
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, roleFilter, search, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLogs();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  async function handleExportBackup(): Promise<void> {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/admin/backup", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Não foi possível exportar o backup.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rco-backup-${getTodayIsoDate()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(
        "Backup JSON gerado sem senhas e baixado com sucesso.",
        "Backup LGPD concluído"
      );
      void fetchLogs();
    } catch {
      toast.error("Erro de conexão ao gerar backup.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Cabecalho limpo com botao de Backup */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100">
              Auditoria LGPD e Backup
            </h2>
            <ShieldCheck className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Registro das operações sensíveis do sistema e exportação JSON completa sem credenciais.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportBackup}
          disabled={isExporting}
          className="inline-flex h-9 w-fit shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)] disabled:opacity-60"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>
            {isExporting ? "Gerando Backup..." : "Exportar Backup (JSON)"}
          </span>
        </button>
      </header>

      {/* Filtros */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuário, ação ou detalhe..."
              className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filtrar por ação"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
            >
              <option value="">Todas as ações</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filtrar por perfil"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:outline-none dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
            >
              <option value="">Todos os perfis</option>
              <option value="ADMIN">ADMIN</option>
              <option value="COORDENACAO">COORDENACAO</option>
              <option value="PROFESSOR">PROFESSOR</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              type="button"
              onClick={() => void fetchLogs()}
              aria-label="Recarregar logs"
              className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </section>

      {/* Tabela de Auditoria */}
      <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum evento de auditoria encontrado para os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200/80 text-left text-xs dark:divide-white/[0.08]">
              <thead className="bg-zinc-50 text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:bg-white/[0.03] dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Data / Hora</th>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                  <th className="px-4 py-3 font-medium">Entidade</th>
                  <th className="px-4 py-3 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-mono whitespace-nowrap tabular-nums text-zinc-500 dark:text-zinc-400">
                      {formatDateTimeBr(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {log.userName}
                      </p>
                      <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                        {log.userRole}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-medium ${getActionBadgeStyle(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {log.entity}
                    </td>
                    <td className="max-w-md px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
