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
  "bg-blue-100 text-blue-800 ring-blue-200/80 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-400/30",
  "bg-emerald-100 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-400/30",
  "bg-indigo-100 text-indigo-800 ring-indigo-200/80 dark:bg-indigo-500/20 dark:text-indigo-200 dark:ring-indigo-400/30",
  "bg-amber-100 text-amber-900 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-400/30",
  "bg-rose-100 text-rose-800 ring-rose-200/80 dark:bg-rose-500/20 dark:text-rose-200 dark:ring-rose-400/30",
  "bg-teal-100 text-teal-800 ring-teal-200/80 dark:bg-teal-500/20 dark:text-teal-200 dark:ring-teal-400/30",
  "bg-sky-100 text-sky-800 ring-sky-200/80 dark:bg-sky-500/20 dark:text-sky-200 dark:ring-sky-400/30",
  "bg-slate-200 text-slate-800 ring-slate-300/80 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600",
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
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ring-slate-200 dark:ring-slate-700 ${sizeClass} ${className}`}
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
