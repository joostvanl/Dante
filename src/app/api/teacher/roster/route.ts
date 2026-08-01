import { NextResponse } from "next/server";
import { isTeacherAuthenticated } from "@/lib/auth";
import {
  courseSlugFromEnrollee,
  isEnrolleeForCourse,
  listAttendance,
  listCourseDays,
  listCourses,
  listEnrollees,
} from "@/lib/aurora";

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return NextResponse.json({ message: "Niet ingelogd." }, { status: 401 });
  }

  const [courses, days, enrollees, attendance] = await Promise.all([
    listCourses(),
    listCourseDays(),
    listEnrollees(),
    listAttendance(),
  ]);

  const presentByKey: Record<string, boolean> = {};
  for (const row of attendance) {
    const key = `${row.fields.enrolleeSlug}__${row.fields.courseDaySlug}`;
    presentByKey[key] = Boolean(row.fields.present);
  }

  const courseList = courses
    .filter((c) => c.slug !== "default")
    .map((c) => {
      const count = enrollees.filter((e) =>
        isEnrolleeForCourse(e.slug, c.slug),
      ).length;
      return {
        slug: c.slug,
        title: c.fields.title,
        level: c.fields.level ?? null,
        season: c.fields.season ?? null,
        enrolleeCount: count,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "nl"));

  return NextResponse.json({
    courses: courseList,
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
      courseSlug: courseSlugFromEnrollee(e.slug),
    })),
    presentByKey,
  });
}
