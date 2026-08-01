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

  const taught = courses.filter((c) => c.fields.teacherSlug === teacher.slug);

  return (
    <main>
      <section className="section" style={{ marginTop: 0 }}>
        <p className="eyebrow">
          <Link href="/docenten">← Docenten</Link>
        </p>
        <h2>{teacher.fields.name}</h2>
        <p className="specialty">{teacher.fields.specialty}</p>
        {teacher.fields.bio ? (
          <p className="lead" style={{ maxWidth: "40rem" }}>
            {teacher.fields.bio}
          </p>
        ) : null}

        <div className="meta-row" style={{ marginTop: "1rem" }}>
          {teacher.fields.email ? (
            <a className="meta-chip meta-link" href={`mailto:${teacher.fields.email}`}>
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
        {taught.length === 0 ? (
          <p className="empty">Geen gekoppelde cursussen.</p>
        ) : (
          <ul className="course-list">
            {taught.map((course) => (
              <li key={course.id} className="course-row">
                <div className="course-row-main">
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
                </div>
                <Link className="btn btn-ghost" href={`/cursus/${course.slug}`}>
                  Bekijken
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
