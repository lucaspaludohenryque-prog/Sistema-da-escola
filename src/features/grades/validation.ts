import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const termSchema = z.coerce
  .number({ invalid_type_error: "Trimestre inválido." })
  .int("Trimestre deve ser 1, 2 ou 3.")
  .refine(
    (value): value is 1 | 2 | 3 => value === 1 || value === 2 || value === 3,
    {
      message: "Selecione o 1º, 2º ou 3º trimestre.",
    }
  );

export const gradeQuerySchema = z.object({
  classroomId: z
    .string({ required_error: "Selecione uma turma." })
    .trim()
    .min(1, "Selecione uma turma."),
  term: termSchema,
});

export const createAssessmentSchema = z.object({
  classroomId: z
    .string({ required_error: "Selecione uma turma." })
    .trim()
    .min(1, "Selecione uma turma."),
  title: z
    .string({ required_error: "Informe o título da avaliação." })
    .trim()
    .min(2, "O título deve ter ao menos 2 caracteres.")
    .max(100, "O título excede o limite de 100 caracteres."),
  term: termSchema,
  maxScore: z.coerce
    .number({ invalid_type_error: "Informe um valor máximo válido." })
    .positive("O valor máximo deve ser maior que zero.")
    .max(100, "O valor máximo não pode exceder 100."),
  weight: z.coerce
    .number({ invalid_type_error: "Informe um peso válido." })
    .positive("O peso deve ser maior que zero.")
    .max(20, "O peso não pode exceder 20."),
  date: z
    .string({ required_error: "Informe a data da avaliação." })
    .trim()
    .regex(ISO_DATE_REGEX, "A data deve estar no formato AAAA-MM-DD."),
});

export const saveGradesBatchSchema = z.object({
  classroomId: z
    .string({ required_error: "Selecione uma turma." })
    .trim()
    .min(1, "Selecione uma turma."),
  term: termSchema,
  entries: z
    .array(
      z.object({
        assessmentId: z.string().trim().min(1, "Avaliação inválida."),
        studentId: z.string().trim().min(1, "Aluno inválido."),
        score: z
          .number({ invalid_type_error: "Nota deve ser um número válido." })
          .finite("Nota inválida.")
          .min(0, "Nenhuma nota pode ser negativa.")
          .nullable(),
      })
    )
    .max(2000, "Lote de notas excede o limite permitido."),
});

export const saveRecoveryBatchSchema = z.object({
  classroomId: z
    .string({ required_error: "Selecione uma turma." })
    .trim()
    .min(1, "Selecione uma turma."),
  term: termSchema,
  entries: z
    .array(
      z.object({
        studentId: z.string().trim().min(1, "Aluno inválido."),
        score: z
          .number({ invalid_type_error: "Nota de recuperação inválida." })
          .finite("Nota de recuperação inválida.")
          .min(0, "A nota de recuperação não pode ser negativa.")
          .max(10, "A nota de recuperação deve estar entre 0 e 10.")
          .nullable(),
      })
    )
    .max(500, "Lote de recuperação excede o limite permitido."),
});

export const toggleTermLockSchema = z.object({
  classroomId: z
    .string({ required_error: "Selecione uma turma." })
    .trim()
    .min(1, "Selecione uma turma."),
  term: termSchema,
  locked: z.boolean({ required_error: "Informe o estado de trancamento." }),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type SaveGradesBatchInput = z.infer<typeof saveGradesBatchSchema>;
export type SaveRecoveryBatchInput = z.infer<typeof saveRecoveryBatchSchema>;
export type ToggleTermLockInput = z.infer<typeof toggleTermLockSchema>;
