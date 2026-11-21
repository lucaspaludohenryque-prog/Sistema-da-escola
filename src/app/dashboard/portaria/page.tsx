import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, getDefaultDashboardPath, isStaffRole } from "@/features/auth";
import { GateScannerView } from "@/features/checkin/components/GateScannerView";
import { getTodayCheckInsForUser } from "@/features/checkin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portaria & Leitor QR Code",
  description:
    "Leitura de Carteirinha Digital pela câmera ou matrícula (CGM) para controle de entradas, atrasos e saídas.",
};

export default async function PortariaPage(): Promise<React.JSX.Element> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  if (!isStaffRole(user.role)) {
    redirect(getDefaultDashboardPath(user.role));
  }

  const initialData = await getTodayCheckInsForUser(user);

  return <GateScannerView initialData={initialData} />;
}
