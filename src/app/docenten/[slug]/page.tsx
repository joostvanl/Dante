import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeacher, listCourses } from "@/lib/aurora";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function TeacherDetailPage({ params }: Props) {
  const { slug } = await params;
  const [teacher, courses] = await Promise.all([
    getTeacher(slug),
    listCourses(),
  ]);

  if (!teacher) notFound();

  const taught = courses.filter(
    (c) => c.fields.teacherSlug === teacher.slug && c.slug !== "default",
  );

  return (
    <main>
      <section className="detail-hero anim-rise">
        <p className="eyebrow">
          <Link href="/docenten">← Alle docenten</Link>
        </p>
        <div className="teacher-avatar" aria-hidden>
          {(teacher.fields.name ?? "?").slice(0, 1)}
        </div>
        <h1>{teacher.fields.name}</h1>
        <p className="specialty">{teacher.fields.specialty}</p>
        {teacher.fields.bio ? (
          <p className="lead">{teacher.fields.bio}</p>
        ) : null}
        <div className="meta-row" style={{ marginTop: "1.1rem" }}>
          {teacher.fields.email ? (
            <a
              className="meta-chip meta-link"
              href={`mailto:${teacher.fields.email}`}
            >
              {teacher.fields.email}
            </a>
          ) : null}
          {teacher.fields.phone ? (
            <span className="meta-chip">{teacher.fields.phone}</span>
          ) : null}
        </div>
      </section>

      <section className="section">
        <h2>Cursussen</h2>
        <p className="sub">Cursussen die deze docent geeft.</p>
        {taught.length === 0 ? (
          <p className="empty">Geen gekoppelde cursussen.</p>
        ) : (
          <ul className="course-grid">
            {taught.map((course) => (
              <li key={course.id} className="course-card">
                <Link
                  href={`/cursus/${course.slug}`}
                  className="course-title"
                >
                  {course.fields.title}
                </Link>
                <div className="meta-row">
                  {course.fields.season ? (
                    <span className="meta-chip">{course.fields.season}</span>
                  ) : null}
                  {course.fields.level ? (
                    <span className="meta-chip">{course.fields.level}</span>
                  ) : null}
                </div>
                <div className="course-card-foot">
                  <Link className="btn btn-primary" href={`/cursus/${course.slug}`}>
                    Bekijken
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
