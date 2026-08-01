import { NextResponse } from "next/server";
import {
  adminCreateEntry,
  adminListEntries,
  adminPublishEntry,
  enrolleeSlugForCourse,
  getCourse,
  isEnrolleeForCourse,
} from "@/lib/aurora";
import type { EnrolleeFields } from "@/lib/types";

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  courseSlug?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Ongeldige JSON." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = (body.phone ?? "").trim();
  const courseSlug = (body.courseSlug ?? "").trim();

  if (!courseSlug) {
    return NextResponse.json(
      { message: "Kies een cursus om je aan te melden." },
      { status: 400 },
    );
  }
  if (name.length < 2) {
    return NextResponse.json(
      { message: "Vul een geldige naam in." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { message: "Vul een geldig e-mailadres in." },
      { status: 400 },
    );
  }

  const course = await getCourse(courseSlug);
  if (!course) {
    return NextResponse.json(
      { message: "Cursus niet gevonden." },
      { status: 404 },
    );
  }
  if (!course.fields.enrollmentOpen) {
    return NextResponse.json(
      { message: "Aanmelden is momenteel gesloten." },
      { status: 403 },
    );
  }

  const enrollees = await adminListEntries<EnrolleeFields>(
    "enrollee",
    "published",
  );
  const forCourse = enrollees.filter((e) =>
    isEnrolleeForCourse(e.slug, course.slug),
  );
  const max = Number(course.fields.maxParticipants) || 0;
  if (forCourse.length >= max) {
    return NextResponse.json(
      { message: "De cursus is vol." },
      { status: 409 },
    );
  }

  const duplicate = forCourse.find(
    (e) => (e.fields.email ?? "").toLowerCase() === email,
  );
  if (duplicate) {
    return NextResponse.json(
      { message: "Dit e-mailadres is al aangemeld voor deze cursus." },
      { status: 409 },
    );
  }

  const slug = enrolleeSlugForCourse(email, course.slug);
  if (!slug) {
    return NextResponse.json(
      { message: "Kon geen slug maken voor deze aanmelding." },
      { status: 400 },
    );
  }

  try {
    const created = await adminCreateEntry("enrollee", {
      slug,
      status: "published",
      fields: {
        name,
        email,
        ...(phone ? { phone } : {}),
      },
    });

    if (created.status !== "published") {
      await adminPublishEntry("enrollee", created.id);
    }

    return NextResponse.json({
      ok: true,
      message: `Je bent aangemeld voor ${course.fields.title}. Tot op de cursus!`,
      slug: created.slug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Aanmelden mislukt.";
    if (message.includes("409") || /unique|exists|duplicate/i.test(message)) {
      return NextResponse.json(
        { message: "Dit e-mailadres is al aangemeld voor deze cursus." },
        { status: 409 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { message: "Aanmelden mislukt. Probeer later opnieuw." },
      { status: 500 },
    );
  }
}
