import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SCHOOL_PRIMARY_COLOR,
  normalizeHexColor,
} from "./constants";
import type { SchoolConfigData } from "./types";

const SINGLETON_ID = 1;

export function getDefaultSchoolConfig(): SchoolConfigData {
  return {
    id: SINGLETON_ID,
    name: "Sistema Escolar RCO",
    city: "",
    state: "PR",
    phone: "",
    schoolYear: new Date().getFullYear(),
    logoUrl: null,
    primaryColor: DEFAULT_SCHOOL_PRIMARY_COLOR,
    demoModeEnabled: true,
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * Retorna a configuracao institucional da escola (registro unico id: 1),
 * criando-o com valores padrao caso ainda nao exista.
 * Em caso de falha de conexao ou tabela ausente, retorna fallback seguro para
 * impedir crashes 500 em paginas como /login.
 */
export async function getSchoolConfig(): Promise<SchoolConfigData> {
  try {
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
        primaryColor: true,
        demoModeEnabled: true,
        updatedAt: true,
      },
    });

    return {
      ...config,
      primaryColor: normalizeHexColor(config.primaryColor),
      updatedAt: config.updatedAt.toISOString(),
    };
  } catch (error: unknown) {
    console.error("[getSchoolConfig] Falha ao consultar SchoolConfig, aplicando fallback:", {
      operation: "schoolConfig.read",
      message: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });

    return getDefaultSchoolConfig();
  }
}
