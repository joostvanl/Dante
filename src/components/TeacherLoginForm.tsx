"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function TeacherLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const pin = new FormData(e.currentTarget).get("pin");

    try {
      const res = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(json.message || "Inloggen mislukt.");
        setLoading(false);
        return;
      }
      router.push("/docent/aanwezigheid");
      router.refresh();
    } catch {
      setError("Netwerkfout. Probeer het opnieuw.");
      setLoading(false);
    }
  }

  return (
    <form className="form pin-form panel" onSubmit={onSubmit}>
      <h1>Docent</h1>
      <p>Voer de PIN in om aanwezigheid te registreren.</p>
      <div className="field">
        <label htmlFor="pin">PIN</label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          disabled={loading}
        />
      </div>
      {error ? (
        <p className="msg msg-err" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Bezig…" : "Inloggen"}
      </button>
    </form>
  );
}
