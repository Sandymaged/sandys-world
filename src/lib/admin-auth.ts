import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

/*
 * دخول لوحة التحكم (NFR-11). لحد ما Supabase Auth يتربط: كلمة سر واحدة لصاحبة المتجر.
 * الكوكي فيه ميعاد انتهاء + توقيع HMAC، فمحدش يقدر يعمله بإيده.
 */

const COOKIE = "admin_session";
const DAYS = 14;
export const DEV_PASSWORD = "admin123";

export const usingDevPassword = () => !process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "production";

function password(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : DEV_PASSWORD;
}

function secret() {
  return process.env.ADMIN_SECRET || `gift-admin:${password() ?? "disabled"}`;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string) {
  const p = password();
  return p !== null && safeEqual(input, p);
}

export async function startSession() {
  const exp = Date.now() + DAYS * 86_400_000;
  const value = `${exp}.${sign(String(exp))}`;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DAYS * 86_400,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  // صفحات اللوحة لازم تتعمل وقت الطلب (فيها جلسة وتاريخ انتهاء)، مش تتجهز مقدماً
  await connection();
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

/** في أول أي صفحة أو action في اللوحة */
export async function requireAdmin(locale: string = "ar") {
  if (!(await isAdmin())) redirect(locale === "en" ? "/en/admin/login" : "/admin/login");
}
