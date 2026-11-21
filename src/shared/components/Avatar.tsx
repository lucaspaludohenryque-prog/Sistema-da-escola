/* eslint-disable @next/next/no-img-element -- Permite avatar opcional via URL ou Base64. */

export type AvatarSize = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

const PALETTES = [
  "bg-blue-50 text-blue-700 ring-blue-200/70 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20",
  "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20",
  "bg-indigo-50 text-indigo-700 ring-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/20",
  "bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20",
  "bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20",
  "bg-teal-50 text-teal-700 ring-teal-200/70 dark:bg-teal-500/15 dark:text-teal-200 dark:ring-teal-400/20",
  "bg-sky-50 text-sky-700 ring-sky-200/70 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/20",
  "bg-zinc-100 text-zinc-700 ring-zinc-200/80 dark:bg-white/[0.08] dark:text-zinc-200 dark:ring-white/[0.12]",
] as const;

function extractInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0 && !/^(de|da|do|dos|das|e|prof\.?)$/i.test(part));

  const first = parts[0];
  if (!first) {
    return name.trim().slice(0, 2).toUpperCase() || "?";
  }

  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }

  const last = parts[parts.length - 1] ?? first;
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function hashName(name: string): number {
  let hash = 0;
  const normalized = name.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function Avatar({
  name,
  imageUrl,
  size = "sm",
  className = "",
}: AvatarProps): React.JSX.Element {
  const sizeClass = SIZE_CLASSES[size];

  if (imageUrl) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ring-zinc-200/80 dark:ring-white/10 ${sizeClass} ${className}`}
      >
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  const initials = extractInitials(name);
  const paletteClass = PALETTES[hashName(name) % PALETTES.length];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight ring-1 ring-inset select-none ${sizeClass} ${paletteClass} ${className}`}
    >
      {initials}
    </span>
  );
}
