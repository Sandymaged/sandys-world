"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { bool, en, image, lines, many, num, removeProduct, slugify, str, upsertProduct, type SaveResult } from "./catalog-form";
import { mutateCatalog } from "./db/catalog-store";
import { adminClient } from "./supabase/admin";

const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
import type { BridalRole, GiftPackage, Kit, KitCategory, PackageTier, Partner, RecipientTag } from "./types";

export type { SaveResult } from "./catalog-form";

function done(id: string): SaveResult {
  updateTag("catalog");
  return { ok: true, id };
}

// ───────────── المنتجات (FR-110) ─────────────

export async function saveProduct(id: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  return upsertProduct(id, f, { by: "store" }).then((r) => (r.ok ? done(r.id) : r));
}

export async function deleteProduct(id: string): Promise<SaveResult> {
  await requireAdmin();
  return removeProduct(id, { by: "store" }).then((r) => (r.ok ? done(r.id) : r));
}

// ───────────── البراندات المحلية (FR-114) ─────────────

export async function saveBrand(id: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  const name = str(f, "name");
  if (!name) return { ok: false, error: "أدخل اسم العلامة التجارية" };
  const slug = slugify(str(f, "slug") || str(f, "nameEn")) || `b-${Date.now().toString(36)}`;

  return mutateCatalog(async (d) => {
    if (d.partners.some((b) => b.slug === slug && b.id !== id)) return { ok: false as const, error: "هذا الرابط مستخدم لعلامة تجارية أخرى" };
    const existing = id ? d.partners.find((b) => b.id === id) : undefined;
    if (id && !existing) return { ok: false as const, error: "هذه العلامة التجارية غير موجودة" };
    const images = await image(f, existing?.cover ? [existing.cover] : []);
    if (typeof images === "string") return { ok: false as const, error: images };
    const rec: Partner = {
      id: existing?.id ?? randomUUID(),
      slug,
      name,
      tagline: str(f, "tagline"),
      story: str(f, "story"),
      city: str(f, "city"),
      instagram: str(f, "instagram").replace(/^@/, "") || null,
      cover: images[0] ?? null,
      // العمولة بالشرايح الشهرية؛ النسبة دي احتياطي للحسابات القديمة بس ومش بتتعدل من اللوحة
      commissionRate: existing?.commissionRate ?? 0.2,
      en: { ...en({ name: str(f, "nameEn"), tagline: str(f, "taglineEn") }), ...(str(f, "storyEn") ? { story: str(f, "storyEn") } : {}), ...(str(f, "cityEn") ? { city: str(f, "cityEn") } : {}) },
    };
    if (existing) Object.assign(existing, rec);
    else d.partners.push(rec);
    return { ok: true as const, id: rec.id };
  }).then((r) => (r.ok ? done(r.id) : r));
}

// ───────────── الباكدجات (FR-111 / FR-113) ─────────────

export async function savePackage(id: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  const name = str(f, "name");
  const price = num(f, "price");
  let items: { productId: string; quantity: number }[] = [];
  try {
    items = (JSON.parse(str(f, "items") || "[]") as { productId: string; quantity: number }[])
      .filter((i) => i.productId && i.quantity > 0)
      .map((i) => ({ productId: String(i.productId), quantity: Math.round(i.quantity) }));
  } catch {
    return { ok: false, error: "محتويات الباقة غير صحيحة" };
  }
  if (!name) return { ok: false, error: "أدخل اسم الباقة" };
  if (!(price > 0)) return { ok: false, error: "يجب أن يكون السعر رقماً أكبر من صفر" };
  if (items.length === 0) return { ok: false, error: "اختر منتجاً واحداً على الأقل داخل الباقة" };
  const slug = slugify(str(f, "slug") || str(f, "nameEn")) || `pk-${Date.now().toString(36)}`;
  const tier = (["latif", "momayaz", "fakher"].includes(str(f, "tier")) ? str(f, "tier") : "latif") as PackageTier;

  return mutateCatalog(async (d) => {
    if (d.packages.some((p) => p.slug === slug && p.id !== id)) return { ok: false as const, error: "هذا الرابط مستخدم لباقة أخرى" };
    if (items.some((i) => !d.products.some((p) => p.id === i.productId))) return { ok: false as const, error: "يوجد منتج غير موجود في الباقة" };
    const existing = id ? d.packages.find((p) => p.id === id) : undefined;
    if (id && !existing) return { ok: false as const, error: "هذه الباقة غير موجودة" };
    const images = await image(f, existing?.images ?? []);
    if (typeof images === "string") return { ok: false as const, error: images };
    const rec: GiftPackage = {
      id: existing?.id ?? randomUUID(),
      slug,
      name,
      description: str(f, "description"),
      images,
      tier,
      price,
      seasonId: str(f, "seasonId") || null,
      occasions: many(f, "occasions"),
      recipients: many(f, "recipients") as RecipientTag[],
      items,
      isAvailable: bool(f, "isAvailable"),
      en: en({ name: str(f, "nameEn"), description: str(f, "descriptionEn") }),
    };
    if (existing) Object.assign(existing, rec);
    else d.packages.push(rec);
    return { ok: true as const, id: rec.id };
  }).then(async (r) => {
    if (!r.ok) return r;
    const err = await savePackageBoxes(r.id, many(f, "boxSizeIds"));
    return err ? { ok: false as const, error: err } : done(r.id);
  });
}

/** مقاسات البوكس اللي تنفع للباكدج (في settings.packageBoxes، بتتقري مع إعدادات المتجر) */
async function savePackageBoxes(packageId: string, boxIds: string[]): Promise<string | null> {
  if (!onSupabase()) return null;
  const db = adminClient();
  const { data } = await db.from("settings").select("value").eq("key", "packageBoxes").maybeSingle();
  const map = { ...((data?.value as Record<string, string[]> | undefined) ?? {}) };
  if (boxIds.length) map[packageId] = boxIds;
  else delete map[packageId];
  const { error } = await db.from("settings").upsert({ key: "packageBoxes", value: map });
  return error ? `حُفظت الباقة لكن تعذّر حفظ الصناديق: ${error.message}` : null;
}

export async function deletePackage(id: string): Promise<SaveResult> {
  await requireAdmin();
  return mutateCatalog((d) => {
    d.packages = d.packages.filter((p) => p.id !== id);
    return { ok: true as const, id };
  }).then((r) => done(r.id));
}

// ───────────── الكيتات وبوكسات العروسة ─────────────

export async function saveKit(id: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  const name = str(f, "name");
  const price = num(f, "pricePerPerson");
  const min = Math.round(num(f, "minPeople"));
  const max = Math.round(num(f, "maxPeople"));
  if (!name) return { ok: false, error: "أدخل اسم الطقم" };
  if (!(price > 0)) return { ok: false, error: "يجب أن يكون سعر الفرد رقماً أكبر من صفر" };
  if (!(min >= 1 && max >= min)) return { ok: false, error: "يجب أن يكون أقل عدد 1 أو أكثر، وألا يقل أكبر عدد عنه" };
  const slug = slugify(str(f, "slug") || str(f, "nameEn")) || `k-${Date.now().toString(36)}`;
  const category = (str(f, "category") === "bridal" ? "bridal" : "workshop") as KitCategory;
  const role = (["bride", "bridesmaid", "mother", "flower-girl"].includes(str(f, "role")) ? str(f, "role") : undefined) as BridalRole | undefined;

  return mutateCatalog(async (d) => {
    if (d.kits.some((k) => k.slug === slug && k.id !== id)) return { ok: false as const, error: "هذا الرابط مستخدم لطقم آخر" };
    const existing = id ? d.kits.find((k) => k.id === id) : undefined;
    if (id && !existing) return { ok: false as const, error: "هذا الطقم غير موجود" };
    const images = await image(f, existing?.images ?? []);
    if (typeof images === "string") return { ok: false as const, error: images };
    const rec: Kit = {
      id: existing?.id ?? randomUUID(),
      category,
      role: category === "bridal" ? role : undefined,
      slug,
      name,
      tagline: str(f, "tagline"),
      description: str(f, "description"),
      images,
      pricePerPerson: price,
      minPeople: min,
      maxPeople: max,
      contents: lines(f, "contents"),
      duration: str(f, "duration"),
      prepDays: Math.max(0, Math.round(num(f, "prepDays") || 0)),
      isAvailable: bool(f, "isAvailable"),
      en: en({ name: str(f, "nameEn"), tagline: str(f, "taglineEn"), description: str(f, "descriptionEn"), contents: lines(f, "contentsEn"), duration: str(f, "durationEn") }),
    };
    if (existing) Object.assign(existing, rec);
    else d.kits.push(rec);
    return { ok: true as const, id: rec.id };
  }).then((r) => (r.ok ? done(r.id) : r));
}

export async function deleteKit(id: string): Promise<SaveResult> {
  await requireAdmin();
  return mutateCatalog((d) => {
    d.kits = d.kits.filter((k) => k.id !== id);
    return { ok: true as const, id };
  }).then((r) => done(r.id));
}
