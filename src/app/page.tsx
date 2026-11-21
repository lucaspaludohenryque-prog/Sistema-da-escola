import { redirect } from "next/navigation";
import { getAuthenticatedUser, getDefaultDashboardPath } from "@/features/auth";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<never> {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(getDefaultDashboardPath(user.role));
  }

  redirect("/login");
}
