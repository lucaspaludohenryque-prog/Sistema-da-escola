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
  INDISCIPLINA: "#be5252",
  ATRASO: "#c2883a",
  SEM_MATERIAL: "#a16a4b",
  USO_CELULAR: "#5b6ea6",
  ELOGIO: "#2e8b6a",
  OUTRO: "#71717a",
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
    <div className="rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#1A1D21]">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">
        {item.classroomName} · {item.subject}
      </p>
      <p
        className={`mt-1 font-mono text-sm font-semibold tabular-nums ${
          isLow
            ? "text-red-600 dark:text-red-400"
            : "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {item.attendanceRate}% de presença
      </p>
      <p className="mt-0.5 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
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
    <div className="rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#1A1D21]">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">
        {item.label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
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

  const gridStroke = isDark ? "#27272A" : "#E4E4E7";
  const axisTickColor = "#71717A";
  const totalOccurrences = occurrencesByType.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* Grafico 1: Frequencia por Turma */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-zinc-200/70 pb-3 dark:border-white/[0.07]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Frequência Média por Turma
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Referência mínima institucional de {LOW_ATTENDANCE_THRESHOLD}%
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: schoolPrimaryColor }}
                aria-hidden="true"
              />
              Adequada
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-[#be5252]"
                aria-hidden="true"
              />
              &lt; {LOW_ATTENDANCE_THRESHOLD}%
            </span>
          </div>
        </div>

        {attendanceByClassroom.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 px-6 text-center dark:border-white/[0.08] dark:bg-[#0C0D0F]/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
              <BarChart3 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Nenhuma chamada registrada ainda
            </p>
            <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
              Assim que as primeiras chamadas forem salvas, o comparativo de frequência aparecerá
              aqui.
            </p>
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceByClassroom}
                margin={{ top: 12, right: 12, left: -14, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridStroke}
                  strokeOpacity={0.75}
                />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: axisTickColor, fontSize: 11 }}
                  axisLine={false}
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
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(24, 24, 27, 0.035)",
                  }}
                />
                <ReferenceLine
                  y={LOW_ATTENDANCE_THRESHOLD}
                  stroke="#be5252"
                  strokeDasharray="4 4"
                  strokeOpacity={0.65}
                />
                <Bar
                  dataKey="attendanceRate"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                >
                  {attendanceByClassroom.map((entry) => (
                    <Cell
                      key={entry.classroomId}
                      fill={
                        entry.attendanceRate < LOW_ATTENDANCE_THRESHOLD
                          ? "#be5252"
                          : schoolPrimaryColor
                      }
                      fillOpacity={0.88}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Grafico 2: Ocorrencias por Tipo (Donut) */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
        <div className="mb-4 flex items-start justify-between gap-2 border-b border-zinc-200/70 pb-3 dark:border-white/[0.07]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Ocorrências por Categoria
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Distribuição dos registros disciplinares, pedagógicos e elogios
            </p>
          </div>
          <span className="font-mono text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
            Total: {totalOccurrences}
          </span>
        </div>

        {occurrencesByType.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 px-6 text-center dark:border-white/[0.08] dark:bg-[#0C0D0F]/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
              <PieChartIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Sem ocorrências para distribuir
            </p>
            <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
              Registros adicionados no módulo de Ocorrências serão agrupados automaticamente neste
              gráfico.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_0.95fr]">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occurrencesByType}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={2}
                    stroke={isDark ? "#131518" : "#ffffff"}
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

            <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {occurrencesByType.map((entry) => {
                const pct =
                  totalOccurrences > 0
                    ? Math.round((entry.count / totalOccurrences) * 100)
                    : 0;
                return (
                  <li
                    key={entry.type}
                    className="flex items-center justify-between gap-2 py-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: OCCURRENCE_TYPE_COLORS[entry.type],
                        }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-zinc-700 dark:text-zinc-300">
                        {entry.label}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                      {entry.count}{" "}
                      <span className="font-normal text-zinc-400 dark:text-zinc-500">
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
