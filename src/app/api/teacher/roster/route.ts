import { NextResponse } from "next/server";
import { isTeacherAuthenticated } from "@/lib/auth";
import {
  listAttendance,
  listCourseDays,
  listEnrollees,
} from "@/lib/aurora";

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return NextResponse.json({ message: "Niet ingelogd." }, { status: 401 });
  }

  const [days, enrollees, attendance] = await Promise.all([
    listCourseDays(),
    listEnrollees(),
    listAttendance(),
  ]);

  const presentByKey: Record<string, boolean> = {};
  for (const row of attendance) {
    const key = `${row.fields.enrolleeSlug}__${row.fields.courseDaySlug}`;
    presentByKey[key] = Boolean(row.fields.present);
  }

  return NextResponse.json({
    days: days.map((d) => ({
      slug: d.slug,
      title: d.fields.title,
      date: d.fields.date,
      sortOrder: d.fields.sortOrder,
    })),
    enrollees: enrollees.map((e) => ({
      slug: e.slug,
      name: e.fields.name,
      email: e.fields.email,
    })),
    presentByKey,
  });
}
