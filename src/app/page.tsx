import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<never> {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
