"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BellRing,
  Camera,
  CameraOff,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Keyboard,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  ScanLine,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { Avatar } from "@/shared/components/Avatar";
import { useToast } from "@/shared/components/ToastProvider";
import {
  GATE_CHECKIN_BADGE_STYLES,
  GATE_CHECKIN_TYPE_LABELS,
} from "../constants";
import type {
  GateCheckInRecord,
  GateCheckInType,
  ScanCheckInResponse,
  TodayCheckInsResponse,
  TodayCheckInsSummary,
} from "../types";

interface GateScannerViewProps {
  initialData: TodayCheckInsResponse;
}

interface Html5QrcodeInstanceLike {
  start: (
    cameraIdOrConfig: { facingMode: string },
    configuration: { fps: number; qrbox: { width: number; height: number } },
    qrCodeSuccessCallback: (decodedText: string) => void,
    qrCodeErrorCallback?: (errorMessage: string) => void
  ) => Promise<null | void>;
  stop: () => Promise<void>;
  clear: () => void;
}

const CAMERA_REGION_ID = "rco-gate-qr-reader";

function playConfirmationBeep(kind: "success" | "warning" | "error"): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = kind === "success" ? 880 : kind === "warning" ? 560 : 310;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.17);
  } catch {
    // Ignora caso o navegador bloqueie Web Audio API.
  }
}

export function GateScannerView({
  initialData,
}: GateScannerViewProps): React.JSX.Element {
  const toast = useToast();

  const [mode, setMode] = useState<GateCheckInType>("ENTRADA");
  const [notifyGuardian, setNotifyGuardian] = useState(true);
  const [markAttendance, setMarkAttendance] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [manualCode, setManualCode] = useState("");
  const [isScanningApi, setIsScanningApi] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [lastResult, setLastResult] = useState<ScanCheckInResponse | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const [todayDate, setTodayDate] = useState(initialData.date);
  const [summary, setSummary] = useState<TodayCheckInsSummary>(
    initialData.summary
  );
  const [items, setItems] = useState<GateCheckInRecord[]>(initialData.items);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scannerRef = useRef<Html5QrcodeInstanceLike | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const isBusyRef = useRef(false);
  const lastDecodedRef = useRef<{ code: string; at: number } | null>(null);

  // Mantem referencias sincronizadas para leitura dentro do callback da camera
  const modeRef = useRef(mode);
  const notifyGuardianRef = useRef(notifyGuardian);
  const markAttendanceRef = useRef(markAttendance);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    notifyGuardianRef.current = notifyGuardian;
  }, [notifyGuardian]);

  useEffect(() => {
    markAttendanceRef.current = markAttendance;
  }, [markAttendance]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const stopCamera = useCallback(async (): Promise<void> => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    setIsCameraActive(false);

    if (!instance) {
      return;
    }

    try {
      await instance.stop();
    } catch {
      // Ignora erro caso a camera ja tenha sido encerrada.
    }

    try {
      instance.clear();
    } catch {
      // Ignora erro de limpeza DOM.
    }
  }, []);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  const submitScannedCode = useCallback(
    async (rawCode: string): Promise<void> => {
      const cleaned = rawCode.trim();
      if (!cleaned || isBusyRef.current) {
        return;
      }

      isBusyRef.current = true;
      setIsScanningApi(true);
      setLastError(null);

      try {
        const response = await fetch("/api/checkin/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: cleaned,
            mode: modeRef.current,
            notifyGuardian: notifyGuardianRef.current,
            markAttendance: markAttendanceRef.current,
          }),
        });

        if (!response.ok) {
          let message = "Não foi possível registrar a leitura.";
          try {
            const payload = (await response.json()) as Partial<ApiErrorPayload>;
            if (payload.error) {
              message = payload.error;
            }
          } catch {
            // Mantem mensagem padrao.
          }

          setLastError(message);
          setLastResult(null);
          if (soundEnabledRef.current) {
            playConfirmationBeep("error");
          }
          toast.error(message);
          return;
        }

        const payload = (await response.json()) as ScanCheckInResponse;
        setLastResult(payload);

        if (payload.duplicate) {
          if (soundEnabledRef.current) {
            playConfirmationBeep("warning");
          }
          toast.warning(payload.message, "Leitura recente");
        } else {
          if (soundEnabledRef.current) {
            playConfirmationBeep("success");
          }
          toast.success(
            payload.message,
            GATE_CHECKIN_TYPE_LABELS[payload.checkIn.type]
          );

          setItems((prev) => [
            payload.checkIn,
            ...prev.filter((item) => item.id !== payload.checkIn.id),
          ].slice(0, 50));

          setSummary((prev) => ({
            totalEntradas:
              prev.totalEntradas + (payload.checkIn.type === "ENTRADA" ? 1 : 0),
            totalAtrasos:
              prev.totalAtrasos + (payload.checkIn.type === "ATRASO" ? 1 : 0),
            totalSaidas:
              prev.totalSaidas + (payload.checkIn.type === "SAIDA" ? 1 : 0),
          }));
        }
      } catch {
        const message = "Falha de conexão com o servidor ao registrar leitura.";
        setLastError(message);
        if (soundEnabledRef.current) {
          playConfirmationBeep("error");
        }
        toast.error(message);
      } finally {
        isBusyRef.current = false;
        setIsScanningApi(false);
      }
    },
    [toast]
  );

  async function handleStartCamera(): Promise<void> {
    if (isCameraActive || isStartingCamera) {
      return;
    }

    setCameraError(null);
    setIsStartingCamera(true);

    try {
      // Import dinamico exclusivo no cliente para garantir compatibilidade 100% com SSR/next build
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(CAMERA_REGION_ID) as unknown as Html5QrcodeInstanceLike;
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => {
          const now = Date.now();
          const last = lastDecodedRef.current;
          if (last && last.code === decodedText && now - last.at < 2500) {
            return;
          }
          lastDecodedRef.current = { code: decodedText, at: now };
          void submitScannedCode(decodedText);
        },
        () => {
          // Frames sem QR Code sao esperados durante o escaneamento continuo.
        }
      );

      setIsCameraActive(true);
    } catch (error: unknown) {
      scannerRef.current = null;
      setIsCameraActive(false);

      const rawMsg = error instanceof Error ? error.message : String(error ?? "");
      if (rawMsg.toLowerCase().includes("permission") || rawMsg.toLowerCase().includes("notallowed")) {
        setCameraError(
          "Permissão da câmera negada pelo navegador. Libere o acesso à câmera ou utilize a digitação manual da matrícula abaixo."
        );
      } else {
        setCameraError(
          "Nenhuma câmera disponível neste dispositivo. Você pode registrar normalmente digitando a matrícula (CGM) ou usando leitor USB abaixo."
        );
      }
    } finally {
      setIsStartingCamera(false);
    }
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const value = manualCode.trim();
    if (!value) {
      return;
    }
    await submitScannedCode(value);
    setManualCode("");
    manualInputRef.current?.focus();
  }

  async function handleRefreshToday(): Promise<void> {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/checkin/today", { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as TodayCheckInsResponse;
        setTodayDate(payload.date);
        setSummary(payload.summary);
        setItems(payload.items);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  const formattedToday = todayDate
    ? todayDate.split("-").reverse().join("/")
    : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Cabecalho editorial */}
      <header className="flex flex-col gap-3 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.08]">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Portaria &amp; Leitor de QR Code
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Leia a Carteirinha Digital pela câmera ou digite a matrícula (CGM) para registrar entradas, atrasos e saídas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? "Desativar bipe sonoro" : "Ativar bipe sonoro"}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-300 dark:hover:bg-[#1A1D21]"
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
            )}
            <span>{soundEnabled ? "Bipe ativo" : "Sem som"}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleRefreshToday()}
            disabled={isRefreshing}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-300 dark:hover:bg-[#1A1D21]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-zinc-500 ${isRefreshing ? "animate-spin" : ""}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* Grade principal em 2 colunas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Coluna Esquerda: Controles, Camera e Entrada Manual */}
        <section className="space-y-4 lg:col-span-6">
          {/* Seletor de Modo + Opcoes */}
          <div className="rounded-xl border border-zinc-200/90 bg-white p-5 dark:border-white/[0.08] dark:bg-[#131518]">
            <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Tipo de registro
            </p>

            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode("ENTRADA")}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                  mode === "ENTRADA"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "border-zinc-200/90 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-[#1A1D21]/60 dark:text-zinc-300 dark:hover:bg-[#1A1D21]"
                }`}
              >
                <LogIn className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("ATRASO")}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                  mode === "ATRASO"
                    ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                    : "border-zinc-200/90 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-[#1A1D21]/60 dark:text-zinc-300 dark:hover:bg-[#1A1D21]"
                }`}
              >
                <Clock className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span>Atraso</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("SAIDA")}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                  mode === "SAIDA"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200/90 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-[#1A1D21]/60 dark:text-zinc-300 dark:hover:bg-[#1A1D21]"
                }`}
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                <span>Saída</span>
              </button>
            </div>

            {mode === "ATRASO" ? (
              <p className="mt-2.5 text-xs text-amber-700 dark:text-amber-300">
                No modo Atraso, o sistema registra automaticamente uma ocorrência leve e notifica os responsáveis vinculados.
              </p>
            ) : null}

            <div className="mt-4 space-y-2 border-t border-zinc-200/80 pt-3.5 dark:border-white/[0.08]">
              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={notifyGuardian}
                  onChange={(event) => setNotifyGuardian(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-[var(--school-primary)] dark:border-white/20"
                />
                <span>Avisar responsável automaticamente na entrada</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={markAttendance}
                  onChange={(event) => setMarkAttendance(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-[var(--school-primary)] dark:border-white/20"
                />
                <span>Marcar presença na chamada de hoje (se aberta)</span>
              </label>
            </div>
          </div>

          {/* Leitor de Camera */}
          <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white dark:border-white/[0.08] dark:bg-[#131518]">
            <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-3.5 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ScanLine
                  className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Leitor pela Câmera
                </h2>
              </div>

              {isCameraActive ? (
                <button
                  type="button"
                  onClick={() => void stopCamera()}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
                >
                  <CameraOff className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>Parar Câmera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleStartCamera()}
                  disabled={isStartingCamera}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--school-primary)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--school-primary-hover)] disabled:opacity-65"
                >
                  {isStartingCamera ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  )}
                  <span>{isStartingCamera ? "Iniciando..." : "Iniciar Câmera"}</span>
                </button>
              )}
            </div>

            <div className="p-4">
              <div className="relative overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-950/95 dark:border-white/[0.08]">
                <div
                  id={CAMERA_REGION_ID}
                  className={`w-full ${isCameraActive ? "min-h-[260px]" : "h-0 overflow-hidden"}`}
                />

                {!isCameraActive ? (
                  <div className="flex flex-col items-center justify-center bg-zinc-50 px-6 py-10 text-center dark:bg-[#0C0D0F]/70">
                    <Camera
                      className="h-7 w-7 text-zinc-400 dark:text-zinc-500"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <p className="mt-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Câmera em espera
                    </p>
                    <p className="mt-1 max-w-xs text-[11px] text-zinc-500 dark:text-zinc-400">
                      Clique em &ldquo;Iniciar Câmera&rdquo; para ler a Carteirinha Digital no celular ou notebook.
                    </p>
                  </div>
                ) : null}
              </div>

              {cameraError ? (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span>{cameraError}</span>
                </div>
              ) : null}

              {/* Campo de Digitacao Manual / Leitor USB */}
              <form
                onSubmit={handleManualSubmit}
                className="mt-4 space-y-2 border-t border-zinc-200/80 pt-4 dark:border-white/[0.08]"
              >
                <label
                  htmlFor="gate-manual-code"
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  <Keyboard className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
                  <span>Sem câmera? Digite a matrícula (CGM) ou cole o código e aperte Enter</span>
                </label>

                <div className="flex gap-2">
                  <input
                    ref={manualInputRef}
                    id="gate-manual-code"
                    type="text"
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    disabled={isScanningApi}
                    placeholder="Ex.: 2026100201 ou RCO-CARD:..."
                    className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200/90 bg-white px-3 font-mono text-xs text-zinc-900 placeholder:font-sans placeholder:text-zinc-400 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:opacity-60 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    disabled={isScanningApi || manualCode.trim().length < 2}
                    className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {isScanningApi ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <span>Registrar</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Card de Feedback Instantaneo da Ultima Leitura */}
          {lastResult ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border p-4 ${
                lastResult.duplicate
                  ? "border-amber-200/90 bg-amber-50/70 dark:border-amber-500/25 dark:bg-amber-500/10"
                  : "border-emerald-200/90 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={lastResult.checkIn.studentName} size="md" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {lastResult.checkIn.studentName}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        GATE_CHECKIN_BADGE_STYLES[lastResult.checkIn.type]
                      }`}
                    >
                      {GATE_CHECKIN_TYPE_LABELS[lastResult.checkIn.type]} ·{" "}
                      <span className="ml-1 font-mono tabular-nums">
                        {lastResult.checkIn.time}
                      </span>
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {lastResult.checkIn.classroomName} · {lastResult.checkIn.classroomSubject} · CGM{" "}
                    <span className="font-mono tabular-nums">
                      {lastResult.checkIn.registration}
                    </span>
                  </p>

                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {lastResult.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {lastResult.guardianNotified ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/90 bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-[#131518] dark:text-emerald-300">
                        <BellRing className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        <span>Responsável notificado</span>
                      </span>
                    ) : null}
                    {lastResult.occurrenceCreated ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/90 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-500/25 dark:bg-[#131518] dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        <span>Ocorrência de atraso criada</span>
                      </span>
                    ) : null}
                    {lastResult.attendanceMarked ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200/90 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-white/10 dark:bg-[#131518] dark:text-zinc-300">
                        <ClipboardCheck className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                        <span>Presença marcada na chamada</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : lastError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200/90 bg-red-50/80 p-4 text-xs text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{lastError}</span>
            </div>
          ) : null}
        </section>

        {/* Coluna Direita: Contadores e Lista ao Vivo de Hoje */}
        <section className="space-y-4 lg:col-span-6">
          {/* 3 Mini-contadores do dia */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-200/90 bg-white p-4 dark:border-white/[0.08] dark:bg-[#131518]">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Entradas hoje
              </p>
              <p className="mt-1.5 font-mono text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                {summary.totalEntradas}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200/90 bg-white p-4 dark:border-white/[0.08] dark:bg-[#131518]">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Atrasos
              </p>
              <p className="mt-1.5 font-mono text-2xl font-semibold text-amber-700 tabular-nums dark:text-amber-300">
                {summary.totalAtrasos}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200/90 bg-white p-4 dark:border-white/[0.08] dark:bg-[#131518]">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Saídas
              </p>
              <p className="mt-1.5 font-mono text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                {summary.totalSaidas}
              </p>
            </div>
          </div>

          {/* Lista ao vivo dos registros de hoje */}
          <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white dark:border-white/[0.08] dark:bg-[#131518]">
            <div className="flex items-center justify-between border-b border-zinc-200/80 px-5 py-3.5 dark:border-white/[0.08]">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Registros de hoje
                </h2>
                <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                  {formattedToday} · Últimas {items.length} leitura(s)
                </p>
              </div>
              <CheckCircle2
                className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>

            {items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ScanLine
                  className="mx-auto h-6 w-6 text-zinc-400 dark:text-zinc-500"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p className="mt-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Nenhuma leitura registrada hoje
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Inicie a câmera ou digite a matrícula (CGM) ao lado para registrar o primeiro estudante.
                </p>
              </div>
            ) : (
              <ul className="max-h-[540px] divide-y divide-zinc-200/70 overflow-y-auto dark:divide-white/[0.06]">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-12 shrink-0 font-mono text-xs font-medium text-zinc-500 tabular-nums dark:text-zinc-400">
                        {item.time}
                      </span>
                      <Avatar name={item.studentName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.studentName}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {item.classroomName} · CGM{" "}
                          <span className="font-mono tabular-nums">{item.registration}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        GATE_CHECKIN_BADGE_STYLES[item.type]
                      }`}
                    >
                      {GATE_CHECKIN_TYPE_LABELS[item.type]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
