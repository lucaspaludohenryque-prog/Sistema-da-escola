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
