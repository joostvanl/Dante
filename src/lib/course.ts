import type { Course, Enrollee, Teacher } from "./types";
import { isEnrolleeForCourse } from "./aurora";

export function courseSpots(course: Course, enrollees: Enrollee[]) {
  const max = Number(course.fields.maxParticipants) || 0;
  const taken = enrollees.filter((e) =>
    isEnrolleeForCourse(e.slug, course.slug),
  ).length;
  const remaining = Math.max(0, max - taken);
  const open = Boolean(course.fields.enrollmentOpen) && remaining > 0;
  return { max, taken, remaining, open };
}

export function teacherBySlug(
  teachers: Teacher[],
  slug: string | undefined,
): Teacher | null {
  if (!slug) return null;
  return teachers.find((t) => t.slug === slug) ?? null;
}
