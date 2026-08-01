import Link from "next/link";
import { EnrollForm } from "@/components/EnrollForm";
import { getCourse, listCourses, listEnrollees } from "@/lib/aurora";
import { courseSpots } from "@/lib/course";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ cursus?: string }> };

export default async function AanmeldenPage({ searchParams }: Props) {
  const { cursus: courseSlug } = await searchParams;
  const [courses, enrollees] = await Promise.all([
    listCourses(),
    listEnrollees(),
  ]);
  const visible = courses.filter((c) => c.slug !== "default");

  if (!courseSlug) {
    return (
      <main>
        <section className="detail-hero anim-rise">
          <h1>Aanmelden</h1>
          <p className="page-sub">Kies eerst de cursus waarvoor je wilt inschrijven.</p>
        </section>
        <section className="section" style={{ marginTop: "1.5rem" }}>
          {visible.length === 0 ? (
            <p className="empty">Nog geen cursussen beschikbaar.</p>
          ) : (
            <ul className="course-list">
              {visible.map((course) => {
                const { open, remaining, max } = courseSpots(course, enrollees);
                return (
                  <li key={course.id} className="course-row">
                    <div className="course-row-main">
                      <span className="course-title">{course.fields.title}</span>
                      <div className="meta-row" style={{ marginTop: "0.45rem" }}>
                        {course.fields.level ? (
                          <span className="meta-chip">{course.fields.level}</span>
                        ) : null}
                        {course.fields.season ? (
                          <span className="meta-chip">{course.fields.season}</span>
                        ) : null}
                        <span
                          className={`spots${remaining === 0 ? " full" : ""}`}
                        >
                          {remaining === 0 ? "Vol" : `${remaining}/${max} vrij`}
                        </span>
                      </div>
                    </div>
                    {open ? (
                      <Link
                        className="btn btn-primary"
                        href={`/aanmelden?cursus=${encodeURIComponent(course.slug)}`}
                      >
                        Kies
                      </Link>
                    ) : (
                      <span className="btn btn-ghost" aria-disabled>
                        Gesloten
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    );
  }

  const course = await getCourse(courseSlug);
  if (!course) {
    return (
      <main>
        <div className="panel">
          <p className="msg msg-err">Cursus niet gevonden.</p>
          <Link href="/aanmelden">Terug naar cursuskeuze</Link>
        </div>
      </main>
    );
  }

  const { remaining, open } = courseSpots(course, enrollees);

  return (
    <main>
      <section className="detail-hero anim-rise">
        <p className="eyebrow">
          <Link href={`/cursus/${course.slug}`}>← {course.fields.title}</Link>
        </p>
        <h1>Aanmelden</h1>
        <p className="page-sub">
          {open
            ? `Nog ${remaining} plek${remaining === 1 ? "" : "ken"} vrij voor ${course.fields.title}.`
            : "Er zijn geen plekken meer, of aanmelden is gesloten."}
        </p>
      </section>
      <section className="section" style={{ marginTop: "1.25rem" }}>
        <div className="panel">
          <EnrollForm
            courseSlug={course.slug}
            courseTitle={course.fields.title}
            disabled={!open}
          />
        </div>
      </section>
    </main>
  );
}
