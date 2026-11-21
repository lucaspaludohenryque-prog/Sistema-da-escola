"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  HelpCircle,
  Keyboard,
  Lightbulb,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type { UserRole } from "@/features/auth/types";
import {
  getDefaultAudienceForRole,
  getVisibleAudiencesForRole,
  HELP_AUDIENCES,
  HELP_FAQ_ITEMS,
  HELP_GUIDE_MODULES,
  HELP_QUICK_SHORTCUTS,
} from "../content";
import type { HelpAudienceId, HelpModuleLink } from "../types";

interface HelpCenterViewProps {
  userRole: UserRole;
  schoolName: string;
}

const CHECKLIST_STORAGE_PREFIX = "rco_help_checklist_";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function canRoleAccessLink(
  userRole: UserRole,
  allowedRoles?: readonly UserRole[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  return allowedRoles.includes(userRole);
}

function openGlobalSearchShortcut(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
  );
}

export function HelpCenterView({
  userRole,
  schoolName,
}: HelpCenterViewProps): React.JSX.Element {
  const visibleAudiences = useMemo(
    () => getVisibleAudiencesForRole(userRole),
    [userRole]
  );
  const defaultAudience = useMemo(
    () => getDefaultAudienceForRole(userRole),
    [userRole]
  );

  const [activeTab, setActiveTab] = useState<HelpAudienceId>(defaultAudience);
  const [searchQuery, setSearchQuery] = useState("");
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  const [completedChecklistIds, setCompletedChecklistIds] = useState<string[]>(
    []
  );
  const [openModuleIds, setOpenModuleIds] = useState<Record<string, boolean>>(
    () => {
      const firstModule = HELP_GUIDE_MODULES.find(
        (module) => module.audience === defaultAudience
      );
      return firstModule ? { [firstModule.id]: true } : {};
    }
  );
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({});

  // Carrega progresso do checklist salvo no localStorage por perfil/aba
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(
        `${CHECKLIST_STORAGE_PREFIX}${activeTab}`
      );
      if (!raw) {
        setCompletedChecklistIds([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setCompletedChecklistIds(
          parsed.filter((item): item is string => typeof item === "string")
        );
      } else {
        setCompletedChecklistIds([]);
      }
    } catch {
      setCompletedChecklistIds([]);
    }
  }, [activeTab]);

  function toggleChecklistStep(stepId: string): void {
    setCompletedChecklistIds((prev) => {
      const next = prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId];
      try {
        window.localStorage.setItem(
          `${CHECKLIST_STORAGE_PREFIX}${activeTab}`,
          JSON.stringify(next)
        );
      } catch {
        // Ignora erro caso localStorage esteja bloqueado.
      }
      return next;
    });
  }

  function resetChecklist(): void {
    setCompletedChecklistIds([]);
    try {
      window.localStorage.removeItem(`${CHECKLIST_STORAGE_PREFIX}${activeTab}`);
    } catch {
      // Ignora erro de persistencia.
    }
  }

  function handleSelectTab(tab: HelpAudienceId): void {
    setActiveTab(tab);
    const firstModule = HELP_GUIDE_MODULES.find(
      (module) => module.audience === tab
    );
    if (firstModule) {
      setOpenModuleIds((prev) => ({ ...prev, [firstModule.id]: true }));
    }
  }

  function toggleModule(moduleId: string): void {
    setOpenModuleIds((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  }

  function toggleFaq(faqId: string): void {
    setOpenFaqIds((prev) => ({
      ...prev,
      [faqId]: !prev[faqId],
    }));
  }

  const normalizedQuery = normalizeSearchText(searchQuery.trim());
  const isSearching = normalizedQuery.length > 0;

  const currentAudienceDef = HELP_AUDIENCES[activeTab];
  const completedCount = currentAudienceDef.checklist.filter((step) =>
    completedChecklistIds.includes(step.id)
  ).length;
  const totalChecklist = currentAudienceDef.checklist.length;
  const checklistPercent =
    totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

  const filteredModules = useMemo(() => {
    const allowedSet = new Set<HelpAudienceId>(visibleAudiences);
    const baseModules = isSearching
      ? HELP_GUIDE_MODULES.filter((module) => allowedSet.has(module.audience))
      : HELP_GUIDE_MODULES.filter((module) => module.audience === activeTab);

    if (!isSearching) {
      return baseModules;
    }

    return baseModules.filter((module) => {
      const searchable = normalizeSearchText(
        [
          module.title,
          module.summary,
          module.tip,
          ...module.steps,
          ...module.keywords,
          HELP_AUDIENCES[module.audience].tabLabel,
        ].join(" ")
      );
      return searchable.includes(normalizedQuery);
    });
  }, [activeTab, isSearching, normalizedQuery, visibleAudiences]);

  const filteredFaqs = useMemo(() => {
    const allowedSet = new Set<HelpAudienceId>(visibleAudiences);
    const visibleFaqs = HELP_FAQ_ITEMS.filter((faq) =>
      faq.audiences.some((audience) => allowedSet.has(audience))
    );

    if (!isSearching) {
      return visibleFaqs;
    }

    return visibleFaqs.filter((faq) => {
      const searchable = normalizeSearchText(
        [faq.question, faq.answer, ...faq.keywords].join(" ")
      );
      return searchable.includes(normalizedQuery);
    });
  }, [isSearching, normalizedQuery, visibleAudiences]);

  function renderModuleLink(link: HelpModuleLink): React.JSX.Element {
    const accessible = canRoleAccessLink(userRole, link.allowedRoles);
    if (!accessible) {
      return (
        <span
          key={`${link.href}-${link.label}`}
          title="Rota disponível apenas para o perfil correspondente"
          className="inline-flex h-8 items-center rounded-lg border border-zinc-200/80 bg-zinc-50 px-3 text-xs font-medium text-zinc-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-500"
        >
          {link.label} (perfil específico)
        </span>
      );
    }

    return (
      <Link
        key={`${link.href}-${link.label}`}
        href={link.href}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
      >
        <span>{link.label}</span>
        <ArrowRight className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Cabecalho editorial da pagina */}
      <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.08]">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Central de Ajuda e Tutorial Interativo
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Guias passo a passo, checklist de primeiros passos e respostas rápidas do portal {schoolName}.
          </p>
        </div>

        <button
          type="button"
          onClick={openGlobalSearchShortcut}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 self-start rounded-lg border border-zinc-200/90 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 sm:self-auto dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-300 dark:hover:bg-[#1A1D21]"
        >
          <Keyboard className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} aria-hidden="true" />
          <span>Testar busca rápida</span>
          <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-400">
            Ctrl K
          </kbd>
        </button>
      </header>

      {/* Busca instantanea + Abas de perfil */}
      <section className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Pesquisar em tutoriais e perguntas (ex.: chamada, whatsapp, qr code, trancar, justificar)..."
            aria-label="Pesquisar na Central de Ajuda"
            className="h-11 w-full rounded-xl border border-zinc-200/90 bg-white pr-10 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-white/25"
          />
          {isSearching ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpar pesquisa"
              className="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>

        {visibleAudiences.length > 1 && !isSearching ? (
          <div
            role="tablist"
            aria-label="Guias por perfil"
            className="flex flex-wrap items-center gap-1.5"
          >
            {visibleAudiences.map((audienceId) => {
              const audience = HELP_AUDIENCES[audienceId];
              const isSelected = activeTab === audienceId;
              return (
                <button
                  key={audienceId}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectTab(audienceId)}
                  className={`inline-flex h-9 cursor-pointer items-center rounded-lg px-3.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-200/90 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-300 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-100"
                  }`}
                >
                  {audience.tabLabel}
                </button>
              );
            })}
          </div>
        ) : null}

        {isSearching ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <p className="tabular-nums">
              Encontrado(s){" "}
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                {filteredModules.length}
              </strong>{" "}
              guia(s) e{" "}
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                {filteredFaqs.length}
              </strong>{" "}
              pergunta(s) frequente(s) para &ldquo;{searchQuery.trim()}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="cursor-pointer font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Limpar filtro
            </button>
          </div>
        ) : null}
      </section>

      {/* Checklist Interativo "Primeiros Passos" (recolhivel e salvo no localStorage) */}
      {!isSearching ? (
        <section
          aria-labelledby="checklist-heading"
          className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white dark:border-white/[0.08] dark:bg-[#131518]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <button
              type="button"
              onClick={() => setIsChecklistOpen((prev) => !prev)}
              aria-expanded={isChecklistOpen}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
            >
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
                  isChecklistOpen ? "" : "-rotate-90"
                }`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h2
                  id="checklist-heading"
                  className="text-sm font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100"
                >
                  Primeiros passos · {currentAudienceDef.tabLabel}
                </h2>
                <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                  {completedCount} de {totalChecklist} concluídos ({checklistPercent}%)
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <div
                className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-zinc-200/80 sm:block dark:bg-white/[0.08]"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-[var(--school-primary)] transition-[width] duration-200"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              {completedCount > 0 ? (
                <button
                  type="button"
                  onClick={resetChecklist}
                  title="Reiniciar checklist"
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-[#1A1D21] dark:hover:text-zinc-200"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                  <span>Reiniciar</span>
                </button>
              ) : null}
            </div>
          </div>

          {isChecklistOpen ? (
            <div className="border-t border-zinc-200/80 dark:border-white/[0.08]">
              <ul className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
                {currentAudienceDef.checklist.map((step, index) => {
                  const isDone = completedChecklistIds.includes(step.id);
                  const canOpen = step.href
                    ? canRoleAccessLink(userRole, step.allowedRoles)
                    : false;

                  return (
                    <li
                      key={step.id}
                      className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <button
                        type="button"
                        onClick={() => toggleChecklistStep(step.id)}
                        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                            isDone
                              ? "border-[var(--school-primary)] bg-[var(--school-primary)] text-white"
                              : "border-zinc-300 bg-white dark:border-white/20 dark:bg-[#1A1D21]"
                          }`}
                        >
                          {isDone ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={`block text-xs font-medium ${
                              isDone
                                ? "text-zinc-400 line-through dark:text-zinc-500"
                                : "text-zinc-900 dark:text-zinc-100"
                            }`}
                          >
                            {index + 1}. {step.label}
                          </span>
                          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                            {step.description}
                          </span>
                        </span>
                      </button>

                      <div className="pl-7 sm:shrink-0 sm:pl-0">
                        {step.triggerCommandPalette ? (
                          <button
                            type="button"
                            onClick={openGlobalSearchShortcut}
                            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-zinc-200/90 bg-zinc-50 px-2.5 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                          >
                            <span>Abrir busca</span>
                            <ArrowRight className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        ) : step.href && canOpen ? (
                          <Link
                            href={step.href}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200/90 bg-zinc-50 px-2.5 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
                          >
                            <span>Abrir tela</span>
                            <ArrowRight className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Guias Passo a Passo */}
      <section aria-labelledby="guides-heading" className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="guides-heading"
              className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100"
            >
              {isSearching
                ? "Tutoriais encontrados"
                : currentAudienceDef.heading}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isSearching
                ? "Clique em qualquer módulo para abrir o passo a passo completo."
                : currentAudienceDef.description}
            </p>
          </div>
        </div>

        {filteredModules.length === 0 ? (
          <div className="rounded-xl border border-zinc-200/90 bg-white px-6 py-10 text-center dark:border-white/[0.08] dark:bg-[#131518]">
            <HelpCircle
              className="mx-auto h-6 w-6 text-zinc-400 dark:text-zinc-500"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <p className="mt-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Nenhum tutorial encontrado para &ldquo;{searchQuery.trim()}&rdquo;
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Tente termos mais curtos como &ldquo;chamada&rdquo;, &ldquo;notas&rdquo;, &ldquo;whatsapp&rdquo;, &ldquo;qr code&rdquo; ou &ldquo;justificar&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredModules.map((module) => {
              const isOpen = isSearching || Boolean(openModuleIds[module.id]);

              return (
                <article
                  key={module.id}
                  className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white dark:border-white/[0.08] dark:bg-[#131518]"
                >
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 font-mono text-[11px] font-semibold text-zinc-600 tabular-nums dark:bg-white/[0.06] dark:text-zinc-300">
                        {module.index}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
                            {module.title}
                          </h3>
                          {isSearching ? (
                            <span className="inline-flex rounded border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400">
                              {HELP_AUDIENCES[module.audience].shortLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {module.summary}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      className={`mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen ? (
                    <div className="space-y-4 border-t border-zinc-200/80 px-5 py-4 dark:border-white/[0.08]">
                      <ol className="space-y-2.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {module.steps.map((stepText, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 font-mono text-[11px] font-medium text-zinc-600 tabular-nums dark:border-white/10 dark:bg-[#1A1D21] dark:text-zinc-400">
                              {idx + 1}
                            </span>
                            <span className="text-[13px]">{stepText}</span>
                          </li>
                        ))}
                      </ol>

                      <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-3.5 py-3 text-xs leading-relaxed text-zinc-600 dark:border-white/[0.08] dark:bg-[#1A1D21]/60 dark:text-zinc-300">
                        <Lightbulb
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--school-primary)]"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <p>
                          <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                            Dica prática:
                          </strong>{" "}
                          {module.tip}
                        </p>
                      </div>

                      {module.links.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {module.links.map((link) => renderModuleLink(link))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Perguntas Frequentes (FAQ) */}
      <section aria-labelledby="faq-heading" className="space-y-3 pt-2">
        <div>
          <h2
            id="faq-heading"
            className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100"
          >
            Perguntas Frequentes (FAQ)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Respostas diretas para as dúvidas mais comuns na rotina da escola.
          </p>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="rounded-xl border border-zinc-200/90 bg-white px-5 py-6 text-center text-xs text-zinc-500 dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-400">
            Nenhuma pergunta frequente corresponde à sua busca.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white divide-y divide-zinc-200/80 dark:divide-white/[0.08] dark:border-white/[0.08] dark:bg-[#131518]">
            {filteredFaqs.map((faq) => {
              const isFaqOpen = isSearching || Boolean(openFaqIds[faq.id]);

              return (
                <div key={faq.id}>
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isFaqOpen}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]"
                  >
                    <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
                        isFaqOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>

                  {isFaqOpen ? (
                    <div className="space-y-3 border-t border-zinc-100 bg-zinc-50/50 px-5 py-3.5 text-xs leading-relaxed text-zinc-600 dark:border-white/[0.05] dark:bg-white/[0.015] dark:text-zinc-300">
                      <p>{faq.answer}</p>
                      {faq.relatedLink ? (
                        <div>{renderModuleLink(faq.relatedLink)}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tabela de Atalhos e Recursos Rapidos */}
      {!isSearching ? (
        <section aria-labelledby="shortcuts-heading" className="space-y-3 pt-2">
          <div>
            <h2
              id="shortcuts-heading"
              className="text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100"
            >
              Atalhos e Recursos Rápidos
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Recursos de produtividade disponíveis em todo o sistema.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200/90 bg-white dark:border-white/[0.08] dark:bg-[#131518]">
            <table className="w-full min-w-[480px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50 text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400">
                  <th className="px-4 py-2.5">Atalho / Controle</th>
                  <th className="px-4 py-2.5">Recurso</th>
                  <th className="px-4 py-2.5">O que faz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
                {HELP_QUICK_SHORTCUTS.map((item) => (
                  <tr key={item.resource}>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <kbd className="rounded border border-zinc-200/90 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-700 dark:border-white/[0.08] dark:bg-[#1A1D21] dark:text-zinc-200">
                        {item.shortcut}
                      </kbd>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {item.resource}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Rodape discreto com links legais LGPD */}
      <footer className="flex flex-col items-start justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-5 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center dark:border-white/[0.08] dark:bg-[#131518] dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Conformidade institucional e proteção de dados (LGPD)</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-medium">
          <Link
            href="/termos"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Termos de Uso
          </Link>
          <Link
            href="/privacidade"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Privacidade (LGPD)
          </Link>
          <Link
            href="/cookies"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Política de Cookies
          </Link>
        </div>
      </footer>
    </div>
  );
}
