"use client";

import { Calendar, CheckCircle2, Clock, Edit3, XCircle } from "lucide-react";
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
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((skeleton) => (
          <div
            key={skeleton}
            className="h-24 animate-pulse rounded-2xl bg-white p-5 ring-1 ring-slate-900/[0.06]"
          />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Calendar className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">
          Nenhuma chamada registrada ainda
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
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
            className={`rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 transition-[box-shadow] duration-150 ${
              isCurrent
                ? "ring-2 ring-[#1E40AF]"
                : "ring-slate-900/[0.06] hover:ring-blue-800/30"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-medium text-[#1E40AF] ring-1 ring-inset ring-blue-200">
                    <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {formatIsoDateBr(lesson.date)}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                    {lesson.lessonNumber}ª aula
                  </span>
                  {isCurrent ? (
                    <span className="inline-flex items-center rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white">
                      Em edição
                    </span>
                  ) : null}
                </div>

                <p className="line-clamp-2 text-sm font-medium text-slate-900">
                  {lesson.content}
                </p>

                {lesson.observations ? (
                  <p className="line-clamp-1 text-xs text-slate-500">
                    Obs.: {lesson.observations}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {lesson.presentCount}{" "}
                    {lesson.presentCount === 1 ? "presente" : "presentes"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-red-700">
                    <XCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {lesson.absentCount} {lesson.absentCount === 1 ? "falta" : "faltas"}
                  </span>
                  {lesson.justifiedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-800">
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
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-[#1E40AF]"
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
