"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatShortDay } from "@/lib/format";

type Course = {
  slug: string;
  title: string;
  level: string | null;
  season: string | null;
  enrolleeCount: number;
};

type Day = {
  slug: string;
  title: string;
  date: string;
  sortOrder: number;
  courseSlug: string | null;
};

type Person = {
  slug: string;
  name: string;
  email: string;
  courseSlug: string | null;
};

type Roster = {
  courses: Course[];
  days: Day[];
  enrollees: Person[];
  presentByKey: Record<string, boolean>;
};

function key(enrolleeSlug: string, daySlug: string) {
  return `${enrolleeSlug}__${daySlug}`;
}

export function AttendanceBoard() {
  const router = useRouter();
  const [data, setData] = useState<Roster | null>(null);
  const [courseSlug, setCourseSlug] = useState<string>("");
  const [daySlug, setDaySlug] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/roster");
      if (res.status === 401) {
        router.push("/docent");
        return;
      }
      if (!res.ok) {
        setError("Kon rooster niet laden.");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as Roster;
      setData(json);
      setDaySlug((prev) => prev || json.days[0]?.slug || "");
    } catch {
      setError("Netwerkfout bij laden.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCourse = useMemo(
    () => data?.courses.find((c) => c.slug === courseSlug) ?? null,
    [data, courseSlug],
  );

  const courseEnrollees = useMemo(() => {
    if (!data || !courseSlug) return [];
    return data.enrollees.filter((e) => e.courseSlug === courseSlug);
  }, [data, courseSlug]);

  const courseDays = useMemo(() => {
    if (!data || !courseSlug) return [];
    return data.days.filter((d) => d.courseSlug === courseSlug);
  }, [data, courseSlug]);

  useEffect(() => {
    if (!courseSlug || courseDays.length === 0) return;
    if (!courseDays.some((d) => d.slug === daySlug)) {
      setDaySlug(courseDays[0]?.slug ?? "");
    }
  }, [courseSlug, courseDays, daySlug]);

  const presentCount = useMemo(() => {
    if (!daySlug) return 0;
    return courseEnrollees.filter((e) =>
      Boolean(data?.presentByKey[key(e.slug, daySlug)]),
    ).length;
  }, [courseEnrollees, data, daySlug]);

  async function toggle(person: Person) {
    if (!daySlug || !data) return;
    const k = key(person.slug, daySlug);
    const previous = Boolean(data.presentByKey[k]);
    const next = !previous;
    setPending((p) => ({ ...p, [k]: true }));
    setData((prev) =>
      prev
        ? { ...prev, presentByKey: { ...prev.presentByKey, [k]: next } }
        : prev,
    );

    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrolleeSlug: person.slug,
          courseDaySlug: daySlug,
          present: next,
        }),
      });
      if (res.status === 401) {
        router.push("/docent");
        return;
      }
      if (!res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                presentByKey: { ...prev.presentByKey, [k]: previous },
              }
            : prev,
        );
        setError("Opslaan mislukt. Probeer opnieuw.");
      }
    } catch {
      setData((prev) =>
        prev
          ? {
              ...prev,
              presentByKey: { ...prev.presentByKey, [k]: previous },
            }
          : prev,
      );
      setError("Netwerkfout bij opslaan.");
    } finally {
      setPending((p) => {
        const copy = { ...p };
        delete copy[k];
        return copy;
      });
    }
  }

  async function logout() {
    await fetch("/api/teacher/logout", { method: "POST" });
    router.push("/docent");
    router.refresh();
  }

  async function exportCsv(forCourseSlug?: string) {
    setExporting(true);
    setError(null);
    try {
      const qs = forCourseSlug
        ? `?course=${encodeURIComponent(forCourseSlug)}`
        : "";
      const res = await fetch(`/api/teacher/export${qs}`);
      if (res.status === 401) {
        router.push("/docent");
        return;
      }
      if (!res.ok) {
        setError("CSV-export mislukt.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "aanwezigheid.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Netwerkfout bij CSV-export.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <p className="empty anim-fade">Laden…</p>;
  }

  if (!data) {
    return <p className="msg msg-err">{error || "Geen gegevens."}</p>;
  }

  // Step 1: pick a course
  if (!courseSlug || !activeCourse) {
    return (
      <div className="anim-rise">
        <div className="toolbar">
          <div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>
              Kies een cursus
            </h2>
            <p className="stats" style={{ margin: "0.3rem 0 0" }}>
              Aanwezigheid registreer je per cursus en per dag.
            </p>
          </div>
          <div className="toolbar-actions">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={exporting}
              onClick={() => void exportCsv()}
            >
              {exporting ? "Exporteren…" : "Exporteer alle aanwezigheid"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={logout}>
              Uitloggen
            </button>
          </div>
        </div>

        {error ? (
          <p className="msg msg-err" role="alert">
            {error}
          </p>
        ) : null}

        {data.courses.length === 0 ? (
          <p className="empty">Geen cursussen gevonden.</p>
        ) : (
          <ul className="course-picker">
            {data.courses.map((course) => (
              <li key={course.slug}>
                <button
                  type="button"
                  className="course-pick"
                  onClick={() => {
                    setCourseSlug(course.slug);
                    setError(null);
                  }}
                >
                  <span>
                    <span className="pick-title">{course.title}</span>
                    <div className="pick-meta">
                      {[course.level, course.season]
                        .filter(Boolean)
                        .join(" · ")}
                      {course.level || course.season ? " · " : ""}
                      {course.enrolleeCount}{" "}
                      {course.enrolleeCount === 1 ? "inschrijver" : "inschrijvers"}
                    </div>
                  </span>
                  <span className="btn btn-primary" aria-hidden>
                    Open
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const activeDay = courseDays.find((d) => d.slug === daySlug);

  return (
    <div className="anim-fade">
      <div className="toolbar">
        <div>
          <button
            type="button"
            className="back-link"
            onClick={() => {
              setCourseSlug("");
              setDaySlug("");
            }}
          >
            ← Andere cursus
          </button>
          <h2
            style={{
              margin: "0.45rem 0 0",
              fontFamily: "var(--font-display)",
            }}
          >
            {activeCourse.title}
          </h2>
          <p className="stats" style={{ margin: "0.25rem 0 0" }}>
            {activeDay
              ? `${activeDay.title} · ${formatShortDay(activeDay.date)}`
              : "Kies een cursusdag"}
          </p>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={exporting}
            onClick={() => void exportCsv(activeCourse.slug)}
          >
            {exporting ? "Exporteren…" : "Exporteer aanwezigheid"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Uitloggen
          </button>
        </div>
      </div>

      {courseDays.length === 0 ? (
        <p className="empty">Nog geen cursusdagen voor deze cursus.</p>
      ) : (
        <div className="day-tabs" role="tablist" aria-label="Cursusdagen">
          {courseDays.map((day) => (
            <button
              key={day.slug}
              type="button"
              role="tab"
              className="day-tab"
              aria-selected={day.slug === daySlug}
              onClick={() => setDaySlug(day.slug)}
            >
              {formatShortDay(day.date)} · {day.title}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <p className="msg msg-err" role="alert">
          {error}
        </p>
      ) : null}

      <div className="toolbar">
        <p className="stats">
          {presentCount} van {courseEnrollees.length} aanwezig
        </p>
      </div>

      {courseEnrollees.length === 0 ? (
        <p className="empty">Nog geen inschrijvers voor deze cursus.</p>
      ) : (
        <ul className="roster">
          {courseEnrollees.map((person) => {
            const k = key(person.slug, daySlug);
            const present = Boolean(data.presentByKey[k]);
            const busy = Boolean(pending[k]);
            return (
              <li key={person.slug}>
                <button
                  type="button"
                  className={`roster-row${present ? " present" : ""}`}
                  onClick={() => void toggle(person)}
                  disabled={!daySlug || busy}
                  aria-pressed={present}
                >
                  <span>
                    <span className="name">{person.name}</span>
                    <br />
                    <span className="email">{person.email}</span>
                  </span>
                  <span className="status-pill">
                    {busy ? "…" : present ? "Aanwezig" : "Afwezig"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
