import { prisma } from "@/lib/prisma";
import type { ManagedUser } from "./types";

const ptBrCollator = new Intl.Collator("pt-BR", {
  sensitivity: "base",
  numeric: true,
});

/**
 * Lista todos os usuarios ordenados alfabeticamente (pt-BR) sem expor password,
 * incluindo contagem de turmas e ocorrencias vinculadas.
 */
export async function listManagedUsers(): Promise<ManagedUser[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: {
        select: {
          classrooms: true,
          occurrences: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return users
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      classroomCount: user._count.classrooms,
      occurrenceCount: user._count.occurrences,
      createdAt: user.createdAt.toISOString(),
    }))
    .sort((a, b) => ptBrCollator.compare(a.name, b.name));
}
