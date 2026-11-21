"use client";
/* eslint-disable @next/next/no-img-element -- Pre-visualizacao de logo em Base64 data URL. */

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import {
  ALLOWED_LOGO_MIME_TYPES,
  BRAZILIAN_STATES,
  MAX_LOGO_UPLOAD_BYTES,
} from "../constants";
import type { SchoolConfigData } from "../types";

interface SchoolConfigViewProps {
  initialConfig: SchoolConfigData;
}

export function SchoolConfigView({
  initialConfig,
}: SchoolConfigViewProps): React.JSX.Element {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialConfig.name);
  const [city, setCity] = useState(initialConfig.city);
  const [state, setState] = useState(initialConfig.state || "PR");
  const [phone, setPhone] = useState(initialConfig.phone);
  const [schoolYear, setSchoolYear] = useState(String(initialConfig.schoolYear));
  const [logoUrl, setLogoUrl] = useState<string | null>(initialConfig.logoUrl);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleLogoSelect(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setFeedback(null);

    if (!(ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setFeedback({
        type: "error",
        message: "Formato não suportado. Envie uma imagem PNG, JPG ou WEBP.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_UPLOAD_BYTES) {
      setFeedback({
        type: "error",
        message: "A imagem excede o limite de 500KB. Reduza o tamanho e tente novamente.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setFeedback({
        type: "error",
        message: "Não foi possível ler o arquivo selecionado.",
      });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo(): void {
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFeedback(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFeedback(null);

    if (name.trim().length < 2) {
      setFeedback({
        type: "error",
        message: "Informe o nome da escola (mínimo 2 caracteres).",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/school-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          state,
          phone: phone.trim(),
          schoolYear: Number(schoolYear),
          logoUrl,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível salvar as configurações da escola.";
        try {
          const payload = (await response.json()) as Partial<ApiErrorPayload>;
          if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Mantem mensagem padrao.
        }
        setFeedback({ type: "error", message });
        return;
      }

      const payload = (await response.json()) as { config: SchoolConfigData };
      setName(payload.config.name);
      setCity(payload.config.city);
      setState(payload.config.state);
      setPhone(payload.config.phone);
      setSchoolYear(String(payload.config.schoolYear));
      setLogoUrl(payload.config.logoUrl);

      setFeedback({
        type: "success",
        message:
          "Identidade da escola atualizada com sucesso. O cabeçalho de login, o menu lateral e os boletins já exibem os novos dados.",
      });
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        message: "Falha de conexão com o servidor. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {feedback ? (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ring-1 ring-inset ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
              : "bg-red-50 text-red-800 ring-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
              strokeWidth={1.75}
            />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" strokeWidth={1.75} />
          )}
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Dados institucionais */}
        <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6">
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-200/80 pb-4">
            <Building2 className="h-5 w-5 text-[#1E40AF]" strokeWidth={1.75} aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Dados Institucionais da Escola
              </h2>
              <p className="text-xs text-slate-500">
                Exibidos no login, no menu lateral e no cabeçalho oficial do boletim em PDF.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="school-name"
                className="block text-sm font-medium text-slate-800"
              >
                Nome da Escola
              </label>
              <input
                id="school-name"
                type="text"
                required
                disabled={isSaving}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Colégio Estadual Machado de Assis"
                className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_0.7fr]">
              <div className="space-y-1.5">
                <label
                  htmlFor="school-city"
                  className="block text-sm font-medium text-slate-800"
                >
                  Cidade
                </label>
                <input
                  id="school-city"
                  type="text"
                  disabled={isSaving}
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ex: Curitiba"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="school-state"
                  className="block text-sm font-medium text-slate-800"
                >
                  Estado (UF)
                </label>
                <select
                  id="school-state"
                  disabled={isSaving}
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
                >
                  {BRAZILIAN_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="school-phone"
                  className="block text-sm font-medium text-slate-800"
                >
                  Telefone institucional
                </label>
                <input
                  id="school-phone"
                  type="tel"
                  disabled={isSaving}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(41) 3333-0000"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="school-year"
                  className="block text-sm font-medium text-slate-800"
                >
                  Ano Letivo
                </label>
                <input
                  id="school-year"
                  type="number"
                  min={2000}
                  max={2100}
                  required
                  disabled={isSaving}
                  value={schoolYear}
                  onChange={(event) => setSchoolYear(event.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 focus:outline-none disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Logo / Brasao da Escola */}
        <section className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6">
          <div>
            <div className="mb-5 border-b border-slate-200/80 pb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Logo / Brasão da Escola
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                PNG, JPG ou WEBP com tamanho máximo de 500KB.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center">
              {logoUrl ? (
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-xs ring-1 ring-slate-200">
                  <img
                    src={logoUrl}
                    alt={`Logo de ${name || "escola"}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1E40AF] text-white">
                  <BookOpenCheck className="h-9 w-9" strokeWidth={1.75} aria-hidden="true" />
                </div>
              )}

              <p className="mt-3 text-xs font-medium text-slate-700">
                {logoUrl ? "Pré-visualização do brasão" : "Nenhum logo personalizado enviado"}
              </p>

              <input
                ref={fileInputRef}
                id="school-logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={isSaving}
                onChange={handleLogoSelect}
                className="sr-only"
              />

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <label
                  htmlFor="school-logo-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-[#1E40AF]"
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>{logoUrl ? "Alterar imagem" : "Selecionar imagem"}</span>
                </label>

                {logoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={isSaving}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Remover logo</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200/80 pt-5">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#1E3A8A] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                  <span>Salvando Configurações...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  <span>Salvar Identidade da Escola</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
