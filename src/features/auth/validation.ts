import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Informe o e-mail institucional." })
    .trim()
    .toLowerCase()
    .email("Informe um endereço de e-mail válido."),
  password: z
    .string({ required_error: "Informe sua senha." })
    .min(1, "Informe sua senha.")
    .max(128, "Senha excede o limite permitido."),
});

export type ValidatedLoginInput = z.infer<typeof loginSchema>;
