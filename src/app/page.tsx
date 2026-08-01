import Link from "next/link";
import {
  getSiteSettings,
  listCourses,
  listEnrollees,
  listTeachers,
} from "@/lib/aurora";
import { courseSpots, teacherBySlug } from "@/lib/course";
import { asText, mediaAlt, mediaUrl } from "@/lib/fields";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, courses, teachers, enrollees] = await Promise.all([
    getSiteSettings(),
    listCourses(),
    listTeachers(),
    listEnrollees(),
  ]);

  const visible = courses.filter((c) => c.slug !== "default");
  const heroImage = mediaUrl(settings?.fields.heroImage);
  const heroAlt = mediaAlt(settings?.fields.heroImage);
  const heroTitle = asText(settings?.fields.heroTitle) || "Dante";
  const heroLead =
    asText(settings?.fields.heroLead) ||
    "Compacte cursussen van beginners tot gevorderd. Kies je niveau, meld je aan zolang er plek is.";

  return (
    <main>
      <section
        className={`hero-banner${heroImage ? " has-image" : ""}`}
        aria-label="Introductie"
      >
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="hero-banner-media"
            src={heroImage}
            alt={heroAlt}
          />
        ) : null}
        <div className="hero-banner-scrim" aria-hidden />
        <div className="hero-banner-inner">
          <p className="hero-kicker anim-rise">Italiaanse taal &amp; cultuur</p>
          <h1 className="anim-rise-2">{heroTitle}</h1>
          <p className="lead anim-rise-3">{heroLead}</p>
          <div className="hero-actions anim-rise-3">
            <a className="btn btn-primary" href="#cursussen">
              Bekijk cursussen
            </a>
            <Link className="btn btn-on-media" href="/docenten">
              Ontmoet de docenten
            </Link>
          </div>
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
                    <Link
                      className="btn btn-ghost"
                      href={`/cursus/${course.slug}`}
                    >
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
