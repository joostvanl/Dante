import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCourse,
  getTeacher,
  listCourseDaysForCourse,
  listEnrollees,
} from "@/lib/aurora";
import { courseSpots } from "@/lib/course";
import { formatDay } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const [course, enrollees] = await Promise.all([
    getCourse(slug),
    listEnrollees(),
  ]);

  if (!course) notFound();

  const days = await listCourseDaysForCourse(course);
  const teacher = course.fields.teacherSlug
    ? await getTeacher(course.fields.teacherSlug)
    : null;
  const { remaining, max, open } = courseSpots(course, enrollees);

  const enrollBlock = (
    <div className="course-aside-block">
      <p className="course-aside-label">Inschrijving</p>
      <p className={`spots${remaining === 0 ? " full" : ""}`}>
        {remaining === 0
          ? "Cursus is vol"
          : `${remaining} van ${max} plekken vrij`}
      </p>
      {open ? (
        <Link
          className="btn btn-primary course-aside-cta"
          href={`/aanmelden?cursus=${encodeURIComponent(course.slug)}`}
        >
          Aanmelden
        </Link>
      ) : (
        <span className="btn btn-ghost course-aside-cta" aria-disabled>
          Aanmelden gesloten
        </span>
      )}
    </div>
  );

  return (
    <main className="course-page">
      <p className="eyebrow">
        <Link href="/#cursussen">← Alle cursussen</Link>
      </p>

      <header className="course-page-header">
        <div className="meta-row">
          {course.fields.season ? (
            <span className="meta-chip">{course.fields.season}</span>
          ) : null}
          {course.fields.level ? (
            <span className="meta-chip">{course.fields.level}</span>
          ) : null}
        </div>
        <h1>{course.fields.title}</h1>
      </header>

      <div className="course-layout">
        <div className="course-main">
          <p className="course-summary">{course.fields.description}</p>

          <section className="course-block" aria-labelledby="course-days-heading">
            <h2 id="course-days-heading" className="course-block-title">
              Cursusdagen
            </h2>
            {days.length === 0 ? (
              <p className="empty">Nog geen cursusdagen voor deze cursus.</p>
            ) : (
              <ol className="course-day-list">
                {days.map((day) => (
                  <li key={day.id} className="course-day-row">
                    <time className="course-day-date" dateTime={day.fields.date}>
                      {formatDay(day.fields.date)}
                    </time>
                    <div className="course-day-body">
                      <p className="course-day-name">{day.fields.title}</p>
                      {day.fields.notes ? (
                        <p className="course-day-notes">{day.fields.notes}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="course-aside" aria-label="Aanmelden en docent">
          {enrollBlock}
          {teacher ? (
            <div className="course-aside-block">
              <p className="course-aside-label">Docent</p>
              <div className="course-teacher">
                <div className="teacher-avatar teacher-avatar-sm" aria-hidden>
                  {(teacher.fields.name ?? "?").slice(0, 1)}
                </div>
                <div>
                  <Link
                    href={`/docenten/${teacher.slug}`}
                    className="course-teacher-name"
                  >
                    {teacher.fields.name}
                  </Link>
                  {teacher.fields.specialty ? (
                    <p className="course-teacher-specialty">
                      {teacher.fields.specialty}
                    </p>
                  ) : null}
                </div>
              </div>
              {teacher.fields.bio ? (
                <p className="course-teacher-bio">{teacher.fields.bio}</p>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
