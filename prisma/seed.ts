import {
  AnnouncementPriority,
  AttendanceStatus,
  BadgeCategory,
  HomeworkSubmissionStatus,
  HomeworkType,
  JustificationStatus,
  LessonPlanStatus,
  MeetingMode,
  MeetingStatus,
  NotificationType,
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceType,
  PrismaClient,
  SchoolEventType,
  Shift,
  ThreadStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_SALT_ROUNDS = 12;

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

type RiskProfile = "CRITICAL" | "ATTENTION" | "AMANDA" | "PEDRO" | "STABLE";

interface SeedStudent {
  name: string;
  registration: string;
  guardianName: string;
  guardianPhone: string;
  profile: RiskProfile;
  baseGrade: number;
}

interface SeedClassroom {
  id: string;
  name: string;
  subject: string;
  year: number;
  shift: Shift;
  room: string;
  students: SeedStudent[];
  lessonContents: string[];
}

const AMANDA_REGISTRATION = "2026100201";
const PEDRO_REGISTRATION = "2026090110";
const CRITICAL_9A_REGISTRATION = "2026090104";
const ATTENTION_9A_REGISTRATION = "2026090106";
const CRITICAL_1B_REGISTRATION = "2026100204";
const ATTENTION_1B_REGISTRATION = "2026100206";
const TOP_9A_REGISTRATION = "2026090101";

const DEFAULT_USERS: SeedUser[] = [
  {
    name: "Ana Paula Mendonça",
    email: "admin@escola.com",
    password: process.env.SEED_ADMIN_PASSWORD ?? "123456",
    role: UserRole.ADMIN,
  },
  {
    name: "Mariana Costa Ferreira",
    email: "coordenacao@escola.com",
    password: process.env.SEED_COORD_PASSWORD ?? "123456",
    role: UserRole.COORDENACAO,
  },
  {
    name: "Prof. Carlos Eduardo Silva",
    email: "professor@escola.com",
    password: process.env.SEED_PROFESSOR_PASSWORD ?? "123456",
    role: UserRole.PROFESSOR,
  },
  {
    name: "Cláudia Ribeiro Tavares",
    email: "mae@escola.com",
    password: process.env.SEED_GUARDIAN_PASSWORD ?? "123456",
    role: UserRole.RESPONSAVEL,
  },
  {
    name: "Amanda Ribeiro Tavares",
    email: "aluno@escola.com",
    password: process.env.SEED_STUDENT_PASSWORD ?? "123456",
    role: UserRole.ALUNO,
  },
];

const DEFAULT_CLASSROOMS: SeedClassroom[] = [
  {
    id: "seed-classroom-9a-matematica",
    name: "9º Ano A",
    subject: "Matemática",
    year: 2026,
    shift: Shift.MANHA,
    room: "Sala 204",
    lessonContents: [
      "Revisão de fatoração algébrica e produtos notáveis",
      "Equações do 2º Grau: introdução e forma reduzida",
      "Equações do 2º Grau: Fórmula de Bhaskara e discriminante",
      "Soma e produto das raízes com problemas contextualizados",
      "Teorema de Pitágoras: demonstração geométrica e aplicações",
      "Relações métricas no triângulo retângulo",
      "Semelhança de triângulos e Teorema de Tales",
      "Razões trigonométricas no triângulo retângulo (seno, cosseno e tangente)",
      "Funções Afim: coeficientes, raiz e interpretação prática",
      "Análise de gráficos e resolução de exercícios de revisão",
    ],
    students: [
      {
        name: "Beatriz Nogueira Alencar",
        registration: TOP_9A_REGISTRATION,
        guardianName: "Marcos Antônio Alencar",
        guardianPhone: "(41) 99814-2301",
        profile: "STABLE",
        baseGrade: 9.3,
      },
      {
        name: "Caio Henrique Vasconcelos",
        registration: "2026090102",
        guardianName: "Fernanda Lima Vasconcelos",
        guardianPhone: "(41) 99742-8815",
        profile: "STABLE",
        baseGrade: 8.2,
      },
      {
        name: "Eduarda Cristina Barbosa",
        registration: "2026090103",
        guardianName: "Patrícia Helena Barbosa",
        guardianPhone: "(41) 99631-4509",
        profile: "STABLE",
        baseGrade: 8.6,
      },
      {
        name: "Gabriel Augusto Ferraz",
        registration: CRITICAL_9A_REGISTRATION,
        guardianName: "Roberto Carlos Ferraz",
        guardianPhone: "(41) 99908-1174",
        profile: "CRITICAL",
        baseGrade: 4.1,
      },
      {
        name: "Helena Vitória Cavalcanti",
        registration: "2026090105",
        guardianName: "Luciana Rocha Cavalcanti",
        guardianPhone: "(41) 99855-6023",
        profile: "STABLE",
        baseGrade: 8.9,
      },
      {
        name: "Lucas Matheus Pimentel",
        registration: ATTENTION_9A_REGISTRATION,
        guardianName: "André Luiz Pimentel",
        guardianPhone: "(41) 99719-3340",
        profile: "ATTENTION",
        baseGrade: 5.4,
      },
      {
        name: "Mariana Lopes Guimarães",
        registration: "2026090107",
        guardianName: "Juliana Lopes Guimarães",
        guardianPhone: "(41) 99640-7182",
        profile: "STABLE",
        baseGrade: 7.9,
      },
      {
        name: "Matheus Oliveira Prado",
        registration: "2026090108",
        guardianName: "Ricardo Oliveira Prado",
        guardianPhone: "(41) 99832-4405",
        profile: "STABLE",
        baseGrade: 7.4,
      },
      {
        name: "Sofia Mendes Moreira",
        registration: "2026090109",
        guardianName: "Camila Mendes Moreira",
        guardianPhone: "(41) 99915-2041",
        profile: "STABLE",
        baseGrade: 8.8,
      },
      {
        name: "Pedro Ribeiro Tavares",
        registration: PEDRO_REGISTRATION,
        guardianName: "Cláudia Ribeiro Tavares",
        guardianPhone: "(41) 99684-1920",
        profile: "PEDRO",
        baseGrade: 8.1,
      },
    ],
  },
  {
    id: "seed-classroom-1b-matematica",
    name: "1º Ano B",
    subject: "Matemática",
    year: 2026,
    shift: Shift.TARDE,
    room: "Sala 108",
    lessonContents: [
      "Conjuntos numéricos, operações e intervalos na reta real",
      "Conceito de função, domínio, contradomínio e imagem",
      "Função Afim: taxa de variação e coeficiente linear",
      "Estudo do sinal da Função Afim e inequações do 1º grau",
      "Análise de gráficos aplicados a situações cotidianas",
      "Função Quadrática: forma canônica e concavidade",
      "Vértice da parábola e problemas de máximo e mínimo",
      "Inequações do 2º grau e sistemas de equações",
      "Progressões Aritméticas (PA): termo geral e aplicações",
      "Revisão orientada e resolução comentada em grupo",
    ],
    students: [
      {
        name: "Amanda Ribeiro Tavares",
        registration: AMANDA_REGISTRATION,
        guardianName: "Cláudia Ribeiro Tavares",
        guardianPhone: "(41) 99684-1920",
        profile: "AMANDA",
        baseGrade: 8.9,
      },
      {
        name: "Bruno Felipe Siqueira",
        registration: "2026100202",
        guardianName: "Eduardo José Siqueira",
        guardianPhone: "(41) 99877-5412",
        profile: "STABLE",
        baseGrade: 7.8,
      },
      {
        name: "Isabela Monteiro Duarte",
        registration: "2026100203",
        guardianName: "Renata Monteiro Duarte",
        guardianPhone: "(41) 99923-7748",
        profile: "STABLE",
        baseGrade: 9.1,
      },
      {
        name: "João Pedro Carvalho",
        registration: CRITICAL_1B_REGISTRATION,
        guardianName: "Sérgio Ricardo Carvalho",
        guardianPhone: "(41) 99765-2089",
        profile: "CRITICAL",
        baseGrade: 4.3,
      },
      {
        name: "Larissa Gomes Peixoto",
        registration: "2026100205",
        guardianName: "Simone Gomes Peixoto",
        guardianPhone: "(41) 99612-8394",
        profile: "STABLE",
        baseGrade: 8.4,
      },
      {
        name: "Rafael Vinicius Santana",
        registration: ATTENTION_1B_REGISTRATION,
        guardianName: "Daniela Costa Santana",
        guardianPhone: "(41) 99841-6650",
        profile: "ATTENTION",
        baseGrade: 5.4,
      },
      {
        name: "Camila Andrade Nogueira",
        registration: "2026100207",
        guardianName: "Fábio Andrade Nogueira",
        guardianPhone: "(41) 99731-1890",
        profile: "STABLE",
        baseGrade: 8.5,
      },
      {
        name: "Diego Martins Rocha",
        registration: "2026100208",
        guardianName: "Patrícia Martins Rocha",
        guardianPhone: "(41) 99864-3217",
        profile: "STABLE",
        baseGrade: 7.3,
      },
      {
        name: "Fernanda Souza Brito",
        registration: "2026100209",
        guardianName: "Márcia Souza Brito",
        guardianPhone: "(41) 99605-9421",
        profile: "STABLE",
        baseGrade: 9.0,
      },
      {
        name: "Gustavo Henrique Azevedo",
        registration: "2026100210",
        guardianName: "Cláudio Henrique Azevedo",
        guardianPhone: "(41) 99944-5518",
        profile: "STABLE",
        baseGrade: 7.6,
      },
    ],
  },
];

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, deltaDays: number): Date {
  const next = new Date(base.getTime());
  next.setDate(next.getDate() + deltaDays);
  return next;
}

/**
 * Gera os ultimos N dias uteis (segunda a sexta) em ordem cronologica crescente.
 */
function getRecentWeekdays(count: number, offsetFromToday = 1): string[] {
  const results: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - offsetFromToday);

  while (results.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      results.push(formatYmd(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return results.reverse();
}

function clampGrade(value: number): number {
  const rounded = Math.round(value * 10) / 10;
  return Math.max(1.5, Math.min(10.0, rounded));
}

function resolveAttendanceStatus(
  profile: RiskProfile,
  lessonIndex: number,
  studentIndex: number
): AttendanceStatus {
  // 10 aulas: indices 0..9 (7, 8, 9 sao as 3 aulas mais recentes)
  if (profile === "CRITICAL") {
    // 50%-60% presenca: 4 faltas (indice 2 + 3 faltas consecutivas recentes 7, 8, 9)
    if (lessonIndex === 2 || lessonIndex >= 7) {
      return AttendanceStatus.FALTA;
    }
    return AttendanceStatus.PRESENTE;
  }

  if (profile === "ATTENTION") {
    // 80% presenca: 2 faltas (indices 4 e 8) + media ~5,6 -> Score 45 (ATENCAO)
    if (lessonIndex === 4 || lessonIndex === 8) {
      return AttendanceStatus.FALTA;
    }
    return AttendanceStatus.PRESENTE;
  }

  if (profile === "AMANDA") {
    // 1 falta ja justificada (indice 3) e 1 falta recente pendente de justificativa (indice 8)
    if (lessonIndex === 3) {
      return AttendanceStatus.JUSTIFICADA;
    }
    if (lessonIndex === 8) {
      return AttendanceStatus.FALTA;
    }
    return AttendanceStatus.PRESENTE;
  }

  if (profile === "PEDRO") {
    // 90% presenca: 1 falta (indice 6)
    if (lessonIndex === 6) {
      return AttendanceStatus.FALTA;
    }
    return AttendanceStatus.PRESENTE;
  }

  // Maioria estavel: 90% a 100%
  if (studentIndex % 3 === 1 && lessonIndex === (studentIndex + 2) % 7) {
    return AttendanceStatus.FALTA;
  }
  return AttendanceStatus.PRESENTE;
}

async function main(): Promise<void> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  // 1. Garante SchoolConfig sem sobrescrever configuracoes manuais existentes
  await prisma.schoolConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Colégio La Salle Curitiba",
      city: "Curitiba",
      state: "PR",
      phone: "(41) 3340-5500",
      schoolYear: 2026,
      primaryColor: "#1d4ed8",
      demoModeEnabled: true,
    },
  });

  // 2. Usuarios garantidos (senha padrao 123456)
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

  const adminId = usersByEmail.get("admin@escola.com")!;
  const coordId = usersByEmail.get("coordenacao@escola.com")!;
  const professorId = usersByEmail.get("professor@escola.com")!;
  const guardianUserId = usersByEmail.get("mae@escola.com")!;
  const studentUserId = usersByEmail.get("aluno@escola.com")!;

  // Libera userId de aluno caso estivesse vinculado a outro estudante de seed anterior
  await prisma.student.updateMany({
    where: {
      userId: studentUserId,
      NOT: { registration: AMANDA_REGISTRATION },
    },
    data: { userId: null },
  });

  // 3. Turmas e Alunos (2 turmas x 10 alunos = 20 estudantes)
  const studentIdsByReg = new Map<string, string>();
  const studentRecordsByClass = new Map<
    string,
    Array<{ id: string; data: SeedStudent }>
  >();

  for (const classroom of DEFAULT_CLASSROOMS) {
    await prisma.classroom.upsert({
      where: { id: classroom.id },
      update: {
        name: classroom.name,
        subject: classroom.subject,
        year: classroom.year,
        shift: classroom.shift,
        seatRows: 5,
        seatCols: 6,
        teacherId: professorId,
      },
      create: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        year: classroom.year,
        shift: classroom.shift,
        seatRows: 5,
        seatCols: 6,
        teacherId: professorId,
      },
    });

    const classStudents: Array<{ id: string; data: SeedStudent }> = [];

    for (const student of classroom.students) {
      const isAmanda = student.registration === AMANDA_REGISTRATION;
      const saved = await prisma.student.upsert({
        where: { registration: student.registration },
        update: {
          name: student.name,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          active: true,
          classroomId: classroom.id,
          ...(isAmanda ? { userId: studentUserId } : {}),
        },
        create: {
          name: student.name,
          registration: student.registration,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          active: true,
          classroomId: classroom.id,
          ...(isAmanda ? { userId: studentUserId } : {}),
        },
        select: { id: true },
      });

      studentIdsByReg.set(student.registration, saved.id);
      classStudents.push({ id: saved.id, data: student });
    }

    studentRecordsByClass.set(classroom.id, classStudents);
  }

  const amandaId = studentIdsByReg.get(AMANDA_REGISTRATION)!;
  const pedroId = studentIdsByReg.get(PEDRO_REGISTRATION)!;
  const critical9aId = studentIdsByReg.get(CRITICAL_9A_REGISTRATION)!;
  const attention9aId = studentIdsByReg.get(ATTENTION_9A_REGISTRATION)!;
  const critical1bId = studentIdsByReg.get(CRITICAL_1B_REGISTRATION)!;
  const attention1bId = studentIdsByReg.get(ATTENTION_1B_REGISTRATION)!;
  const top9aId = studentIdsByReg.get(TOP_9A_REGISTRATION)!;

  // 4. Vinculos Familia <-> 2 Filhos (Amanda no 1o Ano B + Pedro no 9o Ano A)
  await prisma.guardianStudent.deleteMany({
    where: {
      guardianId: guardianUserId,
      studentId: { notIn: [amandaId, pedroId] },
    },
  });

  for (const childId of [amandaId, pedroId]) {
    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardianUserId,
          studentId: childId,
        },
      },
      update: { relationship: "Mãe" },
      create: {
        guardianId: guardianUserId,
        studentId: childId,
        relationship: "Mãe",
      },
    });
  }

  // 5. Aulas e Frequencia das ultimas 3 semanas (10 aulas por turma)
  const recentWeekdays = getRecentWeekdays(10, 0);
  let amandaPendingAbsenceAttendanceId: string | null = null;
  let totalLessons = 0;

  for (const classroom of DEFAULT_CLASSROOMS) {
    const students = studentRecordsByClass.get(classroom.id) ?? [];
    const lessonNumber = classroom.shift === Shift.MANHA ? 1 : 2;

    for (let i = 0; i < recentWeekdays.length; i += 1) {
      const lessonDate = recentWeekdays[i];
      if (!lessonDate) {
        continue;
      }
      const content = classroom.lessonContents[i] ?? "Aula regular da disciplina";

      const lesson = await prisma.lesson.upsert({
        where: {
          classroomId_date_lessonNumber: {
            classroomId: classroom.id,
            date: lessonDate,
            lessonNumber,
          },
        },
        update: {
          content,
          observations:
            i === recentWeekdays.length - 1
              ? "Turma participativa durante a correção coletiva no quadro."
              : null,
        },
        create: {
          classroomId: classroom.id,
          date: lessonDate,
          lessonNumber,
          content,
          observations:
            i === recentWeekdays.length - 1
              ? "Turma participativa durante a correção coletiva no quadro."
              : null,
        },
        select: { id: true },
      });

      totalLessons += 1;

      for (let sIdx = 0; sIdx < students.length; sIdx += 1) {
        const student = students[sIdx];
        if (!student) {
          continue;
        }
        const status = resolveAttendanceStatus(student.data.profile, i, sIdx);

        const att = await prisma.attendance.upsert({
          where: {
            lessonId_studentId: {
              lessonId: lesson.id,
              studentId: student.id,
            },
          },
          update: { status },
          create: {
            lessonId: lesson.id,
            studentId: student.id,
            status,
          },
          select: { id: true },
        });

        if (
          student.id === amandaId &&
          status === AttendanceStatus.FALTA &&
          i === 8
        ) {
          amandaPendingAbsenceAttendanceId = att.id;
        }
      }
    }
  }

  // 6. Avaliacoes, Notas (1o e 2o Trimestres) e Recuperacao Paralela
  const assessmentTemplates = [
    {
      key: "t1-mensal",
      term: 1,
      title: "Prova Mensal",
      weight: 1.0,
      date: formatYmd(addDays(today, -95)),
      delta: -0.2,
    },
    {
      key: "t1-trabalho",
      term: 1,
      title: "Trabalho em Grupo",
      weight: 1.0,
      date: formatYmd(addDays(today, -75)),
      delta: 0.4,
    },
    {
      key: "t1-bimestral",
      term: 1,
      title: "Prova Bimestral",
      weight: 2.0,
      date: formatYmd(addDays(today, -58)),
      delta: -0.1,
    },
    {
      key: "t2-parcial",
      term: 2,
      title: "Avaliação Parcial",
      weight: 1.0,
      date: formatYmd(addDays(today, -24)),
      delta: 0.2,
    },
    {
      key: "t2-pratica",
      term: 2,
      title: "Atividade Prática de Gráficos",
      weight: 1.0,
      date: formatYmd(addDays(today, -8)),
      delta: 0.3,
    },
  ];

  let totalAssessments = 0;

  for (const classroom of DEFAULT_CLASSROOMS) {
    const students = studentRecordsByClass.get(classroom.id) ?? [];

    for (const tpl of assessmentTemplates) {
      const assessId = `seed-assess-${classroom.id}-${tpl.key}`;
      await prisma.assessment.upsert({
        where: { id: assessId },
        update: {
          title: tpl.title,
          term: tpl.term,
          maxScore: 10.0,
          weight: tpl.weight,
          date: tpl.date,
        },
        create: {
          id: assessId,
          classroomId: classroom.id,
          title: tpl.title,
          term: tpl.term,
          maxScore: 10.0,
          weight: tpl.weight,
          date: tpl.date,
        },
      });
      totalAssessments += 1;

      for (let sIdx = 0; sIdx < students.length; sIdx += 1) {
        const student = students[sIdx];
        if (!student) {
          continue;
        }
        const variation = ((sIdx % 3) - 1) * 0.2;
        const score = clampGrade(student.data.baseGrade + tpl.delta + variation);

        await prisma.grade.upsert({
          where: {
            assessmentId_studentId: {
              assessmentId: assessId,
              studentId: student.id,
            },
          },
          update: { score },
          create: {
            assessmentId: assessId,
            studentId: student.id,
            score,
          },
        });
      }
    }
  }

  // Recuperacao Paralela (2 registros em estudantes estaveis para demonstrar substituicao de media
  // sem mascarar os perfis Critico e Atencao no Radar Pedagogico)
  await prisma.termRecovery.deleteMany({
    where: {
      studentId: { in: [critical9aId, critical1bId, attention9aId, attention1bId] },
    },
  });

  const recoverySeeds = [
    {
      classroomId: "seed-classroom-9a-matematica",
      studentId: studentIdsByReg.get("2026090108")!,
      term: 1,
      score: 8.2,
    },
    {
      classroomId: "seed-classroom-1b-matematica",
      studentId: studentIdsByReg.get("2026100208")!,
      term: 1,
      score: 8.4,
    },
  ];

  for (const rec of recoverySeeds) {
    await prisma.termRecovery.upsert({
      where: {
        classroomId_studentId_term: {
          classroomId: rec.classroomId,
          studentId: rec.studentId,
          term: rec.term,
        },
      },
      update: { score: rec.score },
      create: rec,
    });
  }

  // Ata do Conselho de Classe do 1o Trimestre (9o Ano A)
  await prisma.classCouncilMinute.upsert({
    where: {
      classroomId_term: {
        classroomId: "seed-classroom-9a-matematica",
        term: 1,
      },
    },
    update: {
      date: formatYmd(addDays(today, -45)),
      summary:
        "Turma apresentou bom engajamento geral em álgebra e geometria. Dois estudantes demandam plano de acompanhamento próximo por frequência e desempenho.",
      decisions:
        "1) Convocar responsáveis de Gabriel Augusto Ferraz para plano de apoio. 2) Manter monitoria semanal de exercícios para Lucas Matheus Pimentel. 3) Registrar elogio coletivo pelo trabalho em grupo.",
      authorId: coordId,
    },
    create: {
      classroomId: "seed-classroom-9a-matematica",
      term: 1,
      date: formatYmd(addDays(today, -45)),
      summary:
        "Turma apresentou bom engajamento geral em álgebra e geometria. Dois estudantes demandam plano de acompanhamento próximo por frequência e desempenho.",
      decisions:
        "1) Convocar responsáveis de Gabriel Augusto Ferraz para plano de apoio. 2) Manter monitoria semanal de exercícios para Lucas Matheus Pimentel. 3) Registrar elogio coletivo pelo trabalho em grupo.",
      authorId: coordId,
    },
  });

  // 7. Ocorrencias variadas (7 registros)
  const occurrenceSeeds = [
    {
      id: "seed-occ-1",
      studentId: critical9aId,
      classroomId: "seed-classroom-9a-matematica",
      authorId: professorId,
      type: OccurrenceType.INDISCIPLINA,
      severity: OccurrenceSeverity.GRAVE,
      description:
        "Recusou-se a realizar a atividade avaliativa em sala e interrompeu repetidamente a explicação mesmo após duas orientações verbais.",
      status: OccurrenceStatus.PENDENTE,
      resolutionNote: null,
      date: formatYmd(addDays(today, -3)),
    },
    {
      id: "seed-occ-2",
      studentId: critical1bId,
      classroomId: "seed-classroom-1b-matematica",
      authorId: professorId,
      type: OccurrenceType.INDISCIPLINA,
      severity: OccurrenceSeverity.GRAVE,
      description:
        "Ausentou-se da sala sem autorização durante a aula de revisão e acumulou três faltas consecutivas sem justificativa.",
      status: OccurrenceStatus.PENDENTE,
      resolutionNote: null,
      date: formatYmd(addDays(today, -2)),
    },
    {
      id: "seed-occ-3",
      studentId: pedroId,
      classroomId: "seed-classroom-9a-matematica",
      authorId: professorId,
      type: OccurrenceType.SEM_MATERIAL,
      severity: OccurrenceSeverity.LEVE,
      description:
        "Compareceu à aula de geometria sem o caderno de atividades e sem régua; acompanhou em dupla com colega.",
      status: OccurrenceStatus.RESOLVIDO,
      resolutionNote:
        "Responsável comunicada e estudante trouxe todo o material completo nas aulas seguintes.",
      date: formatYmd(addDays(today, -12)),
    },
    {
      id: "seed-occ-4",
      studentId: attention9aId,
      classroomId: "seed-classroom-9a-matematica",
      authorId: professorId,
      type: OccurrenceType.USO_CELULAR,
      severity: OccurrenceSeverity.MEDIA,
      description:
        "Utilizou o aparelho celular durante a explicação de Teorema de Pitágoras; aparelho recolhido à coordenação até o término do turno.",
      status: OccurrenceStatus.RESOLVIDO,
      resolutionNote:
        "Conversa de orientação realizada com o estudante na coordenação pedagógica.",
      date: formatYmd(addDays(today, -9)),
    },
    {
      id: "seed-occ-5",
      studentId: attention1bId,
      classroomId: "seed-classroom-1b-matematica",
      authorId: professorId,
      type: OccurrenceType.ATRASO,
      severity: OccurrenceSeverity.LEVE,
      description:
        "Chegou com 18 minutos de atraso na segunda aula da tarde sem justificativa da secretaria.",
      status: OccurrenceStatus.PENDENTE,
      resolutionNote: null,
      date: formatYmd(addDays(today, -4)),
    },
    {
      id: "seed-occ-6",
      studentId: amandaId,
      classroomId: "seed-classroom-1b-matematica",
      authorId: professorId,
      type: OccurrenceType.ELOGIO,
      severity: OccurrenceSeverity.LEVE,
      description:
        "Destacou-se na apresentação dos gráficos de função afim e auxiliou colegas com dúvidas durante a atividade prática.",
      status: OccurrenceStatus.RESOLVIDO,
      resolutionNote: "Elogio registrado na ficha escolar e enviado à família.",
      date: formatYmd(addDays(today, -5)),
    },
    {
      id: "seed-occ-7",
      studentId: pedroId,
      classroomId: "seed-classroom-9a-matematica",
      authorId: professorId,
      type: OccurrenceType.ATRASO,
      severity: OccurrenceSeverity.LEVE,
      description:
        "Ingressou na primeira aula da manhã após o segundo sinal por atraso no transporte.",
      status: OccurrenceStatus.PENDENTE,
      resolutionNote: null,
      date: formatYmd(addDays(today, -1)),
    },
  ];

  for (const occ of occurrenceSeeds) {
    await prisma.occurrence.upsert({
      where: { id: occ.id },
      update: {
        type: occ.type,
        severity: occ.severity,
        description: occ.description,
        status: occ.status,
        resolutionNote: occ.resolutionNote,
        date: occ.date,
      },
      create: occ,
    });
  }

  // 8. Notificacoes para mae@escola.com (2 pendentes de ciencia + 3 ja confirmadas) e aluno@escola.com
  const notificationSeeds = [
    {
      recipientId: guardianUserId,
      studentId: amandaId,
      type: NotificationType.FALTA,
      title: "Falta registrada — Amanda Ribeiro Tavares",
      message:
        `Foi registrada falta na aula de Matemática (1º Ano B) em ${recentWeekdays[8]}. Caso haja justificativa, envie pelo Portal da Família.`,
      referenceKey: "seed-notif-mae-amanda-falta",
      readAt: null,
      acknowledgedAt: null,
    },
    {
      recipientId: guardianUserId,
      studentId: pedroId,
      type: NotificationType.OCORRENCIA,
      title: "Registro de atraso — Pedro Ribeiro Tavares",
      message:
        "Pedro ingressou na primeira aula da manhã após o segundo sinal. Pedimos atenção ao horário de entrada.",
      referenceKey: "seed-notif-mae-pedro-atraso",
      readAt: null,
      acknowledgedAt: null,
    },
    {
      recipientId: guardianUserId,
      studentId: amandaId,
      type: NotificationType.OCORRENCIA,
      title: "Elogio pedagógico — Amanda Ribeiro Tavares",
      message:
        "Prof. Carlos registrou um elogio pelo destaque de Amanda na atividade prática de gráficos e colaboração com a turma.",
      referenceKey: "seed-notif-mae-amanda-elogio",
      readAt: addDays(today, -4),
      acknowledgedAt: addDays(today, -4),
    },
    {
      recipientId: guardianUserId,
      studentId: pedroId,
      type: NotificationType.OCORRENCIA,
      title: "Registro de material — Pedro Ribeiro Tavares",
      message:
        "Pedro compareceu sem caderno de atividades e régua na aula de geometria. Situação já acompanhada e resolvida.",
      referenceKey: "seed-notif-mae-pedro-material",
      readAt: addDays(today, -11),
      acknowledgedAt: addDays(today, -11),
    },
    {
      recipientId: guardianUserId,
      studentId: amandaId,
      type: NotificationType.COMUNICADO,
      title: "Medalha concedida — Destaque Acadêmico",
      message:
        "Amanda Ribeiro Tavares recebeu a medalha de Destaque Acadêmico pelo excelente desempenho nas avaliações do trimestre.",
      referenceKey: "seed-notif-mae-amanda-medalha",
      readAt: addDays(today, -2),
      acknowledgedAt: addDays(today, -2),
    },
    {
      recipientId: studentUserId,
      studentId: amandaId,
      type: NotificationType.COMUNICADO,
      title: "Parabéns! Nova medalha na sua estante",
      message:
        "Você recebeu a medalha Destaque Acadêmico em Matemática (1º Ano B).",
      referenceKey: "seed-notif-aluno-amanda-medalha",
      readAt: addDays(today, -2),
      acknowledgedAt: addDays(today, -2),
    },
    {
      recipientId: studentUserId,
      studentId: amandaId,
      type: NotificationType.COMUNICADO,
      title: "Nova tarefa publicada com prazo próximo",
      message:
        "Lista de Exercícios: Função Quadrática e Parábolas já está disponível em Tarefas & Materiais.",
      referenceKey: "seed-notif-aluno-amanda-tarefa",
      readAt: null,
      acknowledgedAt: null,
    },
  ];

  for (const notif of notificationSeeds) {
    await prisma.notification.upsert({
      where: {
        recipientId_referenceKey: {
          recipientId: notif.recipientId,
          referenceKey: notif.referenceKey,
        },
      },
      update: {
        title: notif.title,
        message: notif.message,
      },
      create: notif,
    });
  }

  // 9. Grade de Horarios semanal (segunda a sexta para ambas as turmas)
  const scheduleSeeds = [
    // 9o Ano A (Manha)
    { classroomId: "seed-classroom-9a-matematica", dayOfWeek: 1, lessonNumber: 1, startTime: "07:30", endTime: "08:20", room: "Sala 204" },
    { classroomId: "seed-classroom-9a-matematica", dayOfWeek: 1, lessonNumber: 2, startTime: "08:20", endTime: "09:10", room: "Sala 204" },
    { classroomId: "seed-classroom-9a-matematica", dayOfWeek: 2, lessonNumber: 3, startTime: "09:30", endTime: "10:20", room: "Sala 204" },
    { classroomId: "seed-classroom-9a-matematica", dayOfWeek: 3, lessonNumber: 1, startTime: "07:30", endTime: "08:20", room: "Lab. Exatas" },
    { classroomId: "seed-classroom-9a-matematica", dayOfWeek: 4, lessonNumber: 2, startTime: "08:20", endTime: "09:10", room: "Sala 204" },
    { classroomId: "seed-classroom-9a-matematica", dayOfWeek: 5, lessonNumber: 1, startTime: "07:30", endTime: "08:20", room: "Sala 204" },
    // 1o Ano B (Tarde)
    { classroomId: "seed-classroom-1b-matematica", dayOfWeek: 1, lessonNumber: 1, startTime: "13:30", endTime: "14:20", room: "Sala 108" },
    { classroomId: "seed-classroom-1b-matematica", dayOfWeek: 2, lessonNumber: 2, startTime: "14:20", endTime: "15:10", room: "Sala 108" },
    { classroomId: "seed-classroom-1b-matematica", dayOfWeek: 3, lessonNumber: 2, startTime: "14:20", endTime: "15:10", room: "Sala 108" },
    { classroomId: "seed-classroom-1b-matematica", dayOfWeek: 4, lessonNumber: 1, startTime: "13:30", endTime: "14:20", room: "Lab. Exatas" },
    { classroomId: "seed-classroom-1b-matematica", dayOfWeek: 5, lessonNumber: 3, startTime: "15:30", endTime: "16:20", room: "Sala 108" },
  ];

  for (const slot of scheduleSeeds) {
    await prisma.scheduleSlot.upsert({
      where: {
        classroomId_dayOfWeek_lessonNumber: {
          classroomId: slot.classroomId,
          dayOfWeek: slot.dayOfWeek,
          lessonNumber: slot.lessonNumber,
        },
      },
      update: {
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
      },
      create: slot,
    });
  }

  // 10. Calendario Escolar (proximos eventos do mes atual e proximo)
  const eventSeeds = [
    {
      id: "seed-event-1",
      title: "Prova Trimestral de Matemática — 1º Ano B",
      description: "Conteúdo: Função Afim, Função Quadrática e análise de gráficos.",
      date: formatYmd(addDays(today, 5)),
      type: SchoolEventType.PROVA,
      classroomId: "seed-classroom-1b-matematica",
      authorId: professorId,
    },
    {
      id: "seed-event-2",
      title: "Entrega do Trabalho de Geometria Aplicada — 9º Ano A",
      description: "Apresentação em dupla com medições reais usando Teorema de Pitágoras.",
      date: formatYmd(addDays(today, 7)),
      type: SchoolEventType.TRABALHO,
      classroomId: "seed-classroom-9a-matematica",
      authorId: professorId,
    },
    {
      id: "seed-event-3",
      title: "Reunião de Pais e Mestres — Fechamento Parcial",
      description: "Atendimento às famílias no auditório principal e salas de aula.",
      date: formatYmd(addDays(today, 12)),
      type: SchoolEventType.REUNIAO,
      classroomId: null,
      authorId: coordId,
    },
    {
      id: "seed-event-4",
      title: "Recesso Escolar / Feriado Institucional",
      description: "Não haverá aulas nem atendimento presencial na secretaria.",
      date: formatYmd(addDays(today, 19)),
      type: SchoolEventType.FERIADO,
      classroomId: null,
      authorId: adminId,
    },
    {
      id: "seed-event-5",
      title: "Mostra Científica e Feira de Matemática",
      description: "Exposição aberta às famílias com projetos das turmas do 9º Ano e Ensino Médio.",
      date: formatYmd(addDays(today, 28)),
      type: SchoolEventType.EVENTO,
      classroomId: null,
      authorId: coordId,
    },
  ];

  for (const ev of eventSeeds) {
    await prisma.schoolEvent.upsert({
      where: { id: ev.id },
      update: {
        title: ev.title,
        description: ev.description,
        date: ev.date,
        type: ev.type,
        classroomId: ev.classroomId,
      },
      create: ev,
    });
  }

  // 11. Planejamento de Aulas (6 topicos por turma: 4 MINISTRADO, 2 PLANEJADO)
  const lessonPlanSeeds = [
    // 9o Ano A
    { id: "seed-plan-9a-1", classroomId: "seed-classroom-9a-matematica", term: 2, plannedDate: recentWeekdays[0], topic: "Equações do 2º Grau e Fórmula de Bhaskara", objectives: "Resolver equações completas e incompletas com interpretação das raízes.", status: LessonPlanStatus.MINISTRADO },
    { id: "seed-plan-9a-2", classroomId: "seed-classroom-9a-matematica", term: 2, plannedDate: recentWeekdays[2], topic: "Teorema de Pitágoras e Relações Métricas", objectives: "Aplicar relações métricas em problemas de distância e geometria plana.", status: LessonPlanStatus.MINISTRADO },
    { id: "seed-plan-9a-3", classroomId: "seed-classroom-9a-matematica", term: 2, plannedDate: recentWeekdays[5], topic: "Semelhança de Triângulos e Teorema de Tales", objectives: "Identificar proporcionalidade entre segmentos e figuras semelhantes.", status: LessonPlanStatus.MINISTRADO },
    { id: "seed-plan-9a-4", classroomId: "seed-classroom-9a-matematica", term: 2, plannedDate: recentWeekdays[8], topic: "Razões Trigonométricas no Triângulo Retângulo", objectives: "Calcular seno, cosseno e tangente de ângulos notáveis.", status: LessonPlanStatus.MINISTRADO },
    { id: "seed-plan-9a-5", classroomId: "seed-classroom-9a-matematica", term: 2, plannedDate: formatYmd(addDays(today, 4)), topic: "Estatística Básica: Média, Moda e Mediana", objectives: "Analisar pesquisas escolares e construir tabelas de frequência.", status: LessonPlanStatus.PLANEJADO },
    { id: "seed-plan-9a-6", classroomId: "seed-classroom-9a-matematica", term: 2, plannedDate: formatYmd(addDays(today, 10)), topic: "Probabilidade em Eventos Compostos", objectives: "Calcular probabilidades em experimentos aleatórios simples e sucessivos.", status: LessonPlanStatus.PLANEJADO },
    // 1o Ano B
    { id: "seed-plan-1b-1", classroomId: "seed-classroom-1b-matematica", term: 2, plannedDate: recentWeekdays[0], topic: "Conjuntos Numéricos e Intervalos Reais", objectives: "Representar intervalos abertos e fechados na reta real.", status: LessonPlanStatus.MINISTRADO },
    { id: "seed-plan-1b-2", classroomId: "seed-classroom-1b-matematica", term: 2, plannedDate: recentWeekdays[3], topic: "Função Afim e Análise de Gráficos", objectives: "Relacionar coeficientes angular e linear a taxas de variação.", status: LessonPlanStatus.MINISTRADO },
    { id: "seed-plan-1b-3", classroomId: "seed-classroom-1b-matematica", term: 2, plannedDate: recentWeekdays[6], topic: "Função Quadrática: Vértice e Concavidade", objectives: "Determinar máximos, mínimos e raízes de funções do 2º grau.", status: LessonPlanStatus.MINISTRADO },
    { id: "seed-plan-1b-4", classroomId: "seed-classroom-1b-matematica", term: 2, plannedDate: recentWeekdays[9], topic: "Inequações do 1º e 2º Graus", objectives: "Resolver inequações por estudo do sinal e representar conjunto solução.", status: LessonPlanStatus.MINISTRADO },
    { id: "seed-plan-1b-5", classroomId: "seed-classroom-1b-matematica", term: 2, plannedDate: formatYmd(addDays(today, 5)), topic: "Progressões Aritméticas e Geométricas", objectives: "Identificar padrões numéricos e aplicar fórmulas de termo geral e soma.", status: LessonPlanStatus.PLANEJADO },
    { id: "seed-plan-1b-6", classroomId: "seed-classroom-1b-matematica", term: 2, plannedDate: formatYmd(addDays(today, 11)), topic: "Função Exponencial e Crescimento Populacional", objectives: "Interpretar fenômenos de crescimento exponencial em gráficos.", status: LessonPlanStatus.PLANEJADO },
  ];

  for (const plan of lessonPlanSeeds) {
    await prisma.lessonPlan.upsert({
      where: { id: plan.id },
      update: {
        plannedDate: plan.plannedDate,
        topic: plan.topic,
        objectives: plan.objectives,
        status: plan.status,
      },
      create: plan,
    });
  }

  // 12. Comunicados Oficiais (3 registros: 1 fixado IMPORTANTE, 1 NORMAL, 1 especifico de turma)
  const announcementSeeds = [
    {
      id: "seed-ann-1",
      title: "Calendário de Avaliações e Entrega de Boletins do 2º Trimestre",
      content:
        "Prezadas famílias e estudantes, informamos que o período de avaliações parciais segue aberto nas próximas semanas. Acompanhe as datas exatas no Calendário Escolar do portal e mantenha as confirmações de leitura em dia na aba Avisos.",
      priority: AnnouncementPriority.IMPORTANTE,
      pinned: true,
      classroomId: null,
      authorId: adminId,
    },
    {
      id: "seed-ann-2",
      title: "Horários de Plantão de Dúvidas de Matemática no Contraturno",
      content:
        "Todas as quartas-feiras, das 14h às 15h30 na Biblioteca, os estudantes podem participar do plantão gratuito de revisão com o Prof. Carlos Eduardo. Não é necessário agendamento prévio.",
      priority: AnnouncementPriority.NORMAL,
      pinned: false,
      classroomId: null,
      authorId: coordId,
    },
    {
      id: "seed-ann-3",
      title: "Material para a oficina prática de gráficos — 1º Ano B",
      content:
        "Para a próxima aula no Laboratório de Exatas, pedimos que os estudantes tragam folha milimetrada, régua e calculadora científica simples.",
      priority: AnnouncementPriority.NORMAL,
      pinned: false,
      classroomId: "seed-classroom-1b-matematica",
      authorId: professorId,
    },
  ];

  for (const ann of announcementSeeds) {
    await prisma.announcement.upsert({
      where: { id: ann.id },
      update: {
        title: ann.title,
        content: ann.content,
        priority: ann.priority,
        pinned: ann.pinned,
        classroomId: ann.classroomId,
      },
      create: ann,
    });
  }

  // 13. Justificativa de Falta PENDENTE enviada por mae@escola.com para Amanda
  if (amandaPendingAbsenceAttendanceId) {
    await prisma.absenceJustification.upsert({
      where: { attendanceId: amandaPendingAbsenceAttendanceId },
      update: {
        reason:
          "Consulta odontológica de acompanhamento agendada no período da tarde. Atestado impresso entregue na agenda da estudante.",
        status: JustificationStatus.PENDENTE,
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
      },
      create: {
        attendanceId: amandaPendingAbsenceAttendanceId,
        studentId: amandaId,
        guardianId: guardianUserId,
        reason:
          "Consulta odontológica de acompanhamento agendada no período da tarde. Atestado impresso entregue na agenda da estudante.",
        status: JustificationStatus.PENDENTE,
      },
    });
  }

  // 14. Mapa de Sala do 1o Ano B (grid 5x6 organizado para os 10 estudantes)
  const students1B = studentRecordsByClass.get("seed-classroom-1b-matematica") ?? [];
  const seatPositions = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 3 },
    { row: 0, col: 4 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 1, col: 4 },
    { row: 2, col: 1 },
    { row: 2, col: 3 },
  ];

  // Limpa posicoes antigas da turma 1B antes de aplicar o espelho padrao idempotente
  await prisma.seatAssignment.deleteMany({
    where: { classroomId: "seed-classroom-1b-matematica" },
  });

  for (let i = 0; i < students1B.length && i < seatPositions.length; i += 1) {
    const seatedStudent = students1B[i];
    const seatPos = seatPositions[i];
    if (!seatedStudent || !seatPos) {
      continue;
    }
    await prisma.seatAssignment.create({
      data: {
        classroomId: "seed-classroom-1b-matematica",
        studentId: seatedStudent.id,
        row: seatPos.row,
        col: seatPos.col,
      },
    });
  }

  // 15. Tarefas & Materiais (3 atividades + entregas)
  const homeworkSeeds = [
    {
      id: "seed-hw-1",
      classroomId: "seed-classroom-1b-matematica",
      authorId: professorId,
      title: "Lista de Exercícios: Função Quadrática e Parábolas",
      description:
        "Resolver os exercícios 1 a 10 da apostila (páginas 42 e 43), esboçando o gráfico e identificando o vértice em cada item.",
      dueDate: formatYmd(addDays(today, 4)),
      resourceUrl: "https://pt.khanacademy.org/math/algebra",
      type: HomeworkType.TAREFA,
    },
    {
      id: "seed-hw-2",
      classroomId: "seed-classroom-1b-matematica",
      authorId: professorId,
      title: "Roteiro de Revisão para Prova Trimestral",
      description:
        "Resumo comentado dos tópicos de Função Afim, estudo de sinais e gráficos. Leitura recomendada antes da avaliação.",
      dueDate: formatYmd(addDays(today, 5)),
      resourceUrl: "https://portaldaobmep.impa.br/",
      type: HomeworkType.MATERIAL,
    },
    {
      id: "seed-hw-3",
      classroomId: "seed-classroom-9a-matematica",
      authorId: professorId,
      title: "Trabalho em Dupla: Aplicações do Teorema de Pitágoras",
      description:
        "Medir dois objetos ou espaços da escola e apresentar o cálculo da diagonal usando o Teorema de Pitágoras com desenho em escala.",
      dueDate: formatYmd(addDays(today, 7)),
      resourceUrl: null,
      type: HomeworkType.TRABALHO,
    },
  ];

  for (const hw of homeworkSeeds) {
    await prisma.homework.upsert({
      where: { id: hw.id },
      update: {
        title: hw.title,
        description: hw.description,
        dueDate: hw.dueDate,
        resourceUrl: hw.resourceUrl,
        type: hw.type,
      },
      create: hw,
    });
  }

  const submissionSeeds = [
    {
      homeworkId: "seed-hw-1",
      studentId: amandaId,
      status: HomeworkSubmissionStatus.CONFERIDO,
      studentNote: "Todos os 10 exercícios resolvidos no caderno com gráficos.",
      teacherFeedback: "Excelente organização nos cálculos do vértice!",
      submittedAt: addDays(today, -1),
    },
    {
      homeworkId: "seed-hw-1",
      studentId: studentIdsByReg.get("2026100203")!,
      status: HomeworkSubmissionStatus.ENTREGUE,
      studentNote: "Concluído e conferido com a folha milimetrada.",
      teacherFeedback: null,
      submittedAt: addDays(today, -1),
    },
    {
      homeworkId: "seed-hw-1",
      studentId: studentIdsByReg.get("2026100205")!,
      status: HomeworkSubmissionStatus.ENTREGUE,
      studentNote: "Entrega realizada em sala.",
      teacherFeedback: null,
      submittedAt: today,
    },
    {
      homeworkId: "seed-hw-3",
      studentId: pedroId,
      status: HomeworkSubmissionStatus.ENTREGUE,
      studentNote: "Medimos a quadra coberta e a mesa do laboratório.",
      teacherFeedback: null,
      submittedAt: today,
    },
    {
      homeworkId: "seed-hw-3",
      studentId: top9aId,
      status: HomeworkSubmissionStatus.CONFERIDO,
      studentNote: "Trabalho entregue com plantas em escala.",
      teacherFeedback: "Apresentação muito clara e precisa.",
      submittedAt: addDays(today, -1),
    },
  ];

  for (const sub of submissionSeeds) {
    await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId: sub.homeworkId,
          studentId: sub.studentId,
        },
      },
      update: {
        status: sub.status,
        studentNote: sub.studentNote,
        teacherFeedback: sub.teacherFeedback,
        submittedAt: sub.submittedAt,
      },
      create: sub,
    });
  }

  // 16. Medalhas de Merito (3 medalhas, incluindo Amanda e Pedro)
  const badgeSeeds = [
    {
      id: "seed-badge-1",
      studentId: amandaId,
      classroomId: "seed-classroom-1b-matematica",
      category: BadgeCategory.DESTAQUE_ACADEMICO,
      title: "Destaque Acadêmico do Trimestre",
      reason:
        "Manteve média acima de 8,8 em Matemática e colaborou ativamente com os colegas na oficina de gráficos.",
      awardedById: professorId,
    },
    {
      id: "seed-badge-2",
      studentId: top9aId,
      classroomId: "seed-classroom-9a-matematica",
      category: BadgeCategory.FREQUENCIA_100,
      title: "Frequência Exemplar 100%",
      reason:
        "Presença integral em todas as aulas registradas do período letivo sem atrasos.",
      awardedById: coordId,
    },
    {
      id: "seed-badge-3",
      studentId: pedroId,
      classroomId: "seed-classroom-9a-matematica",
      category: BadgeCategory.EVOLUCAO,
      title: "Evolução em Geometria",
      reason:
        "Apresentou ótimo avanço nas avaliações do 2º trimestre após participar das atividades de revisão.",
      awardedById: professorId,
    },
  ];

  for (const badge of badgeSeeds) {
    await prisma.studentBadge.upsert({
      where: { id: badge.id },
      update: {
        category: badge.category,
        title: badge.title,
        reason: badge.reason,
      },
      create: badge,
    });
  }

  // 17. Atendimento / Chat Escola <-> Familia (1 conversa ativa com 3 mensagens)
  await prisma.messageThread.upsert({
    where: { id: "seed-thread-1" },
    update: {
      subject: "Dúvida sobre roteiro de estudos para a prova de Matemática",
      status: ThreadStatus.ABERTO,
      staffId: professorId,
    },
    create: {
      id: "seed-thread-1",
      subject: "Dúvida sobre roteiro de estudos para a prova de Matemática",
      studentId: amandaId,
      guardianId: guardianUserId,
      staffId: professorId,
      status: ThreadStatus.ABERTO,
    },
  });

  const messageSeeds = [
    {
      id: "seed-msg-1",
      threadId: "seed-thread-1",
      senderId: guardianUserId,
      content:
        "Olá, Prof. Carlos! A Amanda comentou sobre a prova da semana que vem. O conteúdo de Progressões Aritméticas já vai cair nesta avaliação?",
      readAt: addDays(today, -2),
      createdAt: addDays(today, -2),
    },
    {
      id: "seed-msg-2",
      threadId: "seed-thread-1",
      senderId: professorId,
      content:
        "Olá, Cláudia! Nesta prova cobraremos apenas Função Afim, Função Quadrática e análise de gráficos. Já publiquei o roteiro completo em Tarefas & Materiais.",
      readAt: addDays(today, -1),
      createdAt: addDays(today, -1),
    },
    {
      id: "seed-msg-3",
      threadId: "seed-thread-1",
      senderId: guardianUserId,
      content:
        "Perfeito, muito obrigada pelo retorno rápido! Também enviei pelo portal a justificativa da consulta odontológica dela.",
      readAt: null,
      createdAt: today,
    },
  ];

  for (const msg of messageSeeds) {
    await prisma.directMessage.upsert({
      where: { id: msg.id },
      update: {
        content: msg.content,
        readAt: msg.readAt,
      },
      create: msg,
    });
  }

  // 18. Reuniao Pedagogica CONVOCADA para mae@escola.com confirmar ao vivo
  await prisma.meeting.upsert({
    where: { id: "seed-meeting-1" },
    update: {
      title: "Acompanhamento Pedagógico do 2º Trimestre — Pedro",
      date: formatYmd(addDays(today, 6)),
      time: "16:30",
      mode: MeetingMode.PRESENCIAL,
      locationOrLink: "Sala da Coordenação Pedagógica (Bloco A)",
      notes:
        "Conversa breve para compartilhar a evolução do Pedro em Matemática e alinhar a rotina de horários da manhã.",
      status: MeetingStatus.CONVOCADA,
      guardianNote: null,
    },
    create: {
      id: "seed-meeting-1",
      title: "Acompanhamento Pedagógico do 2º Trimestre — Pedro",
      studentId: pedroId,
      guardianId: guardianUserId,
      organizerId: coordId,
      date: formatYmd(addDays(today, 6)),
      time: "16:30",
      mode: MeetingMode.PRESENCIAL,
      locationOrLink: "Sala da Coordenação Pedagógica (Bloco A)",
      notes:
        "Conversa breve para compartilhar a evolução do Pedro em Matemática e alinhar a rotina de horários da manhã.",
      status: MeetingStatus.CONVOCADA,
    },
  });

  // 19. Logs de Auditoria LGPD (6 registros recentes)
  const auditSeeds = [
    {
      id: "seed-audit-1",
      userId: adminId,
      userName: "Ana Paula Mendonça",
      userRole: "ADMIN",
      action: "ALTERAR_CONFIG",
      entity: "SchoolConfig",
      entityId: "1",
      details: "Configurou identidade institucional e ano letivo 2026 no portal.",
      createdAt: addDays(today, -10),
    },
    {
      id: "seed-audit-2",
      userId: adminId,
      userName: "Ana Paula Mendonça",
      userRole: "ADMIN",
      action: "CRIAR_TURMA",
      entity: "Classroom",
      entityId: "seed-classroom-9a-matematica",
      details: "Cadastrou turma 9º Ano A — Matemática (Manhã) com 10 estudantes.",
      createdAt: addDays(today, -8),
    },
    {
      id: "seed-audit-3",
      userId: coordId,
      userName: "Mariana Costa Ferreira",
      userRole: "COORDENACAO",
      action: "VINCULAR_FAMILIA",
      entity: "GuardianStudent",
      entityId: amandaId,
      details: "Vinculou Cláudia Ribeiro Tavares como responsável de Amanda e Pedro.",
      createdAt: addDays(today, -6),
    },
    {
      id: "seed-audit-4",
      userId: professorId,
      userName: "Prof. Carlos Eduardo Silva",
      userRole: "PROFESSOR",
      action: "LANCAR_NOTAS",
      entity: "Assessment",
      entityId: "seed-assess-seed-classroom-1b-matematica-t2-pratica",
      details: "Lançou notas da Atividade Prática de Gráficos no 1º Ano B.",
      createdAt: addDays(today, -4),
    },
    {
      id: "seed-audit-5",
      userId: coordId,
      userName: "Mariana Costa Ferreira",
      userRole: "COORDENACAO",
      action: "CONVOCAR_REUNIAO",
      entity: "Meeting",
      entityId: "seed-meeting-1",
      details: "Agendou reunião pedagógica presencial com Cláudia Ribeiro Tavares.",
      createdAt: addDays(today, -2),
    },
    {
      id: "seed-audit-6",
      userId: adminId,
      userName: "Ana Paula Mendonça",
      userRole: "ADMIN",
      action: "EXPORTAR_BACKUP",
      entity: "SystemBackup",
      entityId: "snapshot-2026",
      details: "Realizou exportação preventiva de backup estruturado JSON (LGPD).",
      createdAt: addDays(today, -1),
    },
  ];

  for (const log of auditSeeds) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {
        details: log.details,
        createdAt: log.createdAt,
      },
      create: log,
    });
  }

  console.info(
    `Seed "Escola Viva" concluido com sucesso: ${DEFAULT_USERS.length} usuarios, ${DEFAULT_CLASSROOMS.length} turmas, ${studentIdsByReg.size} alunos, ${totalLessons} aulas, ${totalAssessments} avaliacoes, ${occurrenceSeeds.length} ocorrencias, ${notificationSeeds.length} notificacoes, ${scheduleSeeds.length} horarios, ${eventSeeds.length} eventos, ${lessonPlanSeeds.length} planejamentos, ${announcementSeeds.length} comunicados, ${homeworkSeeds.length} tarefas, ${badgeSeeds.length} medalhas, 1 justificativa pendente, 1 conversa ativa, 1 reuniao convocada e ${auditSeeds.length} logs de auditoria.`
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
