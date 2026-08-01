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
      <section className="detail-hero anim-rise">
        <p className="eyebrow">
          <Link href="/#cursussen">← Alle cursussen</Link>
        </p>
        <h1>{course.fields.title}</h1>
        <div className="meta-row" style={{ marginBottom: "1.1rem" }}>
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
        <p className="lead">{course.fields.description}</p>
        <div className="hero-actions" style={{ marginTop: "1.4rem" }}>
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
        <section className="section anim-fade">
          <h2>Docent</h2>
          <p className="sub">Wie deze cursus begeleidt.</p>
          <div className="teacher-card" style={{ maxWidth: "28rem" }}>
            <div className="teacher-avatar" aria-hidden>
              {(teacher.fields.name ?? "?").slice(0, 1)}
            </div>
            <Link href={`/docenten/${teacher.slug}`} className="course-title">
              {teacher.fields.name}
            </Link>
            <p className="specialty">{teacher.fields.specialty}</p>
            {teacher.fields.bio ? (
              <p className="course-excerpt" style={{ WebkitLineClamp: 4 }}>
                {teacher.fields.bio}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2>Cursusdagen</h2>
        <p className="sub">Het gedeelde rooster voor bijeenkomsten.</p>
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
