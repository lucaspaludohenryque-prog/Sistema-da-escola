import { z } from "zod";
import {
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_STATUSES,
  OCCURRENCE_TYPES,
} from "./types";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const createOccurrenceSchema = z.object({
  classroomId: z
    .string({ required_error: "Selecione a turma." })
    .trim()
    .min(1, "Selecione a turma."),
  studentId: z
    .string({ required_error: "Selecione o aluno." })
    .trim()
    .min(1, "Selecione o aluno."),
  type: z.enum(OCCURRENCE_TYPES, {
    errorMap: () => ({ message: "Selecione o tipo da ocorrência." }),
  }),
  severity: z.enum(OCCURRENCE_SEVERITIES, {
    errorMap: () => ({ message: "Selecione a gravidade." }),
  }),
  date: z
    .string({ required_error: "Informe a data da ocorrência." })
    .trim()
    .regex(ISO_DATE_REGEX, "A data deve estar no formato AAAA-MM-DD."),
  description: z
    .string({ required_error: "Descreva a ocorrência." })
    .trim()
    .min(5, "A descrição deve ter ao menos 5 caracteres.")
    .max(2000, "A descrição excede o limite permitido."),
});

export const updateOccurrenceSchema = z.object({
  status: z.enum(OCCURRENCE_STATUSES, {
    errorMap: () => ({ message: "Status inválido." }),
  }),
  resolutionNote: z
    .string()
    .trim()
    .max(1500, "O encaminhamento excede o limite permitido.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type CreateOccurrenceInput = z.infer<typeof createOccurrenceSchema>;
export type UpdateOccurrenceInput = z.infer<typeof updateOccurrenceSchema>;
