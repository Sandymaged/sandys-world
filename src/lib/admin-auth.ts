import "server-only";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { adminClient } from "./supabase/admin";

/*
 * دخول لوحة التحكم (NFR-11): اسم مستخدم وكلمة سر لصاحبة المتجر.
 * الحساب بيتحفظ متشفّر (scrypt) في finance_settings (للسيرفر بس، العملاء مش بيشوفوه)، وبيتغير من «حسابي» في اللوحة.
 * لحد ما يتعمل حساب: اسم المستخدم admin وكلمة السر من متغير ADMIN_PASSWORD.
 * الكوكي فيه ميعاد انتهاء + توقيع HMAC مربوط بكلمة السر الحالية، فلما تتغير أي جلسة قديمة بتقفل.
 */

const COOKIE = "admin_session";
const DAYS = 14;
export const DEV_PASSWORD = "admin123";
export const DEFAULT_USERNAME = "admin";

export const usingDevPassword = () => !process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "production";

const scryptAsync = promisify(scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>;

interface AdminAccount {
  username: string;
  salt: string;
  hash: string;
  updatedAt: string;
}

const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
const FILE = path.join(process.cwd(), ".data", "admin.json");

async function loadAccount(): Promise<AdminAccount | null> {
  if (onSupabase()) {
    const { data, error } = await adminClient().from("finance_settings").select("value").eq("key", "adminAccount").maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.value as AdminAccount | undefined) ?? null;
  }
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as AdminAccount;
  } catch {
    return null;
  }
}

async function storeAccount(a: AdminAccount) {
  if (onSupabase()) {
    const { error } = await adminClient().from("finance_settings").upsert({ key: "adminAccount", value: a });
    if (error) throw new Error(error.message);
    return;
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(`${FILE}.tmp`, JSON.stringify(a), "utf8");
  await rename(`${FILE}.tmp`, FILE);
}

function envPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : DEV_PASSWORD;
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** التوقيع مربوط بالحساب الحالي: لو كلمة السر اتغيرت، الكوكيز القديمة بتبطل */
async function sign(payload: string, acc?: AdminAccount | null) {
  const a = acc === undefined ? await loadAccount() : acc;
  const version = a ? a.hash.slice(0, 24) : `env:${envPassword() ?? "disabled"}`;
  const key = `${process.env.ADMIN_SECRET || "gift-admin"}:${version}`;
  return createHmac("sha256", key).update(payload).digest("hex");
}

/** اسم المستخدم الحالي، وهل لسه على الحساب المبدئي (admin + ADMIN_PASSWORD) */
export async function adminAccountInfo() {
  const a = await loadAccount();
  return { username: a?.username ?? DEFAULT_USERNAME, isDefault: !a, updatedAt: a?.updatedAt ?? null };
}

export async function checkLogin(username: string, password: string): Promise<boolean> {
  const a = await loadAccount();
  const user = username.trim().toLowerCase();
  if (!a) {
    const p = envPassword();
    return user === DEFAULT_USERNAME && p !== null && safeEqual(password, p);
  }
  const hash = (await scryptAsync(password, a.salt, 64)).toString("hex");
  return user === a.username.toLowerCase() && safeEqual(hash, a.hash);
}

export async function setAdminAccount(username: string, password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)).toString("hex");
  await storeAccount({ username: username.trim(), salt, hash, updatedAt: new Date().toISOString() });
}

export async function startSession() {
  const exp = Date.now() + DAYS * 86_400_000;
  const value = `${exp}.${await sign(String(exp))}`;
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
  return safeEqual(sig, await sign(exp));
}

/** في أول أي صفحة أو action في اللوحة */
export async function requireAdmin(locale: string = "ar") {
  if (!(await isAdmin())) redirect(locale === "en" ? "/en/admin/login" : "/admin/login");
}
