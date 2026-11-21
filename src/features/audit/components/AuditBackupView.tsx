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
    return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30";
  }
  if (action.includes("TRANCAR") || action.includes("CONFIG")) {
    return "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30";
  }
  if (action.includes("APROVAR") || action.includes("CRIAR") || action.includes("BACKUP")) {
    return "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30";
  }
  return "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30";
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
    <div className="space-y-6">
      {/* Cabecalho com botao de Backup Completo */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-ambient)] sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Trilha de Auditoria LGPD e Backup
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Registro automático das operações sensíveis e snapshot JSON completo sem credenciais.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportBackup}
          disabled={isExporting}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--school-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-[var(--school-primary-hover)] active:scale-[0.98] disabled:opacity-60 sm:text-sm"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>
            {isExporting ? "Gerando Backup..." : "Exportar Backup Completo (JSON)"}
          </span>
        </button>
      </section>

      {/* Filtros */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-ambient)] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuário, ação ou detalhe..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filtrar por ação"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              className="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Tabela / Timeline de Auditoria */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-ambient)] dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum evento de auditoria encontrado para os filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs dark:divide-slate-800">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data / Hora</th>
                  <th className="px-4 py-3 font-semibold">Usuário</th>
                  <th className="px-4 py-3 font-semibold">Ação</th>
                  <th className="px-4 py-3 font-semibold">Entidade</th>
                  <th className="px-4 py-3 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-mono whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatDateTimeBr(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {log.userName}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {log.userRole}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${getActionBadgeStyle(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {log.entity}
                    </td>
                    <td className="max-w-md px-4 py-3 text-slate-700 dark:text-slate-300">
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
