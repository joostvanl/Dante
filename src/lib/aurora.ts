import { getPublicEnv, getServerEnv } from "./env";
import type {
  Attendance,
  Course,
  CourseDay,
  Enrollee,
  FlatEntry,
  Paginated,
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

export async function listCourseDays(): Promise<CourseDay[]> {
  try {
    const data = await publicFetch<Paginated<CourseDay>>(
      "/api/v1/content-types/course_day/entries?limit=100",
    );
    return [...data.items].sort(
      (a, b) => (a.fields.sortOrder ?? 0) - (b.fields.sortOrder ?? 0),
    );
  } catch {
    return [];
  }
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
