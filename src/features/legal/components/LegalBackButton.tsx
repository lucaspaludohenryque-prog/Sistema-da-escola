"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function LegalBackButton(): React.JSX.Element {
  const router = useRouter();

  function handleBack(): void {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      <span>Voltar</span>
    </button>
  );
}
