import { z } from "zod";

export const scanCheckInSchema = z.object({
  code: z
    .string({ required_error: "Informe o código QR ou a matrícula (CGM) do estudante." })
    .trim()
    .min(2, "Informe um código ou matrícula válida.")
    .max(120, "Código informado é muito longo."),
  mode: z.enum(["ENTRADA", "ATRASO", "SAIDA"]).default("ENTRADA"),
  notifyGuardian: z.boolean().optional().default(true),
  markAttendance: z.boolean().optional().default(false),
  lessonNumber: z.coerce
    .number()
    .int()
    .min(1)
    .max(10)
    .optional(),
  notes: z
    .string()
    .trim()
    .max(300, "A observação deve ter no máximo 300 caracteres.")
    .optional(),
});

export type ScanCheckInInput = z.infer<typeof scanCheckInSchema>;
