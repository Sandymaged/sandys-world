import "server-only";
import * as seed from "./seed-data";
import { adminClient } from "./supabase/admin";
import type { Occasion, Season, Zone } from "./types";

/*
 * المناسبات والمواسم ومناطق التوصيل وأكواد الخصم زي ما اللوحة بتشوفها (كلها، حتى المقفولة).
 * التعديل عليهم على Supabase بس؛ من غيره بنعرض البيانات التجريبية للقراية.
 */

export const setupOnSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

export type AdminZone = Zone & { isActive: boolean };

export interface AdminCoupon {
  code: string;
  kind: "percent" | "amount";
  value: number;
  minOrder: number;
  expiresAt: string | null;
  maxUses: number | null;
  used: number;
  isActive: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- صفوف قاعدة البيانات */

export async function listOccasions(): Promise<Occasion[]> {
  if (!setupOnSupabase()) return seed.occasions;
  const { data, error } = await adminClient().from("occasions").select("*").order("sort");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({ slug: r.slug, name: r.name, sort: r.sort, image: r.image, en: r.en ?? undefined }));
}

export async function listSeasons(): Promise<Season[]> {
  if (!setupOnSupabase()) return seed.seasons;
  const { data, error } = await adminClient().from("seasons").select("*").order("occasion_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    en: r.en ?? undefined,
    slug: r.slug,
    name: r.name,
    occasionSlug: r.occasion_slug,
    occasionDate: r.occasion_date,
    customDeadline: r.custom_deadline,
    readyDeadline: r.ready_deadline,
    visibleFrom: r.visible_from,
    visibleUntil: r.visible_until,
    bannerTitle: r.banner_title ?? "",
    bannerSubtitle: r.banner_subtitle ?? "",
    bannerImage: r.banner_image,
  }));
}

export async function listZones(): Promise<AdminZone[]> {
  if (!setupOnSupabase()) return seed.zones.map((z) => ({ ...z, isActive: true }));
  const { data, error } = await adminClient().from("zones").select("*").order("sort");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    en: r.en ?? undefined,
    name: r.name,
    kind: r.kind,
    fee: Number(r.fee),
    sameDay: r.same_day,
    extraDays: r.extra_days,
    sort: r.sort,
    isActive: r.is_active,
  }));
}

export async function listCoupons(): Promise<AdminCoupon[]> {
  if (!setupOnSupabase()) return seed.coupons.map((c) => ({ ...c, used: 0, isActive: true }));
  const { data, error } = await adminClient().from("coupons").select("*").order("code");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    code: r.code,
    kind: r.kind,
    value: Number(r.value),
    minOrder: Number(r.min_order),
    expiresAt: r.expires_at,
    maxUses: r.max_uses,
    used: r.used_count,
    isActive: r.is_active,
  }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** يوم بتوقيت القاهرة (YYYY-MM-DD) من تاريخ ووقت محفوظ */
export function cairoDay(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date(iso));
}

/** يوم وساعة بتوقيت القاهرة → ISO بفرق التوقيت الصح (صيفي أو شتوي) */
export function cairoISO(day: string, time: string) {
  const offset =
    new Intl.DateTimeFormat("en", { timeZone: "Africa/Cairo", timeZoneName: "longOffset" })
      .formatToParts(new Date(`${day}T12:00:00Z`))
      .find((p) => p.type === "timeZoneName")
      ?.value.replace("GMT", "") || "+02:00";
  return `${day}T${time}:00${offset}`;
}
