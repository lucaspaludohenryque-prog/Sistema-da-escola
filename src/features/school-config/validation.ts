import { z } from "zod";
import {
  BRAZILIAN_STATES,
  DEFAULT_SCHOOL_PRIMARY_COLOR,
  HEX_COLOR_REGEX,
  MAX_LOGO_BASE64_LENGTH,
} from "./constants";

const DATA_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i;
const HTTP_URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

function isValidLogoUrl(value: string): boolean {
  if (value.length > MAX_LOGO_BASE64_LENGTH) {
    return false;
  }
  return DATA_IMAGE_REGEX.test(value) || HTTP_URL_REGEX.test(value);
}

export const updateSchoolConfigSchema = z.object({
  name: z
    .string({ required_error: "Informe o nome da escola." })
    .trim()
    .min(2, "O nome da escola deve ter ao menos 2 caracteres.")
    .max(120, "O nome da escola deve ter no máximo 120 caracteres."),
  city: z
    .string()
    .trim()
    .max(80, "A cidade deve ter no máximo 80 caracteres.")
    .optional()
    .default(""),
  state: z
    .string({ required_error: "Selecione a UF." })
    .trim()
    .toUpperCase()
    .refine(
      (value) => (BRAZILIAN_STATES as readonly string[]).includes(value),
      "Selecione uma UF brasileira válida."
    ),
  phone: z
    .string()
    .trim()
    .max(30, "O telefone deve ter no máximo 30 caracteres.")
    .optional()
    .default(""),
  schoolYear: z.coerce
    .number({ invalid_type_error: "Informe um ano letivo válido." })
    .int("O ano letivo deve ser um número inteiro.")
    .min(2000, "Ano letivo inválido.")
    .max(2100, "Ano letivo inválido."),
  logoUrl: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || isValidLogoUrl(value), {
      message:
        "Logo inválido ou acima do limite de 1MB. Use uma imagem PNG, JPG ou WEBP.",
    }),
  primaryColor: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .default(DEFAULT_SCHOOL_PRIMARY_COLOR)
    .refine((value) => HEX_COLOR_REGEX.test(value), {
      message: "Selecione uma cor principal válida no formato hexadecimal (#RRGGBB).",
    }),
});

export type UpdateSchoolConfigInput = z.infer<typeof updateSchoolConfigSchema>;
