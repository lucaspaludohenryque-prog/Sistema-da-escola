"use client";
/* eslint-disable @next/next/no-img-element -- Pre-visualizacao de logo em Base64 data URL. */

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpenCheck,
  Building2,
  Check,
  FlaskConical,
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
  const [demoModeEnabled, setDemoModeEnabled] = useState<boolean>(
    initialConfig.demoModeEnabled
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
          demoModeEnabled,
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
      setDemoModeEnabled(payload.config.demoModeEnabled);

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
          <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 sm:p-6 dark:bg-[#131518] dark:ring-white/[0.08]">
            <div className="mb-5 flex items-center gap-2.5 border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
              <Building2
                className="h-5 w-5 text-[var(--school-primary)] dark:text-blue-400"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Dados Institucionais da Escola
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Exibidos no login, no menu lateral e no cabeçalho oficial do boletim em PDF.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="school-name"
                  className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
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
                  className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:disabled:bg-white/[0.03]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_0.7fr]">
                <div className="space-y-1.5">
                  <label
                    htmlFor="school-city"
                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
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
                    className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="school-state"
                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    Estado (UF)
                  </label>
                  <select
                    id="school-state"
                    disabled={isSaving}
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
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
                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
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
                    className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100 dark:placeholder:text-zinc-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="school-year"
                    className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
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
                    className="block w-full rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2.5 font-mono text-sm text-zinc-900 focus:border-[var(--school-primary)] focus:ring-2 focus:ring-[var(--school-primary-ring)] focus:outline-none disabled:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Cor Principal da Escola */}
          <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 sm:p-6 dark:bg-[#131518] dark:ring-white/[0.08]">
            <div className="mb-5 flex items-center gap-2.5 border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
              <Palette
                className="h-5 w-5 text-[var(--school-primary)] dark:text-blue-400"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Cor Principal da Escola
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                          ? "border-slate-900 bg-zinc-50 ring-2 ring-zinc-200/90 dark:border-white dark:bg-[#1A1D21] dark:ring-white/20"
                          : "border-zinc-200 bg-white hover:border-zinc-200/90 hover:bg-zinc-50/70 dark:border-white/[0.08] dark:bg-[#131518]/50 dark:hover:border-slate-700 dark:hover:bg-white/[0.04]"
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
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="school-primary-color"
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Cor personalizada:
                  </label>
                  <input
                    id="school-primary-color"
                    type="color"
                    disabled={isSaving}
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-zinc-200/90 bg-white p-0.5 dark:border-white/[0.1] dark:bg-[#131518]"
                  />
                  <span className="font-mono text-xs font-semibold text-zinc-700 uppercase dark:text-zinc-200">
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

          {/* Modo Demonstracao (Acesso Rapido no Login) */}
          <section className="rounded-xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 sm:p-6 dark:bg-[#131518] dark:ring-white/[0.08]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <FlaskConical
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--school-primary)] dark:text-blue-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Modo Demonstração (Acesso Rápido no Login)
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        demoModeEnabled
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400"
                      }`}
                    >
                      {demoModeEnabled ? "Ativo" : "Desativado"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Quando ativo, exibe botões de acesso de teste na tela de login para
                    apresentações. Desative ao colocar em uso oficial com dados reais da escola.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={demoModeEnabled}
                aria-label="Alternar Modo Demonstração no Login"
                disabled={isSaving}
                onClick={() => setDemoModeEnabled((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--school-primary-ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                  demoModeEnabled
                    ? "border-transparent bg-[var(--school-primary)]"
                    : "border-zinc-300 bg-zinc-200 dark:border-white/15 dark:bg-white/10"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition-transform duration-150 ${
                    demoModeEnabled ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </section>
        </div>

        {/* Logo / Brasao da Escola */}
        <section className="flex flex-col justify-between rounded-xl bg-white p-5 shadow-[var(--shadow-ambient)] ring-1 ring-zinc-200/80 sm:p-6 dark:bg-[#131518] dark:ring-white/[0.08]">
          <div>
            <div className="mb-5 border-b border-zinc-200/80 pb-4 dark:border-white/[0.08]">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Logo / Brasão da Escola
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                PNG, JPG ou WEBP com tamanho máximo de 500KB.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/70 px-4 py-6 text-center dark:border-white/[0.1] dark:bg-white/[0.02]">
              {logoUrl ? (
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-xs ring-1 ring-zinc-200">
                  <img
                    src={logoUrl}
                    alt={`Logo de ${name || "escola"}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <BookOpenCheck className="h-9 w-9" strokeWidth={1.75} aria-hidden="true" />
                </div>
              )}

              <p className="mt-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <span>{logoUrl ? "Alterar imagem" : "Selecionar imagem"}</span>
                </label>

                {logoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={isSaving}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:bg-[#131518] dark:text-red-300 dark:hover:bg-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    <span>Remover logo</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-zinc-200/80 pt-5 dark:border-white/[0.08]">
            <button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: primaryColor }}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[filter,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-70"
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
