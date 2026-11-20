import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/features/auth";

export default async function HomePage(): Promise<never> {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
