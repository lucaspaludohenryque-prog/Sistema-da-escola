import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
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
    redirect("/dashboard/turmas");
  }

  return <StudentReportView report={result.report} />;
}
