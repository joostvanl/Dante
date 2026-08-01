import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "./env";

const COOKIE_NAME = "dante_teacher";
const MAX_AGE_SEC = 60 * 60 * 12; // 12 hours

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createTeacherToken(): string {
  const { teacherSessionSecret } = getServerEnv();
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `teacher:${exp}`;
  const sig = sign(payload, teacherSessionSecret);
  return `${payload}.${sig}`;
}

export function verifyTeacherToken(token: string | undefined): boolean {
  if (!token) return false;
  const { teacherSessionSecret } = getServerEnv();
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = sign(payload, teacherSessionSecret);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  const [, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export function verifyPin(pin: string): boolean {
  const { teacherPin } = getServerEnv();
  const a = Buffer.from(pin);
  const b = Buffer.from(teacherPin);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isTeacherAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifyTeacherToken(jar.get(COOKIE_NAME)?.value);
}

export { COOKIE_NAME, MAX_AGE_SEC };
