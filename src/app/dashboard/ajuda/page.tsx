import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { HelpCenterView } from "@/features/help/components/HelpCenterView";
import {
  getDefaultSchoolConfig,
  getSchoolConfig,
} from "@/features/school-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Central de Ajuda",
  description:
    "Guias passo a passo, primeiros passos e perguntas frequentes do Registro de Classe Online.",
};

export default async function AjudaPage(): Promise<React.JSX.Element> {
  const [user, schoolConfig] = await Promise.all([
    getAuthenticatedUser(),
    getSchoolConfig().catch(() => getDefaultSchoolConfig()),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <HelpCenterView userRole={user.role} schoolName={schoolConfig.name} />
  );
}
