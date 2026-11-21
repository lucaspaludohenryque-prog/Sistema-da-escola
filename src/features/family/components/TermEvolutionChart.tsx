"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import {
  PASSING_GRADE_THRESHOLD,
  formatScoreBr,
} from "@/features/grades/constants";
import type { ReportTermSummary } from "@/features/reports/types";
import { useTheme } from "@/shared/components/ThemeProvider";

interface TermEvolutionChartProps {
  terms: ReportTermSummary[];
}

interface TermPoint {
  label: string;
  term: number;
  average: number | null;
}

interface TermTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TermPoint }>;
}

function TermTooltip({
  active,
  payload,
}: TermTooltipProps): React.JSX.Element | null {
  const first = payload?.[0];
  if (!active || !first) {
    return null;
  }

  const point = first.payload;
  const isLow =
    point.average !== null && point.average < PASSING_GRADE_THRESHOLD;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {point.term}º Trimestre
      </p>
      <p
        className={`mt-1 font-mono text-sm font-bold ${
          point.average === null
            ? "text-slate-500 dark:text-slate-400"
            : isLow
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-700 dark:text-emerald-400"
        }`}
      >
        Média: {formatScoreBr(point.average)}
      </p>
    </div>
  );
}

export function TermEvolutionChart({
  terms,
}: TermEvolutionChartProps): React.JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartData: TermPoint[] = terms.map((item) => ({
    label: `${item.term}º Trim.`,
    term: item.term,
    average: item.termAverage,
  }));

  const hasAnyScore = chartData.some((item) => item.average !== null);
  const gridStroke = isDark ? "#1e293b" : "#e2e8f0";
  const axisTickColor = isDark ? "#94a3b8" : "#64748b";
  const strokeColor = isDark ? "#60a5fa" : "var(--school-primary)";

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/80 pb-3.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp
            className="h-5 w-5 text-[var(--school-primary)] dark:text-blue-400"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Evolução da Média por Trimestre
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Linha tracejada indica a média mínima de aprovação (6,0)
            </p>
          </div>
        </div>
      </div>

      {!hasAnyScore ? (
        <div className="flex h-[210px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <TrendingUp className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Ainda sem notas suficientes para traçar evolução
          </p>
          <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
            Assim que as avaliações forem lançadas, o gráfico exibirá a evolução trimestral do
            estudante.
          </p>
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 14, right: 18, left: -14, bottom: 4 }}
            >
              <defs>
                <linearGradient id="termAverageFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isDark ? "#60a5fa" : "#1d4ed8"}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="95%"
                    stopColor={isDark ? "#60a5fa" : "#1d4ed8"}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridStroke}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: axisTickColor, fontSize: 12 }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tick={{ fill: axisTickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TermTooltip />} />
              <ReferenceLine
                y={PASSING_GRADE_THRESHOLD}
                stroke="#d97706"
                strokeDasharray="5 5"
                label={{
                  value: "Mín. 6,0",
                  position: "insideTopRight",
                  fill: isDark ? "#fbbf24" : "#b45309",
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="average"
                connectNulls
                stroke={strokeColor}
                strokeWidth={2.5}
                fill="url(#termAverageFill)"
                dot={{
                  r: 5,
                  strokeWidth: 2,
                  fill: isDark ? "#0f172a" : "#ffffff",
                  stroke: strokeColor,
                }}
                activeDot={{ r: 6.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
