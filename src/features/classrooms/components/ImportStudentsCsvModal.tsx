"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/shared/components/ToastProvider";
import type { ApiErrorPayload, StudentRecord } from "../types";

interface ParsedCsvStudent {
  name: string;
  registration: string;
  guardianName: string;
  guardianPhone: string;
}

interface ImportStudentsCsvModalProps {
  isOpen: boolean;
  classroomId: string;
  onClose: () => void;
  onImported: (students: StudentRecord[]) => void;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseStudentsCsv(text: string): ParsedCsvStudent[] {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const firstLine = lines[0] ?? "";
  const delimiter = firstLine.includes(";") ? ";" : ",";
  const firstCols = splitCsvLine(firstLine, delimiter).map((c) => c.toLowerCase());
  const looksLikeHeader =
    firstCols.some((c) => c.includes("nome") || c.includes("name")) &&
    firstCols.some((c) => c.includes("matr") || c.includes("cgm"));

  const dataLines = looksLikeHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = splitCsvLine(line, delimiter);
    return {
      name: cols[0] ?? "",
      registration: cols[1] ?? "",
      guardianName: cols[2] ?? "",
      guardianPhone: cols[3] ?? "",
    };
  });
}

export function ImportStudentsCsvModal({
  isOpen,
  classroomId,
  onClose,
  onImported,
}: ImportStudentsCsvModalProps): React.JSX.Element | null {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedCsvStudent[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) {
    return null;
  }

  function handleDownloadTemplate(): void {
    const template =
      "\uFEFFnome;matricula;responsavel;telefone\r\n" +
      "João Pedro Silva;2026090901;Maria Silva;(41) 99999-1111\r\n" +
      "Ana Clara Souza;2026090902;Carlos Souza;(41) 99999-2222\r\n";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-importacao-alunos.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const parsed = parseStudentsCsv(reader.result);
        setRows(parsed);
        if (parsed.length === 0) {
          toast.warning("Nenhum aluno detectado no arquivo CSV selecionado.");
        }
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleConfirm(): Promise<void> {
    if (rows.length === 0 || isImporting) return;
    setIsImporting(true);
    try {
      const response = await fetch(
        `/api/classrooms/${classroomId}/import-students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: rows }),
        }
      );

      if (!response.ok) {
        let message = "Não foi possível importar os alunos.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) message = payload.error;
        } catch {}
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as {
        importedCount: number;
        skippedCount: number;
        errors: string[];
        students: StudentRecord[];
      };

      onImported(payload.students);
      setRows([]);
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
      onClose();

      if (payload.importedCount > 0) {
        toast.success(
          `${payload.importedCount} aluno(s) importado(s)${payload.skippedCount > 0 ? `, ${payload.skippedCount} ignorado(s) por matrícula já existente` : ""}.`,
          "Importação concluída"
        );
      } else {
        toast.warning(
          `Nenhum novo aluno importado (${payload.skippedCount} duplicado(s), ${payload.errors.length} erro(s)).`
        );
      }
    } catch {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-csv-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={() => {
          if (!isImporting) onClose();
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex items-start justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="import-csv-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Importar Alunos por CSV
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Colunas esperadas: <span className="font-mono">nome;matricula;responsavel;telefone</span>.
              Matrículas já cadastradas serão ignoradas automaticamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[var(--school-primary)] dark:bg-blue-500/15 dark:text-blue-300">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {fileName ?? "Selecione um arquivo .csv"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {rows.length > 0
                    ? `${rows.length} linha(s) pronta(s) para pré-visualização`
                    : "Separado por ponto-e-vírgula (;) ou vírgula (,)"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar Modelo CSV</span>
              </button>

              <input
                ref={fileRef}
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label
                htmlFor="csv-file-input"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--school-primary-hover)]"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Selecionar CSV</span>
              </label>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs dark:divide-slate-800">
                <thead className="sticky top-0 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nome</th>
                    <th className="px-3 py-2 font-semibold">Matrícula</th>
                    <th className="px-3 py-2 font-semibold">Responsável</th>
                    <th className="px-3 py-2 font-semibold">Telefone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {rows.slice(0, 50).map((row, idx) => (
                    <tr key={`${row.registration}-${idx}`}>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                        {row.name || "-"}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                        {row.registration || "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                        {row.guardianName || "-"}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                        {row.guardianPhone || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={rows.length === 0 || isImporting}
              onClick={() => void handleConfirm()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--school-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--school-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Confirmar Importação ({rows.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
