"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatShortDay } from "@/lib/format";

type Day = {
  slug: string;
  title: string;
  date: string;
  sortOrder: number;
};

type Person = {
  slug: string;
  name: string;
  email: string;
};

type Roster = {
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
  const [daySlug, setDaySlug] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

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

  const presentCount = useMemo(() => {
    if (!data || !daySlug) return 0;
    return data.enrollees.filter((e) =>
      Boolean(data.presentByKey[key(e.slug, daySlug)]),
    ).length;
  }, [data, daySlug]);

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

  if (loading) {
    return <p className="empty">Laden…</p>;
  }

  if (!data) {
    return (
      <p className="msg msg-err">{error || "Geen gegevens."}</p>
    );
  }

  const activeDay = data.days.find((d) => d.slug === daySlug);

  return (
    <div>
      <div className="toolbar">
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>
            Aanwezigheid
          </h2>
          <p className="stats" style={{ margin: "0.25rem 0 0" }}>
            {activeDay
              ? `${activeDay.title} · ${formatShortDay(activeDay.date)}`
              : "Kies een cursusdag"}
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Uitloggen
        </button>
      </div>

      <div className="day-tabs" role="tablist" aria-label="Cursusdagen">
        {data.days.map((day) => (
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

      {error ? (
        <p className="msg msg-err" role="alert">
          {error}
        </p>
      ) : null}

      <div className="toolbar">
        <p className="stats">
          {presentCount} van {data.enrollees.length} aanwezig
        </p>
      </div>

      {data.enrollees.length === 0 ? (
        <p className="empty">Nog geen inschrijvers.</p>
      ) : (
        <ul className="roster">
          {data.enrollees.map((person) => {
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
                    <span className="email">
                      {person.email}
                      {person.slug.includes("-for-")
                        ? ` · ${person.slug.split("-for-").slice(1).join("-for-")}`
                        : ""}
                    </span>
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
