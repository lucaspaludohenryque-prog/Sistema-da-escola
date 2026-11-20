import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_SALT_ROUNDS = 12;

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const DEFAULT_USERS: SeedUser[] = [
  {
    name: "Prof. Carlos Eduardo Silva",
    email: "professor@escola.com",
    password: process.env.SEED_PROFESSOR_PASSWORD ?? "123456",
    role: UserRole.PROFESSOR,
  },
  {
    name: "Ana Paula Mendonça",
    email: "admin@escola.com",
    password: process.env.SEED_ADMIN_PASSWORD ?? "123456",
    role: UserRole.ADMIN,
  },
];

async function main(): Promise<void> {
  for (const user of DEFAULT_USERS) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: passwordHash,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        password: passwordHash,
        role: user.role,
      },
    });
  }

  console.info("Seed concluido com sucesso: 2 usuarios disponiveis para autenticacao.");
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao executar o seed do banco de dados:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
