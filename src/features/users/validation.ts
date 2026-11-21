import { z } from "zod";
import { USER_ROLES } from "@/features/auth/types";

export const createUserSchema = z.object({
  name: z
    .string({ required_error: "Informe o nome completo." })
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  email: z
    .string({ required_error: "Informe o e-mail institucional." })
    .trim()
    .toLowerCase()
    .email("Informe um endereço de e-mail válido."),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: "Selecione um perfil válido." }),
  }),
  password: z
    .string({ required_error: "Informe a senha inicial." })
    .min(6, "A senha deve ter no mínimo 6 caracteres.")
    .max(128, "A senha excede o limite permitido."),
  active: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  name: z
    .string({ required_error: "Informe o nome completo." })
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  email: z
    .string({ required_error: "Informe o e-mail institucional." })
    .trim()
    .toLowerCase()
    .email("Informe um endereço de e-mail válido."),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: "Selecione um perfil válido." }),
  }),
  active: z.boolean({ required_error: "Informe o status da conta." }),
  password: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine((value) => value === undefined || value.length >= 6, {
      message: "A nova senha deve ter no mínimo 6 caracteres.",
    })
    .refine((value) => value === undefined || value.length <= 128, {
      message: "A nova senha excede o limite permitido.",
    }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
