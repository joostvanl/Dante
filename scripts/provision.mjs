/**
 * Idempotent CMS provision for Dante (Aurora Management API).
 * Aligns schema with the live content model; does not overwrite
 * existing course/teacher seed content from Admin.
 *
 * Usage:
 *   node scripts/provision.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const API = (
  process.env.CMS_API_URL ||
  process.env.NEXT_PUBLIC_CMS_API_URL ||
  ""
).replace(/\/$/, "");
const TOKEN = process.env.CMS_MANAGEMENT_TOKEN;

if (!API || !TOKEN) {
  console.error(
    "Missing CMS_API_URL/NEXT_PUBLIC_CMS_API_URL or CMS_MANAGEMENT_TOKEN",
  );
  process.exit(1);
}

async function admin(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${init.method || "GET"} ${path} → ${res.status}: ${text}`);
  }
  return body;
}

const payload = {
  contentTypes: [
    {
      apiId: "site_settings",
      name: "Site settings",
      description: "Globale site-instellingen (homepage hero)",
      fields: [
        {
          apiId: "heroImage",
          name: "Hero image",
          type: "media",
          required: false,
          sortOrder: 0,
        },
        {
          apiId: "heroTitle",
          name: "Hero title",
          type: "text",
          required: false,
          sortOrder: 1,
        },
        {
          apiId: "heroLead",
          name: "Hero lead",
          type: "textarea",
          required: false,
          sortOrder: 2,
        },
      ],
      entries: [
        {
          slug: "default",
          status: "published",
          fields: {
            heroTitle: "Dante",
            heroLead:
              "Compacte cursussen van beginners tot gevorderd. Kies je niveau, meld je aan zolang er plek is.",
            heroImage: "",
          },
        },
      ],
    },
    {
      apiId: "teacher",
      name: "Teacher",
      description: "Docent Italiaanse taal voor Dante",
      fields: [
        {
          apiId: "name",
          name: "Name",
          type: "text",
          required: true,
          sortOrder: 1,
        },
        {
          apiId: "specialty",
          name: "Specialty",
          type: "text",
          required: true,
          sortOrder: 2,
        },
        {
          apiId: "bio",
          name: "Bio",
          type: "textarea",
          required: false,
          sortOrder: 3,
        },
        {
          apiId: "email",
          name: "Email",
          type: "text",
          required: false,
          sortOrder: 4,
        },
        {
          apiId: "phone",
          name: "Phone",
          type: "text",
          required: false,
          sortOrder: 5,
        },
      ],
      entries: [],
    },
    {
      apiId: "course",
      name: "Course",
      description: "Italiaanse cursussen bij Dante",
      fields: [
        {
          apiId: "title",
          name: "Title",
          type: "text",
          required: true,
          sortOrder: 0,
        },
        {
          apiId: "description",
          name: "Description",
          type: "textarea",
          required: true,
          sortOrder: 1,
        },
        {
          apiId: "maxParticipants",
          name: "Max participants",
          type: "number",
          required: true,
          sortOrder: 2,
        },
        {
          apiId: "enrollmentOpen",
          name: "Enrollment open",
          type: "boolean",
          required: true,
          sortOrder: 3,
        },
        {
          apiId: "teacherSlug",
          name: "Teacher slug",
          type: "text",
          required: false,
          sortOrder: 10,
        },
        {
          apiId: "season",
          name: "Season",
          type: "text",
          required: false,
          sortOrder: 11,
        },
        {
          apiId: "level",
          name: "Level",
          type: "text",
          required: false,
          sortOrder: 12,
        },
        {
          apiId: "courseDays",
          name: "Cursusmomenten",
          type: "relations",
          required: false,
          sortOrder: 13,
          settings: {
            relatedContentTypeApiId: "course_day",
          },
        },
      ],
      entries: [],
    },
    {
      apiId: "course_day",
      name: "Course day",
      description: "Individuele cursusdagen",
      fields: [
        {
          apiId: "title",
          name: "Title",
          type: "text",
          required: true,
          sortOrder: 0,
        },
        {
          apiId: "date",
          name: "Date",
          type: "datetime",
          required: true,
          sortOrder: 1,
        },
        {
          apiId: "sortOrder",
          name: "Sort order",
          type: "number",
          required: true,
          sortOrder: 2,
        },
        {
          apiId: "notes",
          name: "Notes",
          type: "textarea",
          required: false,
          sortOrder: 3,
        },
        {
          apiId: "courseSlug",
          name: "Course slug",
          type: "text",
          required: true,
          sortOrder: 5,
        },
        {
          apiId: "course",
          name: "Cursus",
          type: "relation",
          required: true,
          sortOrder: 6,
          settings: {
            relatedContentTypeApiId: "course",
          },
        },
      ],
      // Days are managed in Admin (per course); do not overwrite entries here.
      entries: [],
    },
    {
      apiId: "enrollee",
      name: "Enrollee",
      description: "Inschrijvers op de cursus",
      fields: [
        {
          apiId: "name",
          name: "Name",
          type: "text",
          required: true,
          sortOrder: 0,
        },
        {
          apiId: "email",
          name: "Email",
          type: "text",
          required: true,
          sortOrder: 1,
        },
        {
          apiId: "phone",
          name: "Phone",
          type: "text",
          required: false,
          sortOrder: 2,
        },
      ],
      entries: [],
    },
    {
      apiId: "attendance",
      name: "Attendance",
      description: "Aanwezigheid per cursist per dag",
      fields: [
        {
          apiId: "enrolleeSlug",
          name: "Enrollee slug",
          type: "text",
          required: true,
          sortOrder: 0,
        },
        {
          apiId: "courseDaySlug",
          name: "Course day slug",
          type: "text",
          required: true,
          sortOrder: 1,
        },
        {
          apiId: "present",
          name: "Present",
          type: "boolean",
          required: true,
          sortOrder: 2,
        },
      ],
      entries: [],
    },
  ],
};

const origins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3002",
  ...(process.env.PUBLIC_SITE_ORIGIN
    ? [process.env.PUBLIC_SITE_ORIGIN]
    : []),
];

console.log(`Provisioning against ${API} …`);
const result = await admin("/api/v1/admin/provision", {
  method: "POST",
  body: JSON.stringify(payload),
});
console.log("Provision OK:", JSON.stringify(result, null, 2));

await admin("/api/v1/admin/website", {
  method: "PATCH",
  body: JSON.stringify({ allowedOrigins: origins }),
});
console.log("Allowed origins:", origins.join(", "));
console.log("Done.");
