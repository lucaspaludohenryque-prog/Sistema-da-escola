import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";
import { getSchoolConfig } from "@/features/school-config";
import { SchoolConfigView } from "@/features/school-config/components/SchoolConfigView";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Identidade institucional, brasão e dados oficiais da escola.",
};

export default async function ConfiguracoesPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const config = await getSchoolConfig();

  return <SchoolConfigView initialConfig={config} />;
}
