import crypto from "crypto";
import {
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";
import { prisma } from "@/lib/prisma";
import type {
  PublicVerificationPayload,
  VerificationSummaryData,
} from "./types";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateVerificationCode(year: number): string {
  const bytes = crypto.randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    const byte = bytes[i] ?? 0;
    suffix += CODE_ALPHABET[byte % CODE_ALPHABET.length] ?? "A";
  }
  return `RCO-${year}-${suffix}`;
}

export function normalizeVerificationCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export async function findPublicVerificationByCode(
  rawCode: string
): Promise<PublicVerificationPayload | null> {
  const code = normalizeVerificationCode(rawCode);
  if (code.length < 6) {
    return null;
  }

  const [record, school] = await Promise.all([
    prisma.documentVerification.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
      },
      select: {
        code: true,
        docType: true,
        title: true,
        subjectName: true,
        classroomName: true,
        summaryJson: true,
        issuedByName: true,
        issuedAt: true,
      },
    }),
    getSchoolConfig().catch(() => getDefaultSchoolConfig()),
  ]);

  if (!record) {
    return null;
  }

  let summary: VerificationSummaryData = {};
  try {
    const parsed = JSON.parse(record.summaryJson) as unknown;
    if (parsed && typeof parsed === "object") {
      summary = parsed as VerificationSummaryData;
    }
  } catch {
    summary = {};
  }

  return {
    valid: true,
    code: record.code,
    docType: record.docType,
    title: record.title,
    subjectName: record.subjectName,
    classroomName: record.classroomName,
    summary,
    issuedByName: record.issuedByName,
    issuedAt: record.issuedAt.toISOString(),
    school: {
      name: school.name,
      city: school.city,
      state: school.state,
      logoUrl: school.logoUrl,
      primaryColor: school.primaryColor,
      schoolYear: school.schoolYear,
    },
  };
}
