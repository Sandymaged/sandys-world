import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { loadCatalogData } from "./db/catalog-store";
import { adminClient } from "./supabase/admin";
import type { Partner } from "./types";

/*
 * دخول البراندات المحلية.
 * الإيميل وكلمة السر في Supabase Auth، والحساب مربوط ببراند واحد في app_metadata
 * (role = "brand" و partner_id). الحاجات دي السيرفر بس اللي بيكتبها بالمفتاح السري، فالبراند ميقدرش يغيّرها.
 * بعد ما كلمة السر تتأكد بنعمل كوكي متوقّع (زي دخول اللوحة)، ومع كل صفحة بنتأكد إن الحساب لسه موجود.
 */

const COOKIE = "brand_session";
const DAYS = 14;

export const brandAccountsAvailable = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );

function secret() {
  const s = process.env.ADMIN_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Brand sessions need ADMIN_SECRET or the Supabase secret key");
  return `brand-session:${s}`;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** عميل Auth مؤقت للتأكد من كلمة السر (مش بيحفظ جلسة) */
function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export interface BrandAccount {
  userId: string;
  email: string;
  partnerId: string;
  mustChangePassword: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- مستخدم Supabase Auth */
function toAccount(u: any): BrandAccount | null {
  const m = u?.app_metadata ?? {};
  if (m.role !== "brand" || !m.partner_id) return null;
  if (u.banned_until && new Date(u.banned_until) > new Date()) return null;
  return {
    userId: u.id,
    email: u.email ?? "",
    partnerId: String(m.partner_id),
    mustChangePassword: Boolean(m.must_change_password),
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** بيتأكد من الإيميل وكلمة السر، ولو الحساب حساب براند بيبدأ الجلسة */
export async function signInBrand(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!brandAccountsAvailable()) return { ok: false, error: "حسابات العلامات التجارية غير مفعّلة بعد" };
  const { data, error } = await authClient().auth.signInWithPassword({ email, password });
  const account = !error ? toAccount(data.user) : null;
  if (!account) return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحين" };
  const exp = Date.now() + DAYS * 86_400_000;
  const payload = `${account.userId}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DAYS * 86_400,
  });
  return { ok: true };
}

export async function endBrandSession() {
  (await cookies()).delete(COOKIE);
}

export type BrandSession = BrandAccount & { partner: Partner };

/** البراند الداخل دلوقتي (أو null). مرة واحدة لكل طلب */
export const getBrandSession = cache(async (): Promise<BrandSession | null> => {
  await connection();
  if (!brandAccountsAvailable()) return null;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return null;
  const [userId, exp, sig] = v.split(".");
  if (!userId || !exp || !sig || Number(exp) < Date.now() || !safeEqual(sig, sign(`${userId}.${exp}`))) return null;
  // الحساب لسه موجود ومربوط ببراند (لو المتجر مسحه، الجلسة بتقف على طول)
  const { data, error } = await adminClient().auth.admin.getUserById(userId);
  const account = !error ? toAccount(data.user) : null;
  if (!account) return null;
  const partner = (await loadCatalogData()).partners.find((p) => p.id === account.partnerId);
  return partner ? { ...account, partner } : null;
});

/** في أول أي صفحة أو action في بوابة البراند */
export async function requireBrand(): Promise<BrandSession> {
  const s = await getBrandSession();
  if (!s) redirect("/brand/login");
  return s;
}

/** كلمة سر مؤقتة سهلة تتكتب وتتبعت على واتساب (من غير حروف شبه بعض) */
export function tempPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += abc[randomInt(abc.length)];
  for (let i = 0; i < 4; i++) s += digits[randomInt(digits.length)];
  return s;
}

/** البراند بيغيّر كلمة السر: لازم القديمة تكون صح */
export async function changeBrandPassword(s: BrandSession, current: string, next: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (next.length < 8) return { ok: false, error: "يجب أن تتكون كلمة المرور الجديدة من 8 أحرف أو أكثر" };
  if (next === current) return { ok: false, error: "يجب أن تختلف كلمة المرور الجديدة عن القديمة" };
  const { error } = await authClient().auth.signInWithPassword({ email: s.email, password: current });
  if (error) return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
  const { error: e2 } = await adminClient().auth.admin.updateUserById(s.userId, {
    password: next,
    app_metadata: { role: "brand", partner_id: s.partnerId, must_change_password: false },
  });
  return e2 ? { ok: false, error: "تعذّر تغيير كلمة المرور، حاول مرة أخرى" } : { ok: true };
}

// ───────────── إدارة الحسابات من لوحة المتجر ─────────────

export async function listBrandAccounts(): Promise<BrandAccount[]> {
  if (!brandAccountsAvailable()) return [];
  const out: BrandAccount[] = [];
  for (let page = 1; page < 20; page++) {
    const { data, error } = await adminClient().auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    for (const u of data.users) {
      const a = toAccount(u);
      if (a) out.push(a);
    }
    if (data.users.length < 200) break;
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createBrandAccount(partnerId: string, email: string): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  const password = tempPassword();
  const { error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "brand", partner_id: partnerId, must_change_password: true },
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return { ok: false, error: "هذا البريد الإلكتروني مسجّل بحساب بالفعل" };
    return { ok: false, error: `تعذّر إنشاء الحساب: ${error.message}` };
  }
  return { ok: true, password };
}

export async function resetBrandPassword(userId: string): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  const { data, error } = await adminClient().auth.admin.getUserById(userId);
  const a = !error ? toAccount(data.user) : null;
  if (!a) return { ok: false, error: "هذا الحساب غير موجود" };
  const password = tempPassword();
  const { error: e2 } = await adminClient().auth.admin.updateUserById(userId, {
    password,
    app_metadata: { role: "brand", partner_id: a.partnerId, must_change_password: true },
  });
  return e2 ? { ok: false, error: "تعذّر تغيير كلمة المرور" } : { ok: true, password };
}

export async function deleteBrandAccount(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await adminClient().auth.admin.getUserById(userId);
  if (error || !toAccount(data.user)) return { ok: false, error: "هذا الحساب غير موجود" };
  const { error: e2 } = await adminClient().auth.admin.deleteUser(userId);
  return e2 ? { ok: false, error: "تعذّر حذف الحساب" } : { ok: true };
}
