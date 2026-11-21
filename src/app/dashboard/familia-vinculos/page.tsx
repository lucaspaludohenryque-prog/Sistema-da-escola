import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, getDefaultDashboardPath } from "@/features/auth";
import { canManageClassrooms } from "@/features/classrooms";
import { listAdminFamilyLinks } from "@/features/family";
import { FamilyLinksAdminView } from "@/features/family/components/FamilyLinksAdminView";

export const metadata: Metadata = {
  title: "Vínculos Família",
  description: "Gestão de vínculos entre responsáveis, alunos e contas de acesso.",
};

export default async function FamiliaVinculosPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (!canManageClassrooms(user.role)) {
    redirect(getDefaultDashboardPath(user.role));
  }

  const initialData = await listAdminFamilyLinks();

  return <FamilyLinksAdminView initialData={initialData} />;
}
