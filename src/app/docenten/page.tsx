import Link from "next/link";
import { listTeachers } from "@/lib/aurora";

export const dynamic = "force-dynamic";

export default async function DocentenPage() {
  const teachers = await listTeachers();

  return (
    <main>
      <section className="section" style={{ marginTop: 0 }}>
        <h2>Docenten</h2>
        <p className="sub">
          De docenten van Dante — specialisten in Italiaanse taal en cultuur.
        </p>

        {teachers.length === 0 ? (
          <p className="empty">Nog geen gepubliceerde docenten.</p>
        ) : (
          <ul className="teacher-list">
            {teachers.map((teacher) => (
              <li key={teacher.id} className="panel teacher-card">
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
