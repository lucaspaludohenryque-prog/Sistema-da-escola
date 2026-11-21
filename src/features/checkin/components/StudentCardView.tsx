"use client";
/* eslint-disable @next/next/no-img-element -- Exibe brasao da escola e QR Code gerado em Data URL com suporte a impressao. */

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  BookOpenCheck,
  IdCard,
  Printer,
  ShieldCheck,
} from "lucide-react";
import type { UserRole } from "@/features/auth/types";
import { SHIFT_LABELS } from "@/features/classrooms/constants";
import { Avatar } from "@/shared/components/Avatar";
import { Skeleton } from "@/shared/components/Skeleton";
import type { StudentCardItem } from "../types";

interface StudentCardViewProps {
  cards: StudentCardItem[];
  userRole: UserRole;
  backHref?: string;
}

export function StudentCardView({
  cards,
  userRole,
  backHref,
}: StudentCardViewProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const activeCard = cards[selectedIndex] ?? cards[0] ?? null;

  useEffect(() => {
    if (!activeCard) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    setIsGeneratingQr(true);

    QRCode.toDataURL(activeCard.qrPayload, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsGeneratingQr(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeCard]);

  if (!activeCard) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-1 border-b border-zinc-200/80 pb-5 dark:border-white/[0.08]">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Carteirinha Estudantil Digital
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Identificação escolar com QR Code para leitura rápida na portaria.
          </p>
        </header>

        <div className="rounded-xl border border-zinc-200/90 bg-white px-6 py-12 text-center dark:border-white/[0.08] dark:bg-[#131518]">
          <IdCard
            className="mx-auto h-7 w-7 text-zinc-400 dark:text-zinc-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Nenhuma carteirinha disponível para este perfil
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {userRole === "RESPONSAVEL" || userRole === "ALUNO"
              ? "Solicite à secretaria escolar a vinculação do cadastro estudantil."
              : "Selecione um estudante em Turmas para visualizar ou imprimir a carteirinha."}
          </p>
        </div>
      </div>
    );
  }

  const locationLine = [activeCard.schoolCity, activeCard.schoolState]
    .filter((part) => part.trim().length > 0)
    .join(" - ");

  return (
    <div className="mx-auto max-w-3xl space-y-6 print:max-w-none print:space-y-0">
      {/* Cabecalho editorial (oculto na impressao) */}
      <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.08] print:hidden">
        <div className="space-y-1">
          {backHref ? (
            <Link
              href={backHref}
              className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              <span>Voltar</span>
            </Link>
          ) : null}
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Carteirinha Estudantil Digital
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Apresente o QR Code na portaria para registro instantâneo de entrada e presença.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-lg bg-[var(--school-primary)] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-[var(--school-primary-hover)] sm:self-auto"
        >
          <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          <span>Imprimir / Salvar Carteirinha</span>
        </button>
      </header>

      {/* Seletor quando ha mais de 1 filho/estudante (oculto na impressao) */}
      {cards.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {userRole === "RESPONSAVEL" ? "Selecionar filho(a):" : "Estudante:"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {cards.map((card, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={card.studentId}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-200/90 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-300 dark:hover:bg-[#1A1D21]"
                  }`}
                >
                  <span>{card.name.split(" ").slice(0, 2).join(" ")}</span>
                  <span
                    className={`text-[11px] ${
                      isSelected
                        ? "text-zinc-300 dark:text-zinc-600"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {card.classroomName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Cartao fisico institucional (centralizado e otimizado para @media print) */}
      <div className="flex flex-col items-center py-2 print:py-0">
        <article className="rco-print-sheet w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[#131518] dark:shadow-none print:mx-auto print:max-w-sm print:border print:border-zinc-300 print:bg-white print:text-zinc-900 print:shadow-none">
          {/* Faixa superior institucional fina */}
          <div
            aria-hidden="true"
            className="h-2 w-full bg-[var(--school-primary)]"
          />

          <div className="p-6">
            {/* Cabecalho institucional da carteirinha */}
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-white/[0.08] print:border-zinc-200">
              <div className="flex min-w-0 items-center gap-2.5">
                {activeCard.schoolLogoUrl ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-50 p-1 ring-1 ring-zinc-200/80 dark:bg-[#1A1D21] dark:ring-white/[0.08] print:bg-white print:ring-zinc-200">
                    <img
                      src={activeCard.schoolLogoUrl}
                      alt={`Brasão ${activeCard.schoolName}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--school-primary)] text-white">
                    <BookOpenCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100 print:text-zinc-900">
                    {activeCard.schoolName}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400 print:text-zinc-600">
                    {locationLine || "Identificação Estudantil"}
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-md border border-zinc-200/90 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700 tabular-nums dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 print:border-zinc-300 print:bg-zinc-50 print:text-zinc-800">
                {activeCard.schoolYear}
              </span>
            </div>

            {/* Dados do estudante */}
            <div className="mt-5 flex flex-col items-center text-center">
              <Avatar name={activeCard.name} size="lg" />

              <h2 className="mt-3 text-base font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100 print:text-zinc-900">
                {activeCard.name}
              </h2>

              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 print:text-zinc-600">
                {activeCard.classroomName} · {activeCard.classroomSubject}
              </p>

              {/* Grade compacta de metadados */}
              <dl className="mt-4 grid w-full grid-cols-3 divide-x divide-zinc-200/80 rounded-xl border border-zinc-200/80 bg-zinc-50/70 py-2.5 dark:divide-white/[0.08] dark:border-white/[0.08] dark:bg-[#1A1D21]/60 print:divide-zinc-200 print:border-zinc-200 print:bg-zinc-50">
                <div className="px-2">
                  <dt className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase dark:text-zinc-500 print:text-zinc-500">
                    Matrícula
                  </dt>
                  <dd className="mt-0.5 truncate font-mono text-xs font-semibold text-zinc-900 tabular-nums dark:text-zinc-100 print:text-zinc-900">
                    {activeCard.registration}
                  </dd>
                </div>
                <div className="px-2">
                  <dt className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase dark:text-zinc-500 print:text-zinc-500">
                    Turno
                  </dt>
                  <dd className="mt-0.5 truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100 print:text-zinc-900">
                    {SHIFT_LABELS[activeCard.shift]}
                  </dd>
                </div>
                <div className="px-2">
                  <dt className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase dark:text-zinc-500 print:text-zinc-500">
                    Frequência
                  </dt>
                  <dd className="mt-0.5 font-mono text-xs font-semibold text-zinc-900 tabular-nums dark:text-zinc-100 print:text-zinc-900">
                    {activeCard.attendanceRate !== null
                      ? `${activeCard.attendanceRate}%`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Area do QR Code em fundo branco puro para leitura instantanea mesmo no Modo Escuro */}
            <div className="mt-5 flex flex-col items-center">
              <div className="flex h-[204px] w-[204px] items-center justify-center rounded-xl border border-zinc-200 bg-white p-3">
                {isGeneratingQr || !qrDataUrl ? (
                  <Skeleton className="h-[180px] w-[180px] rounded-lg" />
                ) : (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code da carteirinha de ${activeCard.name}`}
                    width={180}
                    height={180}
                    className="h-[180px] w-[180px] object-contain"
                  />
                )}
              </div>

              <p className="mt-2.5 font-mono text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400 print:text-zinc-600">
                CGM {activeCard.registration}
              </p>
            </div>

            {/* Rodape de autenticidade do cracha */}
            <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-zinc-200/80 pt-3.5 text-[11px] text-zinc-500 dark:border-white/[0.08] dark:text-zinc-400 print:border-zinc-200 print:text-zinc-600">
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500 print:text-zinc-500"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Documento escolar de uso pessoal e intransferível</span>
            </div>
          </div>
        </article>

        <p className="mt-4 max-w-sm text-center text-xs text-zinc-500 dark:text-zinc-400 print:hidden">
          Dica: aumente o brilho da tela ao aproximar o QR Code da câmera na portaria para leitura instantânea.
        </p>
      </div>
    </div>
  );
}
