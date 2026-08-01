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

  return (
    <main>
      <section className="hero">
        <h1>Dante</h1>
        <p className="lead">
          Italiaanse cursussen voor beginners tot gevorderden. Kies een cursus
          en meld je aan zolang er plek is.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#cursussen">
            Bekijk cursussen
          </a>
          <Link className="btn btn-ghost" href="/docenten">
            Ontmoet de docenten
          </Link>
        </div>
      </section>

      <section className="section" id="cursussen">
        <h2>Cursussen</h2>
        <p className="sub">Seizoen, niveau en docent — meld je aan per cursus.</p>

        {courses.length === 0 ? (
          <p className="empty">Nog geen gepubliceerde cursussen.</p>
        ) : (
          <ul className="course-list">
            {courses.map((course) => {
              const teacher = teacherBySlug(
                teachers,
                course.fields.teacherSlug,
              );
              const { remaining, max, open } = courseSpots(course, enrollees);
              return (
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
                      {teacher ? (
                        <Link
                          href={`/docenten/${teacher.slug}`}
                          className="meta-chip meta-link"
                        >
                          {teacher.fields.name}
                        </Link>
                      ) : null}
                    </div>
                    <p className="course-excerpt">
                      {course.fields.description}
                    </p>
                  </div>
                  <div className="course-row-aside">
                    <span className={`spots${remaining === 0 ? " full" : ""}`}>
                      {remaining === 0
                        ? "Vol"
                        : `${remaining}/${max} vrij`}
                    </span>
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
