import { getPublicEnv, getServerEnv } from "./env";
import type {
  Attendance,
  Course,
  CourseDay,
  Enrollee,
  FlatEntry,
  Paginated,
  SiteSettings,
  Teacher,
} from "./types";

const FETCH_TIMEOUT_MS = 8_000;

function withTimeout(init?: RequestInit): RequestInit {
  const signal =
    init?.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS);
  return { ...init, signal };
}

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiUrl, siteKey } = getPublicEnv();
  const res = await fetch(`${apiUrl}${path}`, {
    ...withTimeout(init),
    headers: {
      "x-site-key": siteKey,
      ...(init?.headers ?? {}),
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Aurora public ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiUrl, managementToken } = getServerEnv();
  const res = await fetch(`${apiUrl}${path}`, {
    ...withTimeout(init),
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Aurora admin ${res.status}: ${text}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await publicFetch<SiteSettings>(
      "/api/v1/content-types/site_settings/entries/default",
    );
  } catch {
    return null;
  }
}

export async function listCourses(): Promise<Course[]> {
  try {
    const data = await publicFetch<Paginated<Course>>(
      "/api/v1/content-types/course/entries?limit=100",
    );
    return data.items;
  } catch {
    return [];
  }
}

export async function getCourse(slug: string): Promise<Course | null> {
  try {
    return await publicFetch<Course>(
      `/api/v1/content-types/course/entries/${encodeURIComponent(slug)}`,
    );
  } catch {
    return null;
  }
}

/** Normalize a relation / slug field to a single slug string. */
export function relationSlug(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (
    value &&
    typeof value === "object" &&
    "slug" in value &&
    typeof (value as { slug: unknown }).slug === "string"
  ) {
    const trimmed = (value as { slug: string }).slug.trim();
    return trimmed || null;
  }
  return null;
}

/** Normalize a multi-relation field to slug strings. */
export function relationSlugs(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => relationSlug(item))
      .filter((slug): slug is string => Boolean(slug));
  }
  const one = relationSlug(value);
  return one ? [one] : [];
}

/** Prefer relation `course`, fall back to legacy `courseSlug`. */
export function dayCourseSlug(day: CourseDay): string | null {
  return (
    relationSlug(day.fields.course) ?? relationSlug(day.fields.courseSlug)
  );
}

/** Index day slug → course slug from each course's `courseDays` relations. */
export function buildCourseSlugByDaySlug(
  courses: Course[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const course of courses) {
    for (const daySlug of relationSlugs(course.fields.courseDays)) {
      map.set(daySlug, course.slug);
    }
  }
  return map;
}

/** Resolve a day's course via day fields, then via inverse `courseDays`. */
export function resolveDayCourseSlug(
  day: CourseDay,
  courseSlugByDaySlug?: Map<string, string>,
): string | null {
  return dayCourseSlug(day) ?? courseSlugByDaySlug?.get(day.slug) ?? null;
}

export async function listTeachers(): Promise<Teacher[]> {
  try {
    const data = await publicFetch<Paginated<Teacher>>(
      "/api/v1/content-types/teacher/entries?limit=100",
    );
    return [...data.items].sort((a, b) =>
      (a.fields.name ?? "").localeCompare(b.fields.name ?? "", "nl"),
    );
  } catch {
    return [];
  }
}

export async function getTeacher(slug: string): Promise<Teacher | null> {
  try {
    return await publicFetch<Teacher>(
      `/api/v1/content-types/teacher/entries/${encodeURIComponent(slug)}`,
    );
  } catch {
    return null;
  }
}

export async function getCourseDay(slug: string): Promise<CourseDay | null> {
  try {
    return await publicFetch<CourseDay>(
      `/api/v1/content-types/course_day/entries/${encodeURIComponent(slug)}`,
    );
  } catch {
    return null;
  }
}

export async function listCourseDays(
  courseSlug?: string,
): Promise<CourseDay[]> {
  try {
    const data = await publicFetch<Paginated<CourseDay>>(
      "/api/v1/content-types/course_day/entries?limit=100",
    );
    const items = courseSlug
      ? data.items.filter((d) => dayCourseSlug(d) === courseSlug)
      : data.items;
    return [...items].sort(
      (a, b) => (a.fields.sortOrder ?? 0) - (b.fields.sortOrder ?? 0),
    );
  } catch {
    return [];
  }
}

/**
 * Days for a course: resolve `fields.courseDays` slugs when set,
 * otherwise fall back to listing days linked via `course` / `courseSlug`.
 */
export async function listCourseDaysForCourse(
  course: Course,
): Promise<CourseDay[]> {
  const related = relationSlugs(course.fields.courseDays);
  if (related.length > 0) {
    const days = await Promise.all(related.map((slug) => getCourseDay(slug)));
    return days
      .filter((d): d is CourseDay => d != null)
      .sort(
        (a, b) => (a.fields.sortOrder ?? 0) - (b.fields.sortOrder ?? 0),
      );
  }
  return listCourseDays(course.slug);
}

export async function listEnrollees(): Promise<Enrollee[]> {
  try {
    const data = await publicFetch<Paginated<Enrollee>>(
      "/api/v1/content-types/enrollee/entries?limit=100",
    );
    return [...data.items].sort((a, b) =>
      a.fields.name.localeCompare(b.fields.name, "nl"),
    );
  } catch {
    return [];
  }
}

export async function listAttendance(): Promise<Attendance[]> {
  try {
    const data = await publicFetch<Paginated<Attendance>>(
      "/api/v1/content-types/attendance/entries?limit=100",
    );
    return data.items;
  } catch {
    return [];
  }
}

export function slugifyEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Enrollee has no courseSlug field — encode course in the entry slug. */
export function enrolleeSlugForCourse(
  email: string,
  courseSlug: string,
): string {
  const emailPart = slugifyEmail(email);
  return `${emailPart}-for-${courseSlug}`.slice(0, 120);
}

export function isEnrolleeForCourse(
  enrolleeSlug: string,
  courseSlug: string,
): boolean {
  return enrolleeSlug.endsWith(`-for-${courseSlug}`);
}

export function courseSlugFromEnrollee(enrolleeSlug: string): string | null {
  const marker = "-for-";
  const i = enrolleeSlug.indexOf(marker);
  if (i < 0) return null;
  const courseSlug = enrolleeSlug.slice(i + marker.length);
  return courseSlug || null;
}

export function attendanceSlug(enrolleeSlug: string, daySlug: string): string {
  return `${enrolleeSlug}-at-${daySlug}`;
}

export async function adminListEntries<TFields>(
  apiId: string,
  status?: "draft" | "published",
): Promise<FlatEntry<TFields>[]> {
  const qs = new URLSearchParams({ limit: "100" });
  if (status) qs.set("status", status);
  const data = await adminFetch<Paginated<FlatEntry<TFields>>>(
    `/api/v1/admin/content-types/${apiId}/entries?${qs}`,
  );
  return data.items;
}

export async function adminCreateEntry(
  apiId: string,
  body: {
    slug: string;
    status?: "draft" | "published";
    fields: Record<string, unknown>;
  },
): Promise<FlatEntry> {
  return adminFetch<FlatEntry>(
    `/api/v1/admin/content-types/${apiId}/entries`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function adminPublishEntry(
  apiId: string,
  entryId: string,
): Promise<FlatEntry> {
  return adminFetch<FlatEntry>(
    `/api/v1/admin/content-types/${apiId}/entries/${entryId}/publish`,
    { method: "POST" },
  );
}

export async function adminPatchEntry(
  apiId: string,
  entryId: string,
  body: {
    status?: "draft" | "published";
    fields?: Record<string, unknown>;
  },
): Promise<FlatEntry> {
  return adminFetch<FlatEntry>(
    `/api/v1/admin/content-types/${apiId}/entries/${entryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function adminGetEntryBySlug(
  apiId: string,
  slug: string,
): Promise<FlatEntry | null> {
  const qs = new URLSearchParams({ limit: "1", slug });
  const data = await adminFetch<Paginated<FlatEntry>>(
    `/api/v1/admin/content-types/${apiId}/entries?${qs}`,
  );
  return data.items[0] ?? null;
}
