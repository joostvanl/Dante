import Link from "next/link";
import { listCourses, listEnrollees, listTeachers } from "@/lib/aurora";
import { courseSpots, teacherBySlug } from "@/lib/course";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [courses, teachers, enrollees] = await Promise.all([
    listCourses(),
    listTeachers(),
    listEnrollees(),
  ]);

  const visible = courses.filter((c) => c.slug !== "default");

  return (
    <main>
      <section className="hero">
        <p className="hero-kicker anim-rise">Italiaanse taal &amp; cultuur</p>
        <h1 className="anim-rise-2">Dante</h1>
        <p className="lead anim-rise-3">
          Compacte cursussen van beginners tot gevorderd. Kies je niveau, meld
          je aan zolang er plek is.
        </p>
        <div className="hero-actions anim-rise-3">
          <a className="btn btn-primary" href="#cursussen">
            Bekijk cursussen
          </a>
          <Link className="btn btn-ghost" href="/docenten">
            Ontmoet de docenten
          </Link>
        </div>
      </section>

      <section className="section" id="cursussen">
        <div className="section-head">
          <div>
            <h2>Cursussen</h2>
            <p className="sub">
              Seizoen, niveau en docent — alles in één overzicht.
            </p>
          </div>
          <Link className="btn btn-ghost" href="/aanmelden">
            Direct aanmelden
          </Link>
        </div>

        {visible.length === 0 ? (
          <p className="empty">Nog geen gepubliceerde cursussen.</p>
        ) : (
          <ul className="course-grid">
            {visible.map((course) => {
              const teacher = teacherBySlug(
                teachers,
                course.fields.teacherSlug,
              );
              const { remaining, max, open } = courseSpots(course, enrollees);
              return (
                <li key={course.id} className="course-card">
                  <div className="course-card-top">
                    <Link
                      href={`/cursus/${course.slug}`}
                      className="course-title"
                    >
                      {course.fields.title}
                    </Link>
                    <span className={`spots${remaining === 0 ? " full" : ""}`}>
                      {remaining === 0 ? "Vol" : `${remaining}/${max}`}
                    </span>
                  </div>
                  <div className="meta-row">
                    {course.fields.season ? (
                      <span className="meta-chip">{course.fields.season}</span>
                    ) : null}
                    {course.fields.level ? (
                      <span className="meta-chip">{course.fields.level}</span>
                    ) : null}
                    {teacher ? (
                      <Link
                        href={`/docenten/${teacher.slug}`}
                        className="meta-chip meta-link"
                      >
                        {teacher.fields.name}
                      </Link>
                    ) : null}
                  </div>
                  <p className="course-excerpt">{course.fields.description}</p>
                  <div className="course-card-foot">
                    <Link className="btn btn-ghost" href={`/cursus/${course.slug}`}>
                      Details
                    </Link>
                    <Link
                      className="btn btn-primary"
                      href={
                        open
                          ? `/aanmelden?cursus=${encodeURIComponent(course.slug)}`
                          : `/cursus/${course.slug}`
                      }
                    >
                      {open ? "Aanmelden" : "Bekijken"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
