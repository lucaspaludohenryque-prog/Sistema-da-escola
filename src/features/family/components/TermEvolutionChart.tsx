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
    <div className="rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs shadow-[var(--shadow-popover)] dark:border-white/10 dark:bg-[#1A1D21]">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">
        {point.term}º Trimestre
      </p>
      <p
        className={`mt-1 font-mono text-sm font-semibold tabular-nums ${
          point.average === null
            ? "text-zinc-500 dark:text-zinc-400"
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
  const gridStroke = isDark ? "#27272A" : "#E4E4E7";
  const axisTickColor = "#71717A";
  const strokeColor = isDark ? "#60a5fa" : "var(--school-primary)";

  return (
    <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#131518] dark:shadow-none">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-zinc-200/70 pb-3 dark:border-white/[0.07]">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Evolução da Média por Trimestre
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Linha tracejada indica a média mínima de aprovação (6,0)
          </p>
        </div>
        <TrendingUp
          className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>

      {!hasAnyScore ? (
        <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 px-6 text-center dark:border-white/[0.08] dark:bg-[#0C0D0F]/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-[#1A1D21] dark:text-zinc-400">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Ainda sem notas suficientes para traçar evolução
          </p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
            Assim que as avaliações forem lançadas, o gráfico exibirá a evolução trimestral do
            estudante.
          </p>
        </div>
      ) : (
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
            >
              <defs>
                <linearGradient id="termAverageFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isDark ? "#60a5fa" : "#1d4ed8"}
                    stopOpacity={0.16}
                  />
                  <stop
                    offset="95%"
                    stopColor={isDark ? "#60a5fa" : "#1d4ed8"}
                    stopOpacity={0.01}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridStroke}
                strokeOpacity={0.75}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: axisTickColor, fontSize: 11 }}
                axisLine={false}
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
                stroke="#c2883a"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{
                  value: "Mín. 6,0",
                  position: "insideTopRight",
                  fill: axisTickColor,
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="average"
                connectNulls
                stroke={strokeColor}
                strokeWidth={2}
                fill="url(#termAverageFill)"
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: isDark ? "#131518" : "#ffffff",
                  stroke: strokeColor,
                }}
                activeDot={{ r: 5.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
