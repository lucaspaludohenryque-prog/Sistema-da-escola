import { z } from "zod";

export const createGuardianLinkSchema = z.object({
  kind: z.literal("GUARDIAN").optional().default("GUARDIAN"),
  guardianId: z
    .string({ required_error: "Selecione o responsável." })
    .trim()
    .min(1, "Selecione o responsável."),
  studentId: z
    .string({ required_error: "Selecione o aluno." })
    .trim()
    .min(1, "Selecione o aluno."),
  relationship: z
    .string()
    .trim()
    .min(2, "Informe o grau de parentesco.")
    .max(50, "Parentesco excede o limite permitido.")
    .optional()
    .default("Responsável"),
});

export const linkStudentAccountSchema = z.object({
  kind: z.literal("STUDENT_ACCOUNT"),
  userId: z
    .string({ required_error: "Selecione a conta do aluno." })
    .trim()
    .min(1, "Selecione a conta do aluno."),
  studentId: z
    .string({ required_error: "Selecione o aluno." })
    .trim()
    .min(1, "Selecione o aluno."),
});

export const createFamilyLinkSchema = z.union([
  linkStudentAccountSchema,
  createGuardianLinkSchema,
]);

export type CreateFamilyLinkInput = z.infer<typeof createFamilyLinkSchema>;
