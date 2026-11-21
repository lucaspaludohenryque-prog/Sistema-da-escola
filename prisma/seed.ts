import { PrismaClient, Shift, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_SALT_ROUNDS = 12;

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface SeedStudent {
  name: string;
  registration: string;
  guardianName: string;
  guardianPhone: string;
}

interface SeedClassroom {
  id: string;
  name: string;
  subject: string;
  year: number;
  shift: Shift;
  students: SeedStudent[];
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
  {
    name: "Patrícia Helena Barbosa",
    email: "mae@escola.com",
    password: process.env.SEED_GUARDIAN_PASSWORD ?? "123456",
    role: UserRole.RESPONSAVEL,
  },
  {
    name: "Eduarda Cristina Barbosa",
    email: "aluno@escola.com",
    password: process.env.SEED_STUDENT_PASSWORD ?? "123456",
    role: UserRole.ALUNO,
  },
];

const LINKED_STUDENT_REGISTRATION = "2026090103";

const DEFAULT_CLASSROOMS: SeedClassroom[] = [
  {
    id: "seed-classroom-9a-matematica",
    name: "9º Ano A",
    subject: "Matemática",
    year: 2026,
    shift: Shift.MANHA,
    students: [
      {
        name: "Beatriz Nogueira Alencar",
        registration: "2026090101",
        guardianName: "Marcos Antônio Alencar",
        guardianPhone: "(41) 99814-2301",
      },
      {
        name: "Caio Henrique Vasconcelos",
        registration: "2026090102",
        guardianName: "Fernanda Lima Vasconcelos",
        guardianPhone: "(41) 99742-8815",
      },
      {
        name: "Eduarda Cristina Barbosa",
        registration: "2026090103",
        guardianName: "Patrícia Helena Barbosa",
        guardianPhone: "(41) 99631-4509",
      },
      {
        name: "Gabriel Augusto Ferraz",
        registration: "2026090104",
        guardianName: "Roberto Carlos Ferraz",
        guardianPhone: "(41) 99908-1174",
      },
      {
        name: "Helena Vitória Cavalcanti",
        registration: "2026090105",
        guardianName: "Luciana Rocha Cavalcanti",
        guardianPhone: "(41) 99855-6023",
      },
      {
        name: "Lucas Matheus Pimentel",
        registration: "2026090106",
        guardianName: "André Luiz Pimentel",
        guardianPhone: "(41) 99719-3340",
      },
    ],
  },
  {
    id: "seed-classroom-1b-matematica",
    name: "1º Ano B",
    subject: "Matemática",
    year: 2026,
    shift: Shift.TARDE,
    students: [
      {
        name: "Amanda Ribeiro Tavares",
        registration: "2026100201",
        guardianName: "Cláudia Ribeiro Tavares",
        guardianPhone: "(41) 99684-1920",
      },
      {
        name: "Bruno Felipe Siqueira",
        registration: "2026100202",
        guardianName: "Eduardo José Siqueira",
        guardianPhone: "(41) 99877-5412",
      },
      {
        name: "Isabela Monteiro Duarte",
        registration: "2026100203",
        guardianName: "Renata Monteiro Duarte",
        guardianPhone: "(41) 99923-7748",
      },
      {
        name: "João Pedro Carvalho",
        registration: "2026100204",
        guardianName: "Sérgio Ricardo Carvalho",
        guardianPhone: "(41) 99765-2089",
      },
      {
        name: "Larissa Gomes Peixoto",
        registration: "2026100205",
        guardianName: "Simone Gomes Peixoto",
        guardianPhone: "(41) 99612-8394",
      },
      {
        name: "Rafael Vinicius Santana",
        registration: "2026100206",
        guardianName: "Daniela Costa Santana",
        guardianPhone: "(41) 99841-6650",
      },
    ],
  },
];

async function main(): Promise<void> {
  const usersByEmail = new Map<string, string>();

  for (const user of DEFAULT_USERS) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);

    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: passwordHash,
        role: user.role,
        active: true,
      },
      create: {
        name: user.name,
        email: user.email,
        password: passwordHash,
        role: user.role,
        active: true,
      },
      select: { id: true, email: true },
    });

    usersByEmail.set(record.email, record.id);
  }

  const professorId = usersByEmail.get("professor@escola.com");
  const guardianUserId = usersByEmail.get("mae@escola.com");
  const studentUserId = usersByEmail.get("aluno@escola.com");

  if (!professorId || !guardianUserId || !studentUserId) {
    throw new Error("Usuarios padrao obrigatorios nao encontrados apos upsert.");
  }

  let totalStudents = 0;
  let linkedStudentId: string | null = null;

  for (const classroom of DEFAULT_CLASSROOMS) {
    await prisma.classroom.upsert({
      where: { id: classroom.id },
      update: {
        name: classroom.name,
        subject: classroom.subject,
        year: classroom.year,
        shift: classroom.shift,
        teacherId: professorId,
      },
      create: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        year: classroom.year,
        shift: classroom.shift,
        teacherId: professorId,
      },
    });

    for (const student of classroom.students) {
      const isLinkedStudent = student.registration === LINKED_STUDENT_REGISTRATION;
      const savedStudent = await prisma.student.upsert({
        where: { registration: student.registration },
        update: {
          name: student.name,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          active: true,
          classroomId: classroom.id,
          ...(isLinkedStudent ? { userId: studentUserId } : {}),
        },
        create: {
          name: student.name,
          registration: student.registration,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          active: true,
          classroomId: classroom.id,
          ...(isLinkedStudent ? { userId: studentUserId } : {}),
        },
        select: { id: true },
      });

      if (isLinkedStudent) {
        linkedStudentId = savedStudent.id;
      }
      totalStudents += 1;
    }
  }

  if (linkedStudentId) {
    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardianUserId,
          studentId: linkedStudentId,
        },
      },
      update: {
        relationship: "Mãe",
      },
      create: {
        guardianId: guardianUserId,
        studentId: linkedStudentId,
        relationship: "Mãe",
      },
    });
  }

  console.info(
    `Seed concluido com sucesso: ${DEFAULT_USERS.length} usuarios, ${DEFAULT_CLASSROOMS.length} turmas, ${totalStudents} alunos e vinculo familiar configurado.`
  );
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao executar o seed do banco de dados:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
