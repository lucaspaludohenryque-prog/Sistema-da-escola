import { z } from "zod";
import { CLASSROOM_SHIFTS } from "./types";

export const createClassroomSchema = z.object({
  name: z
    .string({ required_error: "Informe o nome da turma." })
    .trim()
    .min(2, "O nome da turma deve ter ao menos 2 caracteres.")
    .max(80, "O nome da turma deve ter no máximo 80 caracteres."),
  subject: z
    .string({ required_error: "Informe a disciplina." })
    .trim()
    .min(2, "A disciplina deve ter ao menos 2 caracteres.")
    .max(80, "A disciplina deve ter no máximo 80 caracteres."),
  year: z.coerce
    .number({ invalid_type_error: "Informe um ano letivo válido." })
    .int("O ano letivo deve ser um número inteiro.")
    .min(2000, "Ano letivo inválido.")
    .max(2100, "Ano letivo inválido."),
  shift: z.enum(CLASSROOM_SHIFTS, {
    errorMap: () => ({ message: "Selecione um turno válido (Manhã, Tarde ou Noite)." }),
  }),
  teacherId: z
    .string({ required_error: "Selecione o professor responsável." })
    .trim()
    .min(1, "Selecione o professor responsável."),
});

export const createStudentSchema = z.object({
  name: z
    .string({ required_error: "Informe o nome completo do aluno." })
    .trim()
    .min(3, "O nome do aluno deve ter ao menos 3 caracteres.")
    .max(120, "O nome do aluno deve ter no máximo 120 caracteres."),
  registration: z
    .string({ required_error: "Informe a matrícula/CGM do aluno." })
    .trim()
    .min(3, "A matrícula deve ter ao menos 3 caracteres.")
    .max(40, "A matrícula deve ter no máximo 40 caracteres.")
    .regex(/^[A-Za-z0-9.\-/]+$/, "A matrícula deve conter apenas letras, números ou separadores (. - /)."),
  guardianName: z
    .string({ required_error: "Informe o nome do responsável." })
    .trim()
    .min(3, "O nome do responsável deve ter ao menos 3 caracteres.")
    .max(120, "O nome do responsável deve ter no máximo 120 caracteres."),
  guardianPhone: z
    .string({ required_error: "Informe o telefone do responsável." })
    .trim()
    .min(8, "Informe um telefone válido com DDD.")
    .max(30, "Telefone excede o limite permitido."),
  active: z.boolean().optional().default(true),
});

export const updateStudentSchema = z.object({
  name: z
    .string({ required_error: "Informe o nome completo do aluno." })
    .trim()
    .min(3, "O nome do aluno deve ter ao menos 3 caracteres.")
    .max(120, "O nome do aluno deve ter no máximo 120 caracteres."),
  registration: z
    .string({ required_error: "Informe a matrícula/CGM do aluno." })
    .trim()
    .min(3, "A matrícula deve ter ao menos 3 caracteres.")
    .max(40, "A matrícula deve ter no máximo 40 caracteres.")
    .regex(/^[A-Za-z0-9.\-/]+$/, "A matrícula deve conter apenas letras, números ou separadores (. - /)."),
  guardianName: z
    .string({ required_error: "Informe o nome do responsável." })
    .trim()
    .min(3, "O nome do responsável deve ter ao menos 3 caracteres.")
    .max(120, "O nome do responsável deve ter no máximo 120 caracteres."),
  guardianPhone: z
    .string({ required_error: "Informe o telefone do responsável." })
    .trim()
    .min(8, "Informe um telefone válido com DDD.")
    .max(30, "Telefone excede o limite permitido."),
  active: z.boolean().optional(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
