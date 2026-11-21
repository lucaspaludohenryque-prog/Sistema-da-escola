"use client";

import { Calendar, CheckCircle2, Clock, Edit3, XCircle } from "lucide-react";
import { CardsStackSkeleton } from "@/shared/components/Skeleton";
import { formatIsoDateBr } from "../constants";
import type { LessonHistoryItem } from "../types";

interface LessonHistoryListProps {
  lessons: LessonHistoryItem[];
  isLoading: boolean;
  activeDate: string;
  activeLessonNumber: number;
  onSelectLesson: (date: string, lessonNumber: number) => void;
}

export function LessonHistoryList({
  lessons,
  isLoading,
  activeDate,
  activeLessonNumber,
  onSelectLesson,
}: LessonHistoryListProps): React.JSX.Element {
  if (isLoading) {
    return <CardsStackSkeleton count={3} />;
  }

  if (lessons.length === 0) {
    return (
      <section className="rounded-xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 dark:bg-[#131518] dark:ring-white/[0.08]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-[#1A1D21] dark:text-zinc-400">
          <Calendar className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Nenhuma chamada registrada ainda
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          As aulas salvas para esta turma aparecerão aqui para consulta rápida e edição posterior.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Histórico de chamadas" className="space-y-3">
      {lessons.map((lesson) => {
        const isCurrent =
          lesson.date === activeDate && lesson.lessonNumber === activeLessonNumber;

        return (
          <article
            key={lesson.id}
            className={`rounded-xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 transition-[box-shadow] duration-150 dark:bg-[#131518] ${
              isCurrent
                ? "ring-2 ring-[var(--school-primary)]"
                : "ring-zinc-200/80 hover:ring-[var(--school-primary-soft-border)] dark:ring-white/[0.08] dark:hover:ring-slate-700"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-medium text-[var(--school-primary)] ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30">
                    <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {formatIsoDateBr(lesson.date)}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-[#1A1D21] dark:text-zinc-300 dark:ring-white/[0.1]">
                    {lesson.lessonNumber}ª aula
                  </span>
                  {isCurrent ? (
                    <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                      Em edição
                    </span>
                  ) : null}
                </div>

                <p className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {lesson.content}
                </p>

                {lesson.observations ? (
                  <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Obs.: {lesson.observations}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {lesson.presentCount}{" "}
                    {lesson.presentCount === 1 ? "presente" : "presentes"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-red-700 dark:text-red-400">
                    <XCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {lesson.absentCount} {lesson.absentCount === 1 ? "falta" : "faltas"}
                  </span>
                  {lesson.justifiedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-800 dark:text-amber-300">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      {lesson.justifiedCount}{" "}
                      {lesson.justifiedCount === 1 ? "justificada" : "justificadas"}
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectLesson(lesson.date, lesson.lessonNumber)}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
              >
                <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                <span>Abrir e editar</span>
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
