import type { Prisma } from "@prisma/client";
import type { PublicUser } from "@/features/auth/types";
import { canManageClassrooms } from "@/features/classrooms/constants";
import { prisma } from "@/lib/prisma";
import type {
  OccurrenceFamilyReceipt,
  OccurrenceItem,
  OccurrenceSeverity,
  OccurrenceStatus,
} from "./types";

export interface OccurrenceListFilters {
  classroomId?: string;
  severity?: OccurrenceSeverity;
  status?: OccurrenceStatus;
  search?: string;
}

/**
 * Monta em lote o status de ciencia da familia para uma lista de ocorrencias,
 * evitando consultas N+1.
 */
export async function buildOccurrenceFamilyReceipts(
  items: Array<{ id: string; studentId: string }>
): Promise<Map<string, OccurrenceFamilyReceipt>> {
  const result = new Map<string, OccurrenceFamilyReceipt>();
  if (items.length === 0) {
    return result;
  }

  const studentIds = Array.from(new Set(items.map((item) => item.studentId)));
  const referenceKeys = items.map((item) => `OCC_${item.id}`);

  const [guardianLinks, notifications] = await Promise.all([
    prisma.guardianStudent.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true },
    }),
    prisma.notification.findMany({
      where: {
        referenceKey: { in: referenceKeys },
      },
      select: {
        referenceKey: true,
        acknowledgedAt: true,
        recipient: {
          select: { name: true },
        },
      },
    }),
  ]);

  const studentsWithGuardian = new Set(guardianLinks.map((link) => link.studentId));
  const notificationsByKey = new Map<
    string,
    Array<{ acknowledgedAt: Date | null; recipientName: string }>
  >();

  for (const notif of notifications) {
    if (!notif.referenceKey) continue;
    const list = notificationsByKey.get(notif.referenceKey) ?? [];
    list.push({
      acknowledgedAt: notif.acknowledgedAt,
      recipientName: notif.recipient.name,
    });
    notificationsByKey.set(notif.referenceKey, list);
  }

  for (const item of items) {
    const key = `OCC_${item.id}`;
    const notifs = notificationsByKey.get(key) ?? [];
    const acked = notifs
      .filter((n): n is { acknowledgedAt: Date; recipientName: string } =>
        Boolean(n.acknowledgedAt)
      )
      .sort((a, b) => a.acknowledgedAt.getTime() - b.acknowledgedAt.getTime())[0];

    if (acked) {
      result.set(item.id, {
        status: "ACKNOWLEDGED",
        acknowledgedAt: acked.acknowledgedAt.toISOString(),
        acknowledgedByName: acked.recipientName,
      });
    } else if (studentsWithGuardian.has(item.studentId) || notifs.length > 0) {
      result.set(item.id, {
        status: "PENDING",
        acknowledgedAt: null,
        acknowledgedByName: null,
      });
    } else {
      result.set(item.id, {
        status: "NO_GUARDIAN",
        acknowledgedAt: null,
        acknowledgedByName: null,
      });
    }
  }

  return result;
}

/**
 * Lista ocorrencias com controle de acesso por perfil (PROFESSOR ve apenas de suas turmas;
 * ADMIN/COORDENACAO veem todas) e filtros por turma, gravidade, status e nome do aluno.
 */
export async function listOccurrencesForUser(
  user: PublicUser,
  filters: OccurrenceListFilters = {}
): Promise<OccurrenceItem[]> {
  const isManager = canManageClassrooms(user.role);

  const whereClause: Prisma.OccurrenceWhereInput = {
    ...(isManager ? {} : { classroom: { teacherId: user.id } }),
    ...(filters.classroomId ? { classroomId: filters.classroomId } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const records = await prisma.occurrence.findMany({
    where: whereClause,
    select: {
      id: true,
      studentId: true,
      classroomId: true,
      authorId: true,
      type: true,
      severity: true,
      description: true,
      status: true,
      resolutionNote: true,
      date: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          registration: true,
        },
      },
      classroom: {
        select: {
          id: true,
          name: true,
          subject: true,
          shift: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const normalizedSearch = filters.search?.trim().toLowerCase() ?? "";

  const filtered = normalizedSearch
    ? records.filter(
        (item) =>
          item.student.name.toLowerCase().includes(normalizedSearch) ||
          item.student.registration.toLowerCase().includes(normalizedSearch)
      )
    : records;

  const receiptMap = await buildOccurrenceFamilyReceipts(
    filtered.map((item) => ({ id: item.id, studentId: item.studentId }))
  );

  return filtered.map((record) => ({
    id: record.id,
    studentId: record.studentId,
    classroomId: record.classroomId,
    authorId: record.authorId,
    type: record.type,
    severity: record.severity,
    description: record.description,
    status: record.status,
    resolutionNote: record.resolutionNote,
    date: record.date,
    createdAt: record.createdAt.toISOString(),
    canDelete: isManager || record.authorId === user.id,
    familyReceipt: receiptMap.get(record.id) ?? {
      status: "NO_GUARDIAN",
      acknowledgedAt: null,
      acknowledgedByName: null,
    },
    student: record.student,
    classroom: record.classroom,
    author: record.author,
  }));
}
