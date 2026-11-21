export const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

/** Limite de upload no navegador: 500 KB. */
export const MAX_LOGO_UPLOAD_BYTES = 500 * 1024;

/** Limite maximo de payload na API (~1 MB em Base64). */
export const MAX_LOGO_BASE64_LENGTH = 1_400_000;

export const ALLOWED_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const DEFAULT_SCHOOL_PRIMARY_COLOR = "#1d4ed8";

export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export interface SchoolColorPreset {
  name: string;
  hex: string;
}

export const SCHOOL_COLOR_PRESETS: readonly SchoolColorPreset[] = [
  { name: "Azul La Salle", hex: "#1d4ed8" },
  { name: "Esmeralda", hex: "#047857" },
  { name: "Vinho", hex: "#9f1239" },
  { name: "Índigo", hex: "#4338ca" },
  { name: "Grafite", hex: "#334155" },
] as const;

export function normalizeHexColor(value?: string | null): string {
  if (!value) {
    return DEFAULT_SCHOOL_PRIMARY_COLOR;
  }
  const trimmed = value.trim().toLowerCase();
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed : DEFAULT_SCHOOL_PRIMARY_COLOR;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = normalizeHexColor(hex).slice(1);
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

export function darkenHexColor(hex: string, factor = 0.18): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel * (1 - factor))));
  const toHex = (channel: number) => clamp(channel).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildSchoolThemeStyle(
  primaryColor?: string | null
): Record<string, string> {
  const primary = normalizeHexColor(primaryColor);
  return {
    "--school-primary": primary,
    "--school-primary-hover": darkenHexColor(primary, 0.18),
    "--school-primary-soft": hexToRgba(primary, 0.12),
    "--school-primary-soft-border": hexToRgba(primary, 0.28),
    "--school-primary-ring": hexToRgba(primary, 0.24),
  };
}
