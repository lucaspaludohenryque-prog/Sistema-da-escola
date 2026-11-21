"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  Bell,
  BookMarked,
  BookOpen,
  BookOpenText,
  CalendarDays,
  ClipboardCheck,
  Clock,
  FileCheck2,
  FileWarning,
  GraduationCap,
  LayoutGrid,
  Megaphone,
  Radar,
  ScrollText,
  Search,
  Users,
  X,
} from "lucide-react";
import type {
  GlobalSearchCategory,
  GlobalSearchResponse,
  GlobalSearchResultItem,
} from "@/app/api/search/route";
import type { UserRole } from "@/features/auth/types";
import { Avatar } from "@/shared/components/Avatar";
import { Skeleton } from "@/shared/components/Skeleton";

interface CommandPaletteProps {
  isOpen: boolean;
  userRole: UserRole;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<GlobalSearchCategory, string> = {
  STUDENT: "Estudantes",
  CLASSROOM: "Turmas",
  OCCURRENCE: "Ocorrências",
  NOTIFICATION: "Avisos",
};

interface QuickShortcut {
  label: string;
  description: string;
  href: string;
  icon: typeof Users;
}

function getQuickShortcuts(role: UserRole): QuickShortcut[] {
  if (role === "RESPONSAVEL") {
    return [
      {
        label: "Painel da Família",
        description: "Notas, frequência e boletim dos estudantes",
        href: "/dashboard/familia",
        icon: GraduationCap,
      },
      {
        label: "Grade de Horários",
        description: "Horários semanais das aulas",
        href: "/dashboard/horarios",
        icon: Clock,
      },
      {
        label: "Calendário Escolar",
        description: "Provas, trabalhos e eventos do mês",
        href: "/dashboard/calendario",
        icon: CalendarDays,
      },
      {
        label: "Tarefas & Materiais",
        description: "Prazos, entregas e materiais de apoio",
        href: "/dashboard/tarefas",
        icon: BookOpenText,
      },
      {
        label: "Mural de Comunicados",
        description: "Avisos oficiais da escola e das turmas",
        href: "/dashboard/comunicados",
        icon: Megaphone,
      },
      {
        label: "Central de Avisos",
        description: "Confirmar ciência de faltas e ocorrências",
        href: "/dashboard/avisos",
        icon: Bell,
      },
    ];
  }

  if (role === "ALUNO") {
    return [
      {
        label: "Meu Painel",
        description: "Consultar boletim, média e frequência",
        href: "/dashboard/aluno",
        icon: GraduationCap,
      },
      {
        label: "Tarefas & Materiais",
        description: "Prazos, entregas e materiais de apoio",
        href: "/dashboard/tarefas",
        icon: BookOpenText,
      },
      {
        label: "Mural de Comunicados",
        description: "Avisos oficiais da escola e das turmas",
        href: "/dashboard/comunicados",
        icon: Megaphone,
      },
      {
        label: "Grade de Horários",
        description: "Aulas da semana e salas",
        href: "/dashboard/horarios",
        icon: Clock,
      },
      {
        label: "Calendário Escolar",
        description: "Provas, trabalhos e eventos",
        href: "/dashboard/calendario",
        icon: CalendarDays,
      },
      {
        label: "Meus Avisos",
        description: "Comunicados e notificações escolares",
        href: "/dashboard/avisos",
        icon: Bell,
      },
    ];
  }

  const staffShortcuts: QuickShortcut[] = [
    {
      label: "Fazer Chamada",
      description: "Registrar frequência e diário de conteúdo",
      href: "/dashboard/chamada",
      icon: ClipboardCheck,
    },
    {
      label: "Radar Pedagógico",
      description: "Análise de risco de evasão, notas e ocorrências",
      href: "/dashboard/radar",
      icon: Radar,
    },
    {
      label: "Mérito & Medalhas",
      description: "Conceder medalhas e ver sugestões automáticas",
      href: "/dashboard/merito",
      icon: Award,
    },
    {
      label: "Mapa de Sala",
      description: "Espelho de classe interativo e chamada visual",
      href: "/dashboard/mapa-sala",
      icon: LayoutGrid,
    },
    {
      label: "Tarefas & Materiais",
      description: "Mural de atividades, anexos e controle de entregas",
      href: "/dashboard/tarefas",
      icon: BookOpenText,
    },
    {
      label: "Mural de Comunicados",
      description: "Publicar e acompanhar comunicados oficiais",
      href: "/dashboard/comunicados",
      icon: Megaphone,
    },
    ...(role === "ADMIN" || role === "COORDENACAO"
      ? [
          {
            label: "Justificativas de Falta",
            description: "Analisar pedidos de abono enviados pelas famílias",
            href: "/dashboard/justificativas",
            icon: FileCheck2,
          },
        ]
      : []),
    {
      label: "Grade de Horários",
      description: "Horários semanais e acesso rápido à chamada",
      href: "/dashboard/horarios",
      icon: Clock,
    },
    {
      label: "Calendário Escolar",
      description: "Provas, reuniões, feriados e eventos",
      href: "/dashboard/calendario",
      icon: CalendarDays,
    },
    {
      label: "Planejamento de Aulas",
      description: "Plano de ensino e tópicos ministrados",
      href: "/dashboard/planejamento",
      icon: BookMarked,
    },
    {
      label: "Lançar Notas & Recuperação",
      description: "Avaliações, recuperação paralela e fechamento",
      href: "/dashboard/notas",
      icon: GraduationCap,
    },
    {
      label: "Conselho de Classe",
      description: "Resumo de turma e ata imprimível em PDF",
      href: "/dashboard/conselho",
      icon: ScrollText,
    },
    {
      label: "Ocorrências",
      description: "Registros disciplinares, pedagógicos e elogios",
      href: "/dashboard/ocorrencias",
      icon: FileWarning,
    },
    {
      label: "Turmas e Alunos",
      description: "Acessar listagem completa de turmas",
      href: "/dashboard/turmas",
      icon: Users,
    },
  ];

  return staffShortcuts;
}

export function CommandPalette({
  isOpen,
  userRole,
  onClose,
}: CommandPaletteProps): React.JSX.Element | null {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const shortcuts = useMemo(() => getQuickShortcuts(userRole), [userRole]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setQuery("");
    setResults([]);
    setActiveIndex(0);

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setActiveIndex(0);
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { cache: "no-store" }
        );
        if (response.ok && !isCancelled) {
          const payload = (await response.json()) as GlobalSearchResponse;
          setResults(payload.results);
          setActiveIndex(0);
        }
      } catch {
        if (!isCancelled) {
          setResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, query]);

  const navigableItems = useMemo(() => {
    if (query.trim().length < 2) {
      return shortcuts.map((shortcut) => ({
        id: shortcut.href,
        href: shortcut.href,
      }));
    }
    return results.map((item) => ({
      id: item.id,
      href: item.href,
    }));
  }, [query, results, shortcuts]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (navigableItems.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % navigableItems.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(
          (prev) => (prev - 1 + navigableItems.length) % navigableItems.length
        );
      } else if (event.key === "Enter") {
        const target = navigableItems[activeIndex];
        if (target) {
          event.preventDefault();
          onClose();
          router.push(target.href);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, navigableItems, activeIndex, onClose, router]);

  if (!isOpen) {
    return null;
  }

  function navigateTo(href: string): void {
    onClose();
    router.push(href);
  }

  const trimmedQuery = query.trim();
  const isSearchMode = trimmedQuery.length >= 2;

  const groupedResults: Array<{
    category: GlobalSearchCategory;
    items: Array<{ item: GlobalSearchResultItem; flatIndex: number }>;
  }> = [];

  if (isSearchMode) {
    const map = new Map<
      GlobalSearchCategory,
      Array<{ item: GlobalSearchResultItem; flatIndex: number }>
    >();
    results.forEach((item, flatIndex) => {
      const list = map.get(item.category) ?? [];
      list.push({ item, flatIndex });
      map.set(item.category, list);
    });
    for (const [category, items] of map.entries()) {
      groupedResults.push({ category, items });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Busca rápida global"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-slate-900">
        {/* Campo de busca */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
          <Search
            className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              userRole === "RESPONSAVEL" || userRole === "ALUNO"
                ? "Buscar em avisos, ocorrências ou estudante..."
                : "Buscar aluno, matrícula, turma ou ocorrência..."
            }
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="hidden shrink-0 cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-500 hover:bg-slate-100 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Corpo de resultados */}
        <div className="max-h-[60dvh] overflow-y-auto p-2.5">
          {!isSearchMode ? (
            <div className="space-y-1">
              <p className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Atalhos rápidos
              </p>
              {shortcuts.map((shortcut, index) => {
                const Icon = shortcut.icon;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={shortcut.href}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigateTo(shortcut.href)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: "var(--school-primary-soft)",
                        color: "var(--school-primary)",
                      }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {shortcut.label}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {shortcut.description}
                      </p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-slate-400"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          ) : isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-44" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          ) : groupedResults.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Nenhum resultado para &ldquo;{trimmedQuery}&rdquo;
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Tente buscar por outro nome, matrícula, disciplina ou palavra-chave.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedResults.map((group) => (
                <div key={group.category} className="space-y-1">
                  <p className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    {CATEGORY_LABELS[group.category]}
                  </p>
                  {group.items.map(({ item, flatIndex }) => {
                    const isActive = flatIndex === activeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={() => navigateTo(item.href)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          isActive
                            ? "bg-slate-100 dark:bg-slate-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {item.category === "STUDENT" ? (
                          <Avatar name={item.title} size="sm" />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.category === "CLASSROOM" ? (
                              <BookOpen className="h-4 w-4" strokeWidth={1.75} />
                            ) : item.category === "NOTIFICATION" ? (
                              <Bell className="h-4 w-4" strokeWidth={1.75} />
                            ) : (
                              <FileWarning className="h-4 w-4" strokeWidth={1.75} />
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item.title}
                            </p>
                            {item.meta ? (
                              <span className="shrink-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {item.meta}
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodape com dicas de teclado */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
          <span>Digite ao menos 2 caracteres para pesquisar</span>
          <span className="hidden items-center gap-2 sm:inline-flex">
            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-800">
              ↑↓
            </kbd>
            <span>navegar</span>
            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-slate-700 dark:bg-slate-800">
              Enter
            </kbd>
            <span>abrir</span>
          </span>
        </div>
      </div>
    </div>
  );
}
