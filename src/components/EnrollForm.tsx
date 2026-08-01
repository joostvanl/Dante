"use client";

import { FormEvent, useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string };

export function EnrollForm({
  courseSlug,
  courseTitle,
  disabled,
}: {
  courseSlug: string;
  courseTitle: string;
  disabled?: boolean;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setState({ kind: "loading" });

    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          courseSlug,
        }),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) {
        setState({
          kind: "err",
          message: json.message || "Aanmelden mislukt.",
        });
        return;
      }
      form.reset();
      setState({
        kind: "ok",
        message: json.message || "Je bent aangemeld.",
      });
    } catch {
      setState({
        kind: "err",
        message: "Netwerkfout. Probeer het opnieuw.",
      });
    }
  }

  if (disabled) {
    return (
      <p className="msg msg-info">
        Aanmelden voor {courseTitle} is niet mogelijk — de cursus is vol of
        gesloten.
      </p>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="name">Naam</label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          autoComplete="name"
          disabled={state.kind === "loading"}
        />
      </div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={state.kind === "loading"}
        />
      </div>
      <div className="field">
        <label htmlFor="phone">Telefoon (optioneel)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          disabled={state.kind === "loading"}
        />
      </div>

      {state.kind === "ok" ? (
        <p className="msg msg-ok" role="status">
          {state.message}
        </p>
      ) : null}
      {state.kind === "err" ? (
        <p className="msg msg-err" role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={state.kind === "loading"}
      >
        {state.kind === "loading" ? "Bezig…" : `Aanmelden voor ${courseTitle}`}
      </button>
    </form>
  );
}
