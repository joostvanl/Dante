export type FlatEntry<TFields = Record<string, unknown>> = {
  id: string;
  slug: string;
  contentType: string;
  status: "draft" | "published";
  locale: string;
  fields: TFields;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type CourseFields = {
  title: string;
  description: string;
  maxParticipants: number;
  enrollmentOpen: boolean;
  teacherSlug?: string;
  season?: string;
  level?: string;
};

export type TeacherFields = {
  name: string;
  specialty: string;
  bio?: string;
  email?: string;
  phone?: string;
};

export type CourseDayFields = {
  title: string;
  date: string;
  sortOrder: number;
  notes?: string;
  /** Links the day to a course entry slug. */
  courseSlug?: string;
};

export type EnrolleeFields = {
  name: string;
  email: string;
  phone?: string;
};

export type AttendanceFields = {
  enrolleeSlug: string;
  courseDaySlug: string;
  present: boolean;
};

export type SiteSettingsFields = {
  /** Public image URL (Aurora media field). */
  heroImage?: string;
  heroTitle?: string;
  heroLead?: string;
};

export type Course = FlatEntry<CourseFields>;
export type Teacher = FlatEntry<TeacherFields>;
export type CourseDay = FlatEntry<CourseDayFields>;
export type Enrollee = FlatEntry<EnrolleeFields>;
export type Attendance = FlatEntry<AttendanceFields>;
export type SiteSettings = FlatEntry<SiteSettingsFields>;
