import { z } from "zod";
import { ATTENDANCE_STATUSES } from "./types";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const isoDateSchema = z
  .string({ required_error: "Informe a data da aula." })
  .trim()
  .regex(ISO_DATE_REGEX, "A data deve estar no formato AAAA-MM-DD.");

export const attendanceQuerySchema = z.object({
  classroomId: z
    .string({ required_error: "Selecione uma turma." })
    .trim()
    .min(1, "Selecione uma turma."),
  date: isoDateSchema,
  lessonNumber: z.coerce
    .number({ invalid_type_error: "Número da aula inválido." })
    .int("O número da aula deve ser inteiro.")
    .min(1, "O número da aula deve ser entre 1 e 6.")
    .max(6, "O número da aula deve ser entre 1 e 6."),
});

export const saveAttendanceSchema = z.object({
  classroomId: z
    .string({ required_error: "Selecione uma turma." })
    .trim()
    .min(1, "Selecione uma turma."),
  date: isoDateSchema,
  lessonNumber: z.coerce
    .number({ invalid_type_error: "Número da aula inválido." })
    .int("O número da aula deve ser inteiro.")
    .min(1, "O número da aula deve ser entre 1 e 6.")
    .max(6, "O número da aula deve ser entre 1 e 6."),
  content: z
    .string({ required_error: "Informe o conteúdo ministrado na aula." })
    .trim()
    .min(3, "O conteúdo ministrado deve ter ao menos 3 caracteres.")
    .max(2000, "O conteúdo ministrado excede o limite permitido."),
  observations: z
    .string()
    .trim()
    .max(1000, "As observações excedem o limite permitido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  records: z
    .array(
      z.object({
        studentId: z.string().trim().min(1, "Identificador de aluno inválido."),
        status: z.enum(ATTENDANCE_STATUSES),
      })
    )
    .max(200, "Número máximo de alunos excedido."),
});

export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
export type SaveAttendanceInput = z.infer<typeof saveAttendanceSchema>;
