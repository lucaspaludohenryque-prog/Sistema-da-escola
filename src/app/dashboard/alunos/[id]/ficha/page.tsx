import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser, getDefaultDashboardPath } from "@/features/auth";
import { getStudentReportForUser } from "@/features/reports";
import { StudentReportView } from "@/features/reports/components/StudentReportView";

interface StudentReportPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Ficha Individual e Boletim",
  description: "Relatório pedagógico completo do estudante pronto para impressão e PDF.",
};

export default async function StudentReportPage({
  params,
}: StudentReportPageProps): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const result = await getStudentReportForUser(id, user);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "forbidden") {
    redirect(getDefaultDashboardPath(user.role));
  }

  const backHref =
    user.role === "RESPONSAVEL"
      ? "/dashboard/familia"
      : user.role === "ALUNO"
        ? "/dashboard/aluno"
        : `/dashboard/turmas/${result.report.classroom.id}`;

  const backLabel =
    user.role === "RESPONSAVEL"
      ? "Voltar para Painel da Família"
      : user.role === "ALUNO"
        ? "Voltar para Meu Painel"
        : `Voltar para ${result.report.classroom.name}`;

  return (
    <StudentReportView
      report={result.report}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
