"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleButtonProps {
  className?: string;
}

export function ThemeToggleButton({
  className = "",
}: ThemeToggleButtonProps): React.JSX.Element {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Modo Claro" : "Modo Escuro"}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/[0.09] dark:bg-[#1A1D21] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100 ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
