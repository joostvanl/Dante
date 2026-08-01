import { redirect } from "next/navigation";
import { TeacherLoginForm } from "@/components/TeacherLoginForm";
import { isTeacherAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DocentPage() {
  if (await isTeacherAuthenticated()) {
    redirect("/docent/aanwezigheid");
  }

  return (
    <main>
      <TeacherLoginForm />
    </main>
  );
}
