import { NextResponse } from "next/server";
import { isTeacherAuthenticated } from "@/lib/auth";
import {
  adminCreateEntry,
  adminGetEntryBySlug,
  adminPatchEntry,
  adminPublishEntry,
  attendanceSlug,
} from "@/lib/aurora";

type Body = {
  enrolleeSlug?: string;
  courseDaySlug?: string;
  present?: boolean;
};

export async function PUT(request: Request) {
  if (!(await isTeacherAuthenticated())) {
    return NextResponse.json({ message: "Niet ingelogd." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Ongeldige JSON." }, { status: 400 });
  }

  const enrolleeSlug = (body.enrolleeSlug ?? "").trim();
  const courseDaySlug = (body.courseDaySlug ?? "").trim();
  const present = Boolean(body.present);

  if (!enrolleeSlug || !courseDaySlug) {
    return NextResponse.json(
      { message: "enrolleeSlug en courseDaySlug zijn verplicht." },
      { status: 400 },
    );
  }

  const slug = attendanceSlug(enrolleeSlug, courseDaySlug);

  try {
    const existing = await adminGetEntryBySlug("attendance", slug);
    if (existing) {
      const updated = await adminPatchEntry("attendance", existing.id, {
        fields: {
          enrolleeSlug,
          courseDaySlug,
          present,
        },
      });
      if (updated.status !== "published") {
        await adminPublishEntry("attendance", updated.id);
      }
      return NextResponse.json({ ok: true, slug, present });
    }

    const created = await adminCreateEntry("attendance", {
      slug,
      status: "published",
      fields: {
        enrolleeSlug,
        courseDaySlug,
        present,
      },
    });
    if (created.status !== "published") {
      await adminPublishEntry("attendance", created.id);
    }
    return NextResponse.json({ ok: true, slug, present });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Opslaan mislukt." },
      { status: 500 },
    );
  }
}
