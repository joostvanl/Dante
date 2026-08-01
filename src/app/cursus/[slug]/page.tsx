import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCourse,
  getTeacher,
  listCourseDays,
  listEnrollees,
} from "@/lib/aurora";
import { courseSpots } from "@/lib/course";
import { formatDay } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const [course, days, enrollees] = await Promise.all([
    getCourse(slug),
    listCourseDays(),
    listEnrollees(),
  ]);

  if (!course) notFound();

  const teacher = course.fields.teacherSlug
    ? await getTeacher(course.fields.teacherSlug)
    : null;
  const { remaining, max, open } = courseSpots(course, enrollees);

  return (
    <main>
      <section className="section" style={{ marginTop: 0 }}>
        <p className="eyebrow">
          <Link href="/#cursussen">← Cursussen</Link>
        </p>
        <h2>{course.fields.title}</h2>
        <div className="meta-row" style={{ marginBottom: "1rem" }}>
          {course.fields.season ? (
            <span className="meta-chip">{course.fields.season}</span>
          ) : null}
          {course.fields.level ? (
            <span className="meta-chip">{course.fields.level}</span>
          ) : null}
          <span className={`spots${remaining === 0 ? " full" : ""}`}>
            {remaining === 0
              ? "Cursus is vol"
              : `${remaining} van ${max} plekken vrij`}
          </span>
        </div>
        <p className="lead" style={{ maxWidth: "40rem" }}>
          {course.fields.description}
        </p>

        <div className="hero-actions" style={{ marginTop: "1.25rem" }}>
          {open ? (
            <Link
              className="btn btn-primary"
              href={`/aanmelden?cursus=${encodeURIComponent(course.slug)}`}
            >
              Aanmelden
            </Link>
          ) : (
            <span className="btn btn-ghost" aria-disabled>
              Aanmelden gesloten
            </span>
          )}
        </div>
      </section>

      {teacher ? (
        <section className="section">
          <h2>Docent</h2>
          <div className="panel teacher-card">
            <Link href={`/docenten/${teacher.slug}`} className="course-title">
              {teacher.fields.name}
            </Link>
            <p className="specialty">{teacher.fields.specialty}</p>
            {teacher.fields.bio ? (
              <p className="course-excerpt">{teacher.fields.bio}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2>Cursusdagen</h2>
        <p className="sub">Geplande bijeenkomsten (gedeeld rooster).</p>
        {days.length === 0 ? (
          <p className="empty">Nog geen cursusdagen gepland.</p>
        ) : (
          <ul className="day-list">
            {days.map((day) => (
              <li key={day.id} className="day-item">
                <div className="day-date">{formatDay(day.fields.date)}</div>
                <div>
                  <div className="day-title">{day.fields.title}</div>
                  {day.fields.notes ? (
                    <div className="day-notes">{day.fields.notes}</div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
