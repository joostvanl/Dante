import { redirect } from "next/navigation";
import { AttendanceBoard } from "@/components/AttendanceBoard";
import { isTeacherAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AanwezigheidPage() {
  if (!(await isTeacherAuthenticated())) {
    redirect("/docent");
  }

  return (
    <main>
      <div className="panel">
        <AttendanceBoard />
      </div>
    </main>
  );
}
