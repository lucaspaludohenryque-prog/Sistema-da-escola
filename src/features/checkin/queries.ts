import { AttendanceStatus, GateCheckInType as PrismaGateCheckInType } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { getSchoolConfig } from "@/features/school-config";
import { prisma } from "@/lib/prisma";
import { buildStudentCardQrPayload, getSaoPauloDateTime } from "./constants";
import type {
  GateCheckInRecord,
  StudentCardItem,
  TodayCheckInsResponse,
} from "./types";

interface StudentCardFilter {
  studentId?: string | null;
  classroomId?: string | null;
}

function calculateAttendanceRate(
  attendances: ReadonlyArray<{ status: AttendanceStatus }>
): number | null {
  if (attendances.length === 0) {
    return null;
  }
  let effectivePresent = 0;
  for (const item of attendances) {
    if (
      item.status === AttendanceStatus.PRESENTE ||
      item.status === AttendanceStatus.JUSTIFICADA
    ) {
      effectivePresent += 1;
    }
  }
  return Math.round((effectivePresent / attendances.length) * 100);
}

export async function getStudentCardsForUser(
  user: PublicUser,
  filter: StudentCardFilter = {}
): Promise<StudentCardItem[]> {
  const schoolConfig = await getSchoolConfig();
  const studentId = filter.studentId?.trim() || undefined;
  const classroomId = filter.classroomId?.trim() || undefined;

  let whereClause: Record<string, unknown> = { active: true };

  if (user.role === "ALUNO") {
    whereClause = { userId: user.id, active: true };
  } else if (user.role === "RESPONSAVEL") {
    whereClause = {
      active: true,
      guardianLinks: { some: { guardianId: user.id } },
      ...(studentId ? { id: studentId } : {}),
    };
  } else {
    const isManager = canManageClassrooms(user.role);
    const teacherScope = isManager ? {} : { classroom: { teacherId: user.id } };

    if (studentId) {
      whereClause = { id: studentId, ...teacherScope };
    } else if (classroomId) {
      whereClause = { classroomId, active: true, ...teacherScope };
    } else {
      whereClause = { active: true, ...teacherScope };
    }
  }

  const students = await prisma.student.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      registration: true,
      classroom: {
        select: {
          id: true,
          name: true,
          subject: true,
          shift: true,
          year: true,
        },
      },
      attendances: {
        select: { status: true },
      },
    },
    orderBy: [{ classroom: { name: "asc" } }, { name: "asc" }],
    take: studentId ? 1 : 60,
  });

  return students.map((student) => ({
    studentId: student.id,
    name: student.name,
    registration: student.registration,
    classroomId: student.classroom.id,
    classroomName: student.classroom.name,
    classroomSubject: student.classroom.subject,
    shift: student.classroom.shift,
    schoolYear: schoolConfig.schoolYear || student.classroom.year,
    schoolName: schoolConfig.name,
    schoolCity: schoolConfig.city,
    schoolState: schoolConfig.state,
    schoolLogoUrl: schoolConfig.logoUrl,
    schoolPrimaryColor: schoolConfig.primaryColor,
    attendanceRate: calculateAttendanceRate(student.attendances),
    qrPayload: buildStudentCardQrPayload(student.id),
  }));
}

export async function getTodayCheckInsForUser(
  user: PublicUser
): Promise<TodayCheckInsResponse> {
  const { date } = getSaoPauloDateTime();
  const isManager = canManageClassrooms(user.role);

  const whereScope = isManager
    ? { date }
    : { date, classroom: { teacherId: user.id } };

  const [records, groupedCounts] = await Promise.all([
    prisma.gateCheckIn.findMany({
      where: whereScope,
      select: {
        id: true,
        studentId: true,
        classroomId: true,
        date: true,
        time: true,
        type: true,
        notes: true,
        createdAt: true,
        student: { select: { name: true, registration: true } },
        classroom: { select: { name: true, subject: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.gateCheckIn.groupBy({
      by: ["type"],
      where: whereScope,
      _count: { _all: true },
    }),
  ]);

  let totalEntradas = 0;
  let totalAtrasos = 0;
  let totalSaidas = 0;

  for (const row of groupedCounts) {
    if (row.type === PrismaGateCheckInType.ENTRADA) {
      totalEntradas = row._count._all;
    } else if (row.type === PrismaGateCheckInType.ATRASO) {
      totalAtrasos = row._count._all;
    } else if (row.type === PrismaGateCheckInType.SAIDA) {
      totalSaidas = row._count._all;
    }
  }

  const items: GateCheckInRecord[] = records.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    studentName: row.student.name,
    registration: row.student.registration,
    classroomId: row.classroomId,
    classroomName: row.classroom.name,
    classroomSubject: row.classroom.subject,
    date: row.date,
    time: row.time,
    type: row.type,
    notes: row.notes,
    recordedByName: row.recordedBy.name,
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    date,
    summary: {
      totalEntradas,
      totalAtrasos,
      totalSaidas,
    },
    items,
  };
}
