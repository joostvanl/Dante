/** Coerce CMS field values to a trimmed string. */
export function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

/** Resolve Aurora media field (URL string or `{ url }` object) to a URL. */
export function mediaUrl(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url;
    if (typeof url === "string") return url.trim();
  }
  return "";
}

export function mediaAlt(value: unknown, fallback = ""): string {
  if (value && typeof value === "object") {
    const alt = (value as { alt?: unknown }).alt;
    if (typeof alt === "string" && alt.trim()) return alt.trim();
  }
  return fallback;
}
