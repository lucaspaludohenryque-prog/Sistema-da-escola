import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, getDefaultDashboardPath } from "@/features/auth";
import { getFamilyOverviewForUser } from "@/features/family";
import { FamilyPortalView } from "@/features/family/components/FamilyPortalView";

export const metadata: Metadata = {
  title: "Meu Painel",
  description: "Consulta somente leitura de notas, frequência e ocorrências do estudante.",
};

export default async function AlunoPortalPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ALUNO") {
    redirect(getDefaultDashboardPath(user.role));
  }

  const overview = await getFamilyOverviewForUser(user);
  if (!overview) {
    redirect("/login");
  }

  return <FamilyPortalView overview={overview} userName={user.name} />;
}
