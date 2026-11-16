"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { bool, en, image, num, slugify, str, type SaveResult } from "./catalog-form";
import { cairoISO, listOccasions, listSeasons, setupOnSupabase } from "./store-setup";
import { adminClient } from "./supabase/admin";
import type { ZoneKind } from "./types";

const NEED_DB = "يتطلب التعديل هنا ربط Supabase";
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function done(id: string): SaveResult {
  updateTag("catalog");
  return { ok: true, id };
}

/** رسالة مفهومة بدل رسالة قاعدة البيانات */
function dbError(e: { code?: string; message: string }, inUse: string): SaveResult {
  if (e.code === "23503") return { ok: false, error: inUse };
  if (e.code === "23505") return { ok: false, error: "يوجد عنصر آخر بنفس الرابط أو الكود" };
  return { ok: false, error: `تعذّر الحفظ: ${e.message}` };
}

// ───────────── المناسبات ─────────────

export async function saveOccasion(slug: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const name = str(f, "name");
  if (!name) return { ok: false, error: "أدخل اسم المناسبة" };
  const all = await listOccasions();
  const existing = slug ? all.find((o) => o.slug === slug) : undefined;
  if (slug && !existing) return { ok: false, error: "هذه المناسبة غير موجودة" };
  const newSlug = existing?.slug ?? (slugify(str(f, "slug") || str(f, "nameEn")) || `o-${Date.now().toString(36)}`);
  if (!existing && all.some((o) => o.slug === newSlug)) return { ok: false, error: "هذا الرابط مستخدم لمناسبة أخرى" };
  const images = await image(f, existing?.image ? [existing.image] : []);
  if (typeof images === "string") return { ok: false, error: images };
  const sort = num(f, "sort");
  const row = {
    slug: newSlug,
    name,
    image: images[0] ?? null,
    sort: Number.isFinite(sort) ? Math.round(sort) : (existing?.sort ?? all.length + 1),
    en: en({ name: str(f, "nameEn") }) ?? null,
  };
  const { error } = await adminClient().from("occasions").upsert(row);
  return error ? dbError(error, "") : done(newSlug);
}

export async function deleteOccasion(slug: string): Promise<SaveResult> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const { error } = await adminClient().from("occasions").delete().eq("slug", slug);
  return error ? dbError(error, "هذه المناسبة مستخدمة، احذفها من المواسم أولاً") : done(slug);
}

// ───────────── المواسم ─────────────

export async function saveSeason(id: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const name = str(f, "name");
  if (!name) return { ok: false, error: "أدخل اسم الموسم" };
  const day = str(f, "occasionDate");
  const from = str(f, "visibleFrom");
  const until = str(f, "visibleUntil") || day;
  const custom = str(f, "customDeadline");
  const ready = str(f, "readyDeadline");
  if (![day, from, custom, ready].every((d) => DAY.test(d))) return { ok: false, error: "يجب إدخال جميع التواريخ" };
  if (from > until) return { ok: false, error: "يجب أن يكون أول يوم ظهور قبل آخر يوم" };
  if (custom > ready) return { ok: false, error: "يجب أن يكون آخر موعد للمخصص قبل آخر موعد للجاهز (أو في اليوم نفسه)" };
  if (ready > until) return { ok: false, error: "يجب أن يكون آخر موعد للطلب قبل اختفاء الموسم" };

  const all = await listSeasons();
  const existing = id ? all.find((s) => s.id === id) : undefined;
  if (id && !existing) return { ok: false, error: "هذا الموسم غير موجود" };
  const slug = existing?.slug ?? (slugify(str(f, "nameEn")) || `s-${Date.now().toString(36)}`);
  const images = await image(f, existing?.bannerImage ? [existing.bannerImage] : []);
  if (typeof images === "string") return { ok: false, error: images };
  const row = {
    ...(existing ? { id: existing.id } : {}),
    slug,
    name,
    occasion_slug: str(f, "occasionSlug") || null,
    occasion_date: day,
    visible_from: cairoISO(from, "00:00"),
    visible_until: cairoISO(until, "23:59"),
    custom_deadline: cairoISO(custom, "21:00"),
    ready_deadline: cairoISO(ready, "21:00"),
    banner_title: str(f, "bannerTitle") || name,
    banner_subtitle: str(f, "bannerSubtitle"),
    banner_image: images[0] ?? null,
    en: en({ name: str(f, "nameEn"), bannerTitle: str(f, "bannerTitleEn"), bannerSubtitle: str(f, "bannerSubtitleEn") }) ?? null,
  };
  const { data, error } = await adminClient().from("seasons").upsert(row).select("id").single();
  return error ? dbError(error, "") : done(data.id);
}

export async function deleteSeason(id: string): Promise<SaveResult> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  // الباكدجات اللي عليه بترجع باكدجات عادية (season_id بيتمسح لوحده)
  const { error } = await adminClient().from("seasons").delete().eq("id", id);
  return error ? dbError(error, "") : done(id);
}

// ───────────── مناطق التوصيل ─────────────

const KINDS: ZoneKind[] = ["city", "markaz", "governorate"];

export async function saveZone(id: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const name = str(f, "name");
  const kind = str(f, "kind") as ZoneKind;
  const fee = num(f, "fee");
  const extraDays = num(f, "extraDays") || 0;
  const sort = num(f, "sort");
  if (!name) return { ok: false, error: "أدخل اسم المنطقة" };
  if (!KINDS.includes(kind)) return { ok: false, error: "اختر نوع المنطقة" };
  if (!(fee >= 0)) return { ok: false, error: "يجب أن تكون رسوم التوصيل رقماً" };
  if (!(extraDays >= 0 && extraDays <= 14)) return { ok: false, error: "يجب أن تكون الأيام الإضافية من 0 إلى 14" };
  const row = {
    ...(id ? { id } : {}),
    name,
    kind,
    fee: Math.round(fee),
    same_day: bool(f, "sameDay"),
    extra_days: Math.round(extraDays),
    sort: Number.isFinite(sort) ? Math.round(sort) : 0,
    is_active: bool(f, "isActive"),
    en: en({ name: str(f, "nameEn") }) ?? null,
  };
  const { data, error } = await adminClient().from("zones").upsert(row).select("id").single();
  return error ? dbError(error, "") : done(data.id);
}

export async function deleteZone(id: string): Promise<SaveResult> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const { error } = await adminClient().from("zones").delete().eq("id", id);
  return error ? dbError(error, "توجد طلبات سابقة على هذه المنطقة، أغلقها بدلاً من حذفها") : done(id);
}

// ───────────── خصم الجروبات على الكيتات ─────────────

export async function saveGroupDiscounts(f: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const tiers: { minQty: number; rate: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const qty = str(f, `qty_${i}`);
    const pct = str(f, `pct_${i}`);
    if (!qty && !pct) continue;
    const q = num(f, `qty_${i}`);
    const p = num(f, `pct_${i}`);
    if (!(Number.isInteger(q) && q >= 2 && q <= 200)) return { ok: false, error: `الشريحة ${i + 1}: يجب أن يكون العدد رقماً صحيحاً من 2 إلى 200` };
    if (!(p > 0 && p <= 50)) return { ok: false, error: `الشريحة ${i + 1}: يجب أن يكون الخصم من 1 إلى 50٪` };
    if (tiers.some((t) => t.minQty === q)) return { ok: false, error: `العدد ${q} مكرر في شريحتين` };
    tiers.push({ minQty: q, rate: Math.round(p * 10) / 1000 });
  }
  tiers.sort((a, b) => a.minQty - b.minQty);
  // العدد الأكبر لازم خصمه أكبر، وإلا العميل اللي بيزوّد ياخد خصم أقل
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].rate <= tiers[i - 1].rate) return { ok: false, error: `يجب أن يكون خصم ${tiers[i].minQty} أكبر من خصم ${tiers[i - 1].minQty}` };
  }
  const enabled = bool(f, "enabled");
  if (enabled && !tiers.length) return { ok: false, error: "أضف شريحة واحدة على الأقل، أو أوقف الخصم" };
  const { error } = await adminClient()
    .from("settings")
    .upsert([
      { key: "groupDiscounts", value: { enabled, tiers } },
      { key: "weddingDiscounts", value: enabled ? tiers : [] },
    ]);
  if (error) return { ok: false, error: `تعذّر الحفظ: ${error.message}` };
  updateTag("catalog");
  return { ok: true };
}

// ───────────── بيانات الدفع بإنستاباي ─────────────

export async function saveInstapay(f: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const address = str(f, "address").slice(0, 60);
  const phone = str(f, "phone").replace(/[^\d+]/g, "").slice(0, 15);
  const link = str(f, "link").slice(0, 300);
  const holderName = str(f, "holderName").slice(0, 60);
  if (!address && !phone) return { ok: false, error: "أدخل عنوان إنستاباي أو رقم الهاتف على الأقل" };
  if (phone && !/^(\+20|0)1[0125]\d{8}$/.test(phone)) return { ok: false, error: "رقم الهاتف غير صحيح (01xxxxxxxxx)" };
  if (link && !/^https:\/\//.test(link)) return { ok: false, error: "يجب أن يبدأ رابط الدفع بـ https://" };
  const { error } = await adminClient().from("settings").upsert({ key: "instapay", value: { address, phone, link, holderName } });
  if (error) return { ok: false, error: `تعذّر الحفظ: ${error.message}` };
  updateTag("catalog");
  return { ok: true };
}

// ───────────── بيانات تواصل المتجر ─────────────

export async function saveContact(f: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const whatsapp = str(f, "whatsapp").replace(/[^\d+]/g, "").slice(0, 15);
  const instagram = str(f, "instagram").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "").slice(0, 40);
  const website = str(f, "website").trim().slice(0, 200);
  if (whatsapp && !/^(\+20|0)1[0125]\d{8}$/.test(whatsapp)) return { ok: false, error: "رقم واتساب غير صحيح (01xxxxxxxxx)" };
  if (instagram && !/^[A-Za-z0-9._]+$/.test(instagram)) return { ok: false, error: "اسم حساب إنستجرام يحتوي على أحرف غير صالحة" };
  if (website && !/^https?:\/\/\S+\.\S+$/.test(website)) return { ok: false, error: "يجب أن يبدأ رابط الموقع بـ https://" };
  const { error } = await adminClient().from("settings").upsert({ key: "contact", value: { whatsapp, instagram, website } });
  if (error) return { ok: false, error: `تعذّر الحفظ: ${error.message}` };
  updateTag("catalog");
  return { ok: true };
}

// ───────────── أكواد الخصم ─────────────

export async function saveCoupon(code: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const c = code ?? str(f, "code").toUpperCase();
  if (!/^[A-Z0-9-]{3,20}$/.test(c)) return { ok: false, error: "يجب أن يتكون الكود من 3 إلى 20 حرفاً إنجليزياً أو رقماً" };
  const kind = str(f, "kind") === "amount" ? "amount" : "percent";
  const value = num(f, "value");
  if (!(value > 0)) return { ok: false, error: "يجب أن تكون قيمة الخصم أكبر من صفر" };
  if (kind === "percent" && value > 100) return { ok: false, error: "لا يمكن أن تزيد النسبة على 100٪" };
  const minOrder = num(f, "minOrder") || 0;
  if (!(minOrder >= 0)) return { ok: false, error: "يجب أن يكون الحد الأدنى رقماً" };
  const expires = str(f, "expiresAt");
  if (expires && !DAY.test(expires)) return { ok: false, error: "تاريخ الانتهاء غير صحيح" };
  const maxUses = str(f, "maxUses") ? num(f, "maxUses") : null;
  if (maxUses != null && !(maxUses >= 1)) return { ok: false, error: "يجب أن يكون عدد المرات 1 أو أكثر، أو اتركه فارغاً" };

  const db = adminClient();
  if (!code) {
    const { data } = await db.from("coupons").select("code").eq("code", c).maybeSingle();
    if (data) return { ok: false, error: "هذا الكود موجود بالفعل" };
  }
  const { error } = await db.from("coupons").upsert({
    code: c,
    kind,
    value,
    min_order: Math.round(minOrder),
    expires_at: expires ? cairoISO(expires, "23:59") : null,
    max_uses: maxUses == null ? null : Math.round(maxUses),
    is_active: bool(f, "isActive"),
  });
  return error ? dbError(error, "") : done(c);
}

export async function deleteCoupon(code: string): Promise<SaveResult> {
  await requireAdmin();
  if (!setupOnSupabase()) return { ok: false, error: NEED_DB };
  const { error } = await adminClient().from("coupons").delete().eq("code", code);
  return error ? dbError(error, "هذا الكود استُخدم في طلبات، أوقفه بدلاً من حذفه") : done(code);
}
