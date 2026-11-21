"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { LOW_ATTENDANCE_THRESHOLD } from "@/features/attendance/constants";
import type { OccurrenceType } from "@/features/occurrences/types";
import { useTheme } from "@/shared/components/ThemeProvider";
import type {
  ClassroomAttendanceChartItem,
  OccurrenceTypeChartItem,
} from "../types";

interface DashboardChartsProps {
  attendanceByClassroom: ClassroomAttendanceChartItem[];
  occurrencesByType: OccurrenceTypeChartItem[];
  schoolPrimaryColor: string;
}

const OCCURRENCE_TYPE_COLORS: Record<OccurrenceType, string> = {
  INDISCIPLINA: "#dc2626",
  ATRASO: "#d97706",
  SEM_MATERIAL: "#ea580c",
  USO_CELULAR: "#4f46e5",
  ELOGIO: "#059669",
  OUTRO: "#64748b",
};

interface AttendanceTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ClassroomAttendanceChartItem }>;
}

function AttendanceTooltip({
  active,
  payload,
}: AttendanceTooltipProps): React.JSX.Element | null {
  const first = payload?.[0];
  if (!active || !first) {
    return null;
  }

  const item = first.payload;
  const isLow = item.attendanceRate < LOW_ATTENDANCE_THRESHOLD;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {item.classroomName} - {item.subject}
      </p>
      <p
        className={`mt-1 font-mono text-sm font-bold ${
          isLow
            ? "text-red-600 dark:text-red-400"
            : "text-emerald-700 dark:text-emerald-400"
        }`}
      >
        {item.attendanceRate}% de presença
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
        {item.totalRecords}{" "}
        {item.totalRecords === 1 ? "registro lançado" : "registros lançados"}
        {isLow ? " · Abaixo do mínimo (75%)" : ""}
      </p>
    </div>
  );
}

interface OccurrenceTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: OccurrenceTypeChartItem }>;
  total: number;
}

function OccurrenceTooltip({
  active,
  payload,
  total,
}: OccurrenceTooltipProps): React.JSX.Element | null {
  const first = payload?.[0];
  if (!active || !first) {
    return null;
  }

  const item = first.payload;
  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {item.label}
      </p>
      <p className="mt-1 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
        {item.count} {item.count === 1 ? "registro" : "registros"} ({pct}%)
      </p>
    </div>
  );
}

export function DashboardCharts({
  attendanceByClassroom,
  occurrencesByType,
  schoolPrimaryColor,
}: DashboardChartsProps): React.JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridStroke = isDark ? "#1e293b" : "#e2e8f0";
  const axisTickColor = isDark ? "#94a3b8" : "#64748b";
  const totalOccurrences = occurrencesByType.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Grafico 1: Frequencia por Turma */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-3.5 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Frequência Média por Turma
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Turmas abaixo de {LOW_ATTENDANCE_THRESHOLD}% recebem destaque em vermelho
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-xs"
                style={{ backgroundColor: schoolPrimaryColor }}
                aria-hidden="true"
              />
              Adequada
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-xs bg-red-600"
                aria-hidden="true"
              />
              &lt; {LOW_ATTENDANCE_THRESHOLD}%
            </span>
          </div>
        </div>

        {attendanceByClassroom.length === 0 ? (
          <div className="flex h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <BarChart3 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Nenhuma chamada registrada ainda
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
              Assim que as primeiras chamadas forem salvas, o comparativo de frequência aparecerá
              aqui.
            </p>
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceByClassroom}
                margin={{ top: 14, right: 16, left: -12, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridStroke}
                />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<AttendanceTooltip />}
                  cursor={{
                    fill: isDark
                      ? "rgba(148, 163, 184, 0.08)"
                      : "rgba(15, 23, 42, 0.04)",
                  }}
                />
                <ReferenceLine
                  y={LOW_ATTENDANCE_THRESHOLD}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  strokeOpacity={0.75}
                />
                <Bar
                  dataKey="attendanceRate"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                >
                  {attendanceByClassroom.map((entry) => (
                    <Cell
                      key={entry.classroomId}
                      fill={
                        entry.attendanceRate < LOW_ATTENDANCE_THRESHOLD
                          ? "#dc2626"
                          : schoolPrimaryColor
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Grafico 2: Ocorrencias por Tipo (Donut) */}
      <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="mb-4 flex items-start justify-between gap-2 border-b border-slate-200/80 pb-3.5 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Ocorrências por Categoria
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Distribuição dos registros disciplinares, pedagógicos e elogios
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
            Total: {totalOccurrences}
          </span>
        </div>

        {occurrencesByType.length === 0 ? (
          <div className="flex h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <PieChartIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Sem ocorrências para distribuir
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
              Registros adicionados no módulo de Ocorrências serão agrupados automaticamente neste
              gráfico.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_0.95fr]">
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occurrencesByType}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke={isDark ? "#0f172a" : "#ffffff"}
                    strokeWidth={2}
                  >
                    {occurrencesByType.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={OCCURRENCE_TYPE_COLORS[entry.type]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<OccurrenceTooltip total={totalOccurrences} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="space-y-2.5">
              {occurrencesByType.map((entry) => {
                const pct =
                  totalOccurrences > 0
                    ? Math.round((entry.count / totalOccurrences) * 100)
                    : 0;
                return (
                  <li
                    key={entry.type}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/80 px-3 py-2 text-xs dark:bg-slate-800/60"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: OCCURRENCE_TYPE_COLORS[entry.type],
                        }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {entry.label}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {entry.count}{" "}
                      <span className="font-normal text-slate-500 dark:text-slate-400">
                        ({pct}%)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
