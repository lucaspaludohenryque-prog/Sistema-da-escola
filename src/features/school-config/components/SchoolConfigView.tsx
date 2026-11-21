"use client";
/* eslint-disable @next/next/no-img-element -- Pre-visualizacao de logo em Base64 data URL. */

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpenCheck,
  Building2,
  Check,
  Loader2,
  Palette,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import type { ApiErrorPayload } from "@/features/classrooms/types";
import { useToast } from "@/shared/components/ToastProvider";
import {
  ALLOWED_LOGO_MIME_TYPES,
  BRAZILIAN_STATES,
  MAX_LOGO_UPLOAD_BYTES,
  SCHOOL_COLOR_PRESETS,
  normalizeHexColor,
} from "../constants";
import type { SchoolConfigData } from "../types";

interface SchoolConfigViewProps {
  initialConfig: SchoolConfigData;
}

export function SchoolConfigView({
  initialConfig,
}: SchoolConfigViewProps): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialConfig.name);
  const [city, setCity] = useState(initialConfig.city);
  const [state, setState] = useState(initialConfig.state || "PR");
  const [phone, setPhone] = useState(initialConfig.phone);
  const [schoolYear, setSchoolYear] = useState(String(initialConfig.schoolYear));
  const [logoUrl, setLogoUrl] = useState<string | null>(initialConfig.logoUrl);
  const [primaryColor, setPrimaryColor] = useState<string>(
    normalizeHexColor(initialConfig.primaryColor)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleLogoSelect(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    if (!(ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
      const msg = "Formato não suportado. Envie uma imagem PNG, JPG ou WEBP.";
      setErrorMessage(msg);
      toast.error(msg);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_UPLOAD_BYTES) {
      const msg =
        "A imagem excede o limite de 500KB. Reduza o tamanho e tente novamente.";
      setErrorMessage(msg);
      toast.error(msg);
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
      const msg = "Não foi possível ler o arquivo selecionado.";
      setErrorMessage(msg);
      toast.error(msg);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo(): void {
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    if (name.trim().length < 2) {
      const msg = "Informe o nome da escola (mínimo 2 caracteres).";
      setErrorMessage(msg);
      toast.warning(msg);
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
          primaryColor: normalizeHexColor(primaryColor),
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
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const payload = (await response.json()) as { config: SchoolConfigData };
      setName(payload.config.name);
      setCity(payload.config.city);
      setState(payload.config.state);
      setPhone(payload.config.phone);
      setSchoolYear(String(payload.config.schoolYear));
      setLogoUrl(payload.config.logoUrl);
      setPrimaryColor(normalizeHexColor(payload.config.primaryColor));

      toast.success(
        "Identidade e cor principal da escola atualizadas com sucesso.",
        "Configurações salvas"
      );
      router.refresh();
    } catch {
      const msg = "Falha de conexão com o servidor. Tente novamente.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" strokeWidth={1.75} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Dados institucionais */}
          <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <Building2
                className="h-5 w-5 text-[var(--school-primary)] dark:text-blue-400"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Dados Institucionais da Escola
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Exibidos no login, no menu lateral e no cabeçalho oficial do boletim em PDF.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="school-name"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200"
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
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:bg-slate-800/50"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_0.7fr]">
                <div className="space-y-1.5">
                  <label
                    htmlFor="school-city"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
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
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="school-state"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    Estado (UF)
                  </label>
                  <select
                    id="school-state"
                    disabled={isSaving}
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
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
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="school-year"
                    className="block text-sm font-medium text-slate-800 dark:text-slate-200"
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
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Cor Principal da Escola */}
          <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-5 flex items-center gap-2.5 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <Palette
                className="h-5 w-5 text-[var(--school-primary)] dark:text-blue-400"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Cor Principal da Escola
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aplicada dinamicamente nos botões principais, itens ativos do menu e destaques do
                  painel.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                {SCHOOL_COLOR_PRESETS.map((preset) => {
                  const isSelected =
                    primaryColor.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      disabled={isSaving}
                      onClick={() => setPrimaryColor(preset.hex)}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                        isSelected
                          ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 dark:border-white dark:bg-slate-800 dark:ring-white/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-xs ring-2 ring-white dark:ring-slate-900"
                        style={{ backgroundColor: preset.hex }}
                      >
                        {isSelected ? (
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        ) : null}
                      </span>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="school-primary-color"
                    className="text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Cor personalizada:
                  </label>
                  <input
                    id="school-primary-color"
                    type="color"
                    disabled={isSaving}
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <span className="font-mono text-xs font-semibold text-slate-700 uppercase dark:text-slate-200">
                    {primaryColor}
                  </span>
                </div>

                <span
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  Prévia do Botão
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Logo / Brasao da Escola */}
        <section className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-slate-900/[0.06] sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
          <div>
            <div className="mb-5 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Logo / Brasão da Escola
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                PNG, JPG ou WEBP com tamanho máximo de 500KB.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-800/40">
              {logoUrl ? (
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-xs ring-1 ring-slate-200">
                  <img
                    src={logoUrl}
                    alt={`Logo de ${name || "escola"}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <BookOpenCheck className="h-9 w-9" strokeWidth={1.75} aria-hidden="true" />
                </div>
              )}

              <p className="mt-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                {logoUrl
                  ? "Pré-visualização do brasão"
                  : "Nenhum logo personalizado enviado"}
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>{logoUrl ? "Alterar imagem" : "Selecionar imagem"}</span>
                </label>

                {logoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={isSaving}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Remover logo</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: primaryColor }}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[filter,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:brightness-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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
