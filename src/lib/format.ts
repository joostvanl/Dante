const TIME_ZONE = "Europe/Amsterdam";

function parseDate(dateIso: string): Date | null {
  const d = new Date(dateIso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDay(dateIso: string): string {
  const d = parseDate(dateIso);
  if (!d) return dateIso;
  const day = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(d);
  const time = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(d);
  return `${day} · ${time}`;
}

export function formatShortDay(dateIso: string): string {
  const d = parseDate(dateIso);
  if (!d) return dateIso;
  const day = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(d);
  const time = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(d);
  return `${day} · ${time}`;
}
