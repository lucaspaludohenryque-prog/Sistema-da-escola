import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getAuthenticatedUser,
  getDefaultDashboardPath,
  isStaffRole,
} from "@/features/auth";
import { RadarView } from "@/features/radar/components/RadarView";
import { getRadarAnalyticsForUser } from "@/features/radar/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Radar Pedagógico",
  description:
    "Análise determinística de risco de evasão, queda de desempenho e ocorrências com recomendações de ação.",
};

export default async function RadarPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }
  if (!isStaffRole(user.role)) {
    redirect(getDefaultDashboardPath(user.role));
  }

  const data = await getRadarAnalyticsForUser(user);

  return <RadarView data={data} />;
}
