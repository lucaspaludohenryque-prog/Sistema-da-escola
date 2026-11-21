import { prisma } from "@/lib/prisma";
import type { SchoolConfigData } from "./types";

const SINGLETON_ID = 1;

/**
 * Retorna a configuracao institucional da escola (registro unico id: 1),
 * criando-o com valores padrao caso ainda nao exista.
 */
export async function getSchoolConfig(): Promise<SchoolConfigData> {
  const config = await prisma.schoolConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      phone: true,
      schoolYear: true,
      logoUrl: true,
      updatedAt: true,
    },
  });

  return {
    ...config,
    updatedAt: config.updatedAt.toISOString(),
  };
}
