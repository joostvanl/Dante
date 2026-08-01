import Link from "next/link";
import { listTeachers } from "@/lib/aurora";

export const dynamic = "force-dynamic";

export default async function DocentenPage() {
  const teachers = await listTeachers();

  return (
    <main>
      <section className="detail-hero anim-rise">
        <h1 className="page-title">Docenten</h1>
        <p className="page-sub">
          Specialisten in Italiaanse taal, cultuur en spreekvaardigheid.
        </p>
      </section>

      <section className="section" style={{ marginTop: "1.75rem" }}>
        {teachers.length === 0 ? (
          <p className="empty">Nog geen gepubliceerde docenten.</p>
        ) : (
          <ul className="teacher-grid">
            {teachers.map((teacher) => (
              <li key={teacher.id} className="teacher-card">
                <div className="teacher-avatar" aria-hidden>
                  {(teacher.fields.name ?? "?").slice(0, 1)}
                </div>
                <Link
                  href={`/docenten/${teacher.slug}`}
                  className="course-title"
                >
                  {teacher.fields.name}
                </Link>
                <p className="specialty">{teacher.fields.specialty}</p>
                {teacher.fields.bio ? (
                  <p className="course-excerpt">{teacher.fields.bio}</p>
                ) : null}
                <div style={{ marginTop: "0.5rem" }}>
                  <Link
                    className="btn btn-ghost"
                    href={`/docenten/${teacher.slug}`}
                  >
                    Profiel
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
