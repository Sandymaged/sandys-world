import "server-only";
import { createHash } from "node:crypto";
import { adminClient } from "./supabase/admin";

/*
 * أقصى خصم على الباقات الجاهزة لكل كود (settings.couponPackageCaps).
 * جدول settings مقروء للعامة، فالمفتاح بصمة للكود (sha256) مش الكود نفسه.
 * الكود اللي مش موجود هنا = خصم بلا حد على الباقات (زي الأول).
 */

export const COUPON_CAPS_KEY = "couponPackageCaps";

export function couponCapKey(code: string): string {
  return createHash("sha256").update(`coupon:${code.trim().toUpperCase()}`).digest("hex").slice(0, 24);
}

const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

export async function loadCouponCaps(): Promise<Record<string, number>> {
  if (!onSupabase()) return {};
  const { data } = await adminClient().from("settings").select("value").eq("key", COUPON_CAPS_KEY).maybeSingle();
  return { ...((data?.value as Record<string, number> | undefined) ?? {}) };
}

/** الحد الأقصى لكود معيّن (undefined = بلا حد) */
export function capFor(caps: Record<string, number>, code: string): number | undefined {
  const v = caps[couponCapKey(code)];
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined;
}

/** حفظ أو مسح الحد لكود (null = بلا حد). بيرجّع رسالة خطأ أو null */
export async function saveCouponCap(code: string, cap: number | null): Promise<string | null> {
  if (!onSupabase()) return null;
  const caps = await loadCouponCaps();
  const k = couponCapKey(code);
  if ((caps[k] ?? null) === cap) return null;
  if (cap == null) delete caps[k];
  else caps[k] = cap;
  const { error } = await adminClient().from("settings").upsert({ key: COUPON_CAPS_KEY, value: caps });
  return error ? error.message : null;
}
