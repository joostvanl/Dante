import { NextResponse } from "next/server";
import { isTeacherAuthenticated } from "@/lib/auth";
import {
  buildCourseSlugByDaySlug,
  isEnrolleeForCourse,
  listAttendance,
  listCourseDays,
  listCourses,
  listEnrollees,
  resolveDayCourseSlug,
} from "@/lib/aurora";
import { toCsv } from "@/lib/csv";
import { formatDay } from "@/lib/format";

function attendanceKey(enrolleeSlug: string, daySlug: string) {
  return `${enrolleeSlug}__${daySlug}`;
}

export async function GET(request: Request) {
  if (!(await isTeacherAuthenticated())) {
    return NextResponse.json({ message: "Niet ingelogd." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseFilter = (searchParams.get("course") ?? "").trim();

  const [courses, days, enrollees, attendance] = await Promise.all([
    listCourses(),
    listCourseDays(),
    listEnrollees(),
    listAttendance(),
  ]);

  const courseBySlug = new Map(
    courses.map((c) => [c.slug, c.fields.title ?? c.slug]),
  );
  const courseSlugByDay = buildCourseSlugByDaySlug(courses);

  const presentByKey = new Map<string, boolean>();
  for (const row of attendance) {
    presentByKey.set(
      attendanceKey(row.fields.enrolleeSlug, row.fields.courseDaySlug),
      Boolean(row.fields.present),
    );
  }

  const courseSlugs = courseFilter
    ? [courseFilter]
    : courses.filter((c) => c.slug !== "default").map((c) => c.slug);

  const header = [
    "Cursus",
    "Cursus-slug",
    "Naam",
    "E-mail",
    "Telefoon",
    "Cursusdag",
    "Datum",
    "Aanwezig",
  ];

  const dataRows: string[][] = [];

  for (const slug of courseSlugs) {
    const courseTitle = courseBySlug.get(slug) ?? slug;
    const courseDays = days
      .filter((d) => resolveDayCourseSlug(d, courseSlugByDay) === slug)
      .sort(
        (a, b) => (a.fields.sortOrder ?? 0) - (b.fields.sortOrder ?? 0),
      );
    const courseEnrollees = enrollees
      .filter((e) => isEnrolleeForCourse(e.slug, slug))
      .sort((a, b) =>
        (a.fields.name ?? "").localeCompare(b.fields.name ?? "", "nl"),
      );

    for (const person of courseEnrollees) {
      if (courseDays.length === 0) {
        dataRows.push([
          courseTitle,
          slug,
          person.fields.name ?? "",
          person.fields.email ?? "",
          person.fields.phone ?? "",
          "",
          "",
          "",
        ]);
        continue;
      }

      for (const day of courseDays) {
        const present = presentByKey.get(
          attendanceKey(person.slug, day.slug),
        );
        dataRows.push([
          courseTitle,
          slug,
          person.fields.name ?? "",
          person.fields.email ?? "",
          person.fields.phone ?? "",
          day.fields.title ?? day.slug,
          formatDay(day.fields.date),
          present === true ? "Ja" : present === false ? "Nee" : "",
        ]);
      }
    }
  }

  const csv = toCsv([header, ...dataRows]);
  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = courseFilter
    ? `aanwezigheid-${courseFilter}`
    : "aanwezigheid-alle-cursussen";
  const filename = `${fileBase}-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
