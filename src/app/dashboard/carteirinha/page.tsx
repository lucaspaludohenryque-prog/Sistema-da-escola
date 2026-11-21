import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isStaffRole } from "@/features/auth";
import { StudentCardView } from "@/features/checkin/components/StudentCardView";
import { getStudentCardsForUser } from "@/features/checkin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carteirinha Estudantil Digital",
  description:
    "Carteirinha estudantil oficial com QR Code para leitura instantânea na portaria escolar.",
};

interface CarteirinhaPageProps {
  searchParams: Promise<{ studentId?: string; classroomId?: string }>;
}

export default async function CarteirinhaPage({
  searchParams,
}: CarteirinhaPageProps): Promise<React.JSX.Element> {
  const [user, params] = await Promise.all([
    getAuthenticatedUser(),
    searchParams,
  ]);

  if (!user) {
    redirect("/login");
  }

  const cards = await getStudentCardsForUser(user, {
    studentId: params.studentId,
    classroomId: params.classroomId,
  });

  const backHref =
    isStaffRole(user.role) && cards[0]?.classroomId
      ? `/dashboard/turmas/${cards[0].classroomId}`
      : undefined;

  return (
    <StudentCardView
      cards={cards}
      userRole={user.role}
      backHref={backHref}
    />
  );
}
