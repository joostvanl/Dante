import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  MAX_AGE_SEC,
  createTeacherToken,
  verifyPin,
} from "@/lib/auth";

export async function POST(request: Request) {
  let pin = "";
  try {
    const body = (await request.json()) as { pin?: string };
    pin = String(body.pin ?? "");
  } catch {
    return NextResponse.json({ message: "Ongeldige JSON." }, { status: 400 });
  }

  if (!verifyPin(pin)) {
    return NextResponse.json(
      { message: "Onjuiste PIN." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, createTeacherToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return res;
}
