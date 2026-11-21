import {
  AttendanceStatus,
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceType,
} from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import {
  ACADEMIC_TERMS,
  calculateAnnualAverage,
  calculateFinalTermAverage,
  calculateWeightedTermAverage,
  formatScoreBr,
} from "@/features/grades";
import { getSchoolConfig } from "@/features/school-config";
import { prisma } from "@/lib/prisma";
import type {
  RadarAnalyticsPayload,
  RadarStudentItem,
  RiskLevel,
} from "./types";

export async function getRadarAnalyticsForUser(
  user: PublicUser
): Promise<RadarAnalyticsPayload> {
  const isManager = canManageClassrooms(user.role);

  const [schoolConfig, classrooms] = await Promise.all([
    getSchoolConfig(),
    prisma.classroom.findMany({
      where: isManager ? {} : { teacherId: user.id },
      select: {
        id: true,
        name: true,
        subject: true,
        students: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            registration: true,
            guardianName: true,
            guardianPhone: true,
            attendances: {
              select: {
                status: true,
                lesson: { select: { date: true, lessonNumber: true } },
              },
              orderBy: [
                { lesson: { date: "desc" } },
                { lesson: { lessonNumber: "desc" } },
              ],
            },
            grades: {
              select: {
                assessmentId: true,
                score: true,
              },
            },
            termRecoveries: {
              select: {
                term: true,
                score: true,
              },
            },
            occurrences: {
              select: {
                type: true,
                severity: true,
                status: true,
              },
            },
          },
        },
        assessments: {
          select: {
            id: true,
            term: true,
            maxScore: true,
            weight: true,
          },
        },
      },
      orderBy: [{ name: "asc" }, { subject: "asc" }],
    }),
  ]);

  const students: RadarStudentItem[] = [];
  const gradeSumList: number[] = [];

  for (const classroom of classrooms) {
    const assessmentsByTerm = new Map<number, typeof classroom.assessments>();
    for (const a of classroom.assessments) {
      const list = assessmentsByTerm.get(a.term) ?? [];
      list.push(a);
      assessmentsByTerm.set(a.term, list);
    }

    for (const student of classroom.students) {
      // 1. Frequencia e sequencia de faltas recentes
      let present = 0;
      let absent = 0;
      let justified = 0;
      for (const att of student.attendances) {
        if (att.status === AttendanceStatus.PRESENTE) present += 1;
        else if (att.status === AttendanceStatus.FALTA) absent += 1;
        else justified += 1;
      }
      const totalLessons = present + absent + justified;
      const attendanceRate =
        totalLessons > 0
          ? Math.round(((present + justified) / totalLessons) * 100)
          : null;

      let consecutiveAbsences = 0;
      for (const att of student.attendances) {
        if (att.status === AttendanceStatus.FALTA) {
          consecutiveAbsences += 1;
        } else {
          break;
        }
      }

      // 2. Media geral considerando recuperacao paralela
      const gradeMap = new Map<string, number>();
      for (const g of student.grades) {
        gradeMap.set(g.assessmentId, g.score);
      }
      const recoveryMap = new Map<number, number>();
      for (const r of student.termRecoveries) {
        recoveryMap.set(r.term, r.score);
      }

      const termFinals = ACADEMIC_TERMS.map((term) => {
        const list = assessmentsByTerm.get(term) ?? [];
        const rawAvg = calculateWeightedTermAverage(
          list.map((a) => ({
            score: gradeMap.get(a.id) ?? null,
            maxScore: a.maxScore,
            weight: a.weight,
          }))
        );
        const rec = recoveryMap.get(term) ?? null;
        return calculateFinalTermAverage(rawAvg, rec);
      });

      const overallAverage = calculateAnnualAverage(termFinals);
      if (overallAverage !== null) {
        gradeSumList.push(overallAverage);
      }

      // 3. Ocorrencias disciplinares
      let pendingGraveOccurrences = 0;
      let totalNegativeOccurrences = 0;
      for (const occ of student.occurrences) {
        if (occ.type !== OccurrenceType.ELOGIO) {
          totalNegativeOccurrences += 1;
        }
        if (
          occ.status === OccurrenceStatus.PENDENTE &&
          occ.severity === OccurrenceSeverity.GRAVE
        ) {
          pendingGraveOccurrences += 1;
        }
      }

      // 4. Calculo deterministico do Score (0-100)
      let score = 0;
      const factors: string[] = [];
      const recommendations: string[] = [];

      if (attendanceRate !== null && attendanceRate < 75) {
        score += 35;
        factors.push(`Frequência crítica (${attendanceRate}%)`);
        recommendations.push(
          "Contatar responsável imediatamente para busca ativa e plano de regularização de frequência."
        );
      } else if (attendanceRate !== null && attendanceRate < 82) {
        score += 15;
        factors.push(`Frequência em queda (${attendanceRate}%)`);
        recommendations.push(
          "Monitorar assiduidade semanalmente para evitar queda abaixo do limite legal de 75%."
        );
      }

      if (consecutiveAbsences >= 3) {
        score += 30;
        factors.push(`${consecutiveAbsences} faltas seguidas`);
        recommendations.push(
          "Verificar motivo das ausências consecutivas via WhatsApp ou contato telefônico com a família."
        );
      } else if (consecutiveAbsences === 2) {
        score += 15;
        factors.push("2 faltas seguidas");
        recommendations.push(
          "Sinalizar ausência recorrente para a coordenação e acompanhar próxima aula."
        );
      }

      if (overallAverage !== null && overallAverage < 5.0) {
        score += 40;
        factors.push(`Média crítica (${formatScoreBr(overallAverage)})`);
        recommendations.push(
          "Incluir estudante em recuperação paralela prioritária e plano individual de estudos."
        );
      } else if (overallAverage !== null && overallAverage < 6.0) {
        score += 30;
        factors.push(`Média abaixo de 6,0 (${formatScoreBr(overallAverage)})`);
        recommendations.push(
          "Agendar atividades de reforço e revisão dirigida antes do fechamento do trimestre."
        );
      }

      if (pendingGraveOccurrences > 0) {
        score += Math.min(30, pendingGraveOccurrences * 20);
        factors.push(
          pendingGraveOccurrences === 1
            ? "1 ocorrência grave pendente"
            : `${pendingGraveOccurrences} ocorrências graves pendentes`
        );
        recommendations.push(
          "Encaminhar ocorrência grave à Coordenação e registrar devolutiva com a família."
        );
      }

      if (totalNegativeOccurrences >= 3) {
        score += 15;
        factors.push(`${totalNegativeOccurrences} ocorrências registradas`);
        recommendations.push(
          "Avaliar mediação pedagógica em Conselho de Classe e ajuste de lugar no Mapa de Sala."
        );
      }

      const riskScore = Math.min(100, Math.max(0, score));
      const riskLevel: RiskLevel =
        riskScore >= 65 ? "CRITICO" : riskScore >= 35 ? "ATENCAO" : "ESTAVEL";

      if (recommendations.length === 0) {
        recommendations.push(
          "Manter acompanhamento regular; considere reconhecer bom desempenho com uma medalha de mérito."
        );
      }

      students.push({
        studentId: student.id,
        studentName: student.name,
        registration: student.registration,
        classroomId: classroom.id,
        classroomName: classroom.name,
        classroomSubject: classroom.subject,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        attendanceRate,
        consecutiveAbsences,
        overallAverage,
        pendingGraveOccurrences,
        totalNegativeOccurrences,
        riskScore,
        riskLevel,
        factors,
        recommendations,
      });
    }
  }

  students.sort(
    (a, b) =>
      b.riskScore - a.riskScore || a.studentName.localeCompare(b.studentName, "pt-BR")
  );

  let criticalCount = 0;
  let attentionCount = 0;
  let stableCount = 0;
  let scoreSum = 0;

  for (const s of students) {
    scoreSum += s.riskScore;
    if (s.riskLevel === "CRITICO") criticalCount += 1;
    else if (s.riskLevel === "ATENCAO") attentionCount += 1;
    else stableCount += 1;
  }

  const schoolAverageGrade =
    gradeSumList.length > 0
      ? Math.round(
          (gradeSumList.reduce((acc, v) => acc + v, 0) / gradeSumList.length) * 10
        ) / 10
      : null;

  return {
    schoolName: schoolConfig.name,
    summary: {
      criticalCount,
      attentionCount,
      stableCount,
      totalStudents: students.length,
      averageRiskScore:
        students.length > 0 ? Math.round(scoreSum / students.length) : 0,
      schoolAverageGrade,
    },
    classrooms: classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
    })),
    students,
  };
}
