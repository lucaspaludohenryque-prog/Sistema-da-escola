import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import { calculateWeightedTermAverage } from "./calculations";
import type {
  AcademicTerm,
  AssessmentItem,
  GradeSheetData,
  GradeStudentRow,
} from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

export type GradeSheetResult =
  | { status: "ok"; data: GradeSheetData }
  | { status: "not_found" }
  | { status: "forbidden" };

/**
 * Carrega todas as avaliacoes de um trimestre da turma, os alunos ativos em ordem
 * alfabetica (pt-BR), as notas lancadas e a media ponderada calculada por aluno.
 */
export async function getGradeSheetForUser(params: {
  classroomId: string;
  term: AcademicTerm;
  user: PublicUser;
}): Promise<GradeSheetResult> {
  const { classroomId, term, user } = params;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: {
      id: true,
      name: true,
      subject: true,
      teacherId: true,
      students: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          registration: true,
        },
        orderBy: { name: "asc" },
      },
      assessments: {
        where: { term },
        select: {
          id: true,
          classroomId: true,
          title: true,
          term: true,
          maxScore: true,
          weight: true,
          date: true,
          createdAt: true,
          grades: {
            select: {
              studentId: true,
              score: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!classroom) {
    return { status: "not_found" };
  }

  if (!canManageClassrooms(user.role) && classroom.teacherId !== user.id) {
    return { status: "forbidden" };
  }

  const assessments: AssessmentItem[] = classroom.assessments.map((item) => ({
    id: item.id,
    classroomId: item.classroomId,
    title: item.title,
    term: item.term as AcademicTerm,
    maxScore: item.maxScore,
    weight: item.weight,
    date: item.date,
    createdAt: item.createdAt.toISOString(),
  }));

  const gradeLookup = new Map<string, number>();
  for (const assessment of classroom.assessments) {
    for (const grade of assessment.grades) {
      gradeLookup.set(`${assessment.id}:${grade.studentId}`, grade.score);
    }
  }

  const sortedStudents = [...classroom.students].sort((a, b) =>
    ptBrCollator.compare(a.name, b.name)
  );

  const studentRows: GradeStudentRow[] = sortedStudents.map((student) => {
    const scores: Record<string, number | null> = {};
    const weightedItems = assessments.map((assessment) => {
      const value = gradeLookup.get(`${assessment.id}:${student.id}`) ?? null;
      scores[assessment.id] = value;
      return {
        score: value,
        maxScore: assessment.maxScore,
        weight: assessment.weight,
      };
    });

    return {
      studentId: student.id,
      name: student.name,
      registration: student.registration,
      scores,
      termAverage: calculateWeightedTermAverage(weightedItems),
    };
  });

  return {
    status: "ok",
    data: {
      classroomId: classroom.id,
      classroomName: classroom.name,
      classroomSubject: classroom.subject,
      term,
      assessments,
      students: studentRows,
    },
  };
}
