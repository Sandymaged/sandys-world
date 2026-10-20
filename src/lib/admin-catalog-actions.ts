"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { mutateCatalog, saveMedia, type ProductRecord } from "./db/catalog-store";
import { normalizeOptions, type ProductOption } from "./options";
import type { BridalRole, GiftPackage, Kit, KitCategory, Localized, PackageTier, Partner, RecipientTag } from "./types";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

// ───────────── قراية الفورم ─────────────

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => {
  const v = Number(str(f, k).replace(/,/g, ""));
  return Number.isFinite(v) ? v : NaN;
};
const bool = (f: FormData, k: string) => f.get(k) === "on";
const many = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean);
const lines = (f: FormData, k: string) => str(f, k).split("\n").map((l) => l.trim()).filter(Boolean);
const csv = (f: FormData, k: string) => str(f, k).split(/[,،]/).map((x) => x.trim()).filter(Boolean);

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** نسخة إنجليزي: بتتحفظ بس لو فيها حاجة */
function en(fields: Localized): Localized | undefined {
  const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => (Array.isArray(v) ? v.length : v)));
  return Object.keys(clean).length ? (clean as Localized) : undefined;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** صورة جديدة: ملف مرفوع أو لينك، وإلا الصور القديمة زي ما هي */
async function image(f: FormData, current: string[]): Promise<string[] | string> {
  const file = f.get("imageFile");
  if (file instanceof File && file.size > 0) {
    if (!IMAGE_TYPES.includes(file.type)) return "الصورة لازم تكون JPG أو PNG أو WEBP";
    if (file.size > 8 * 1024 * 1024) return "الصورة أكبر من 8 ميجا";
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    return [await saveMedia(`img.${ext}`, Buffer.from(await file.arrayBuffer())), ...current.slice(1)];
  }
  const url = str(f, "imageUrl");
  if (url && url !== current[0]) {
    if (!/^https:\/\/|^\/media\//.test(url)) return "لينك الصورة لازم يبدأ بـ https://";
    return [url, ...current.slice(1)];
  }
  return current;
}

function done(id: string): SaveResult {
  updateTag("catalog");
  return { ok: true, id };
}

// ───────────── المنتجات (FR-110) ─────────────

export async function saveProduct(id: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  const name = str(f, "name");
  const price = num(f, "price");
  const cost = num(f, "cost");
  if (!name) return { ok: false, error: "اكتبي اسم المنتج" };
  if (!(price > 0)) return { ok: false, error: "السعر لازم يكون رقم أكبر من صفر" };
  if (!(cost >= 0)) return { ok: false, error: "التكلفة لازم تكون رقم" };
  const slug = slugify(str(f, "slug") || str(f, "nameEn")) || `p-${Date.now().toString(36)}`;
  const customizable = bool(f, "isCustomizable");
  let options: ProductOption[] = [];
  try {
    options = normalizeOptions(JSON.parse(str(f, "options") || "[]"));
  } catch {
    return { ok: false, error: "في مشكلة في الاختيارات، راجعيها" };
  }

  return mutateCatalog(async (d) => {
    if (d.products.some((p) => p.slug === slug && p.id !== id)) return { ok: false as const, error: "الرابط ده مستخدم لمنتج تاني" };
    const existing = id ? d.products.find((p) => p.id === id) : undefined;
    if (id && !existing) return { ok: false as const, error: "المنتج ده مش موجود" };
    const images = await image(f, existing?.images ?? []);
    if (typeof images === "string") return { ok: false as const, error: images };
    const rec: ProductRecord = {
      id: existing?.id ?? randomUUID(),
      slug,
      name,
      description: str(f, "description"),
      images,
      price,
      cost,
      category: str(f, "category"),
      partnerId: str(f, "partnerId") || null,
      brand: null,
      occasions: many(f, "occasions"),
      recipients: many(f, "recipients") as RecipientTag[],
      interests: csv(f, "interests"),
      isCustomizable: customizable,
      customizationMaxChars: customizable ? Math.max(1, num(f, "customizationMaxChars") || 25) : null,
      prepDays: Math.max(0, Math.round(num(f, "prepDays") || 0)),
      isAvailable: bool(f, "isAvailable"),
      isAddon: bool(f, "isAddon"),
      boxEligible: bool(f, "boxEligible"),
      options: options.length ? options : undefined,
      stock: str(f, "stock") === "" ? null : Math.max(0, Math.round(num(f, "stock"))),
      en: en({ name: str(f, "nameEn"), description: str(f, "descriptionEn"), category: str(f, "categoryEn") }),
    };
    if (existing) Object.assign(existing, rec);
    else d.products.push(rec);
    return { ok: true as const, id: rec.id };
  }).then((r) => (r.ok ? done(r.id) : r));
}

export async function deleteProduct(id: string): Promise<SaveResult> {
  await requireAdmin();
  return mutateCatalog((d) => {
    const inPkg = d.packages.find((p) => p.items.some((i) => i.productId === id));
    if (inPkg) return { ok: false as const, error: `المنتج ده جوه باكدج "${inPkg.name}". شيليه من الباكدج الأول، أو خليه "مش متاح" بدل المسح.` };
    d.products = d.products.filter((p) => p.id !== id);
    return { ok: true as const, id };
  }).then((r) => (r.ok ? done(r.id) : r));
}

// ───────────── البراندات المحلية (FR-114) ─────────────

export async function saveBrand(id: string | null, f: FormData): Promise<SaveResult> {
  await requireAdmin();
  const name = str(f, "name");
  const rate = num(f, "commission");
  if (!name) return { ok: false, error: "اكتبي اسم البراند" };
  if (!(rate >= 0 && rate <= 100)) return { ok: false, error: "نسبة العمولة لازم تكون من 0 لـ 100" };
  const slug = slugify(str(f, "slug") || str(f, "nameEn")) || `b-${Date.now().toString(36)}`;

  return mutateCatalog(async (d) => {
    if (d.partners.some((b) => b.slug === slug && b.id !== id)) return { ok: false as const, error: "الرابط ده مستخدم لبراند تاني" };
    const existing = id ? d.partners.find((b) => b.id === id) : undefined;
    if (id && !existing) return { ok: false as const, error: "البراند ده مش موجود" };
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
      commissionRate: rate / 100,
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
    return { ok: false, error: "محتويات الباكدج مش مظبوطة" };
  }
  if (!name) return { ok: false, error: "اكتبي اسم الباكدج" };
  if (!(price > 0)) return { ok: false, error: "السعر لازم يكون رقم أكبر من صفر" };
  if (items.length === 0) return { ok: false, error: "اختاري منتج واحد على الأقل جوه الباكدج" };
  const slug = slugify(str(f, "slug") || str(f, "nameEn")) || `pk-${Date.now().toString(36)}`;
  const tier = (["latif", "momayaz", "fakher"].includes(str(f, "tier")) ? str(f, "tier") : "latif") as PackageTier;

  return mutateCatalog(async (d) => {
    if (d.packages.some((p) => p.slug === slug && p.id !== id)) return { ok: false as const, error: "الرابط ده مستخدم لباكدج تاني" };
    if (items.some((i) => !d.products.some((p) => p.id === i.productId))) return { ok: false as const, error: "فيه منتج في الباكدج مش موجود" };
    const existing = id ? d.packages.find((p) => p.id === id) : undefined;
    if (id && !existing) return { ok: false as const, error: "الباكدج ده مش موجود" };
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
  }).then((r) => (r.ok ? done(r.id) : r));
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
  if (!name) return { ok: false, error: "اكتبي اسم الكيت" };
  if (!(price > 0)) return { ok: false, error: "سعر الفرد لازم يكون رقم أكبر من صفر" };
  if (!(min >= 1 && max >= min)) return { ok: false, error: "أقل عدد لازم يكون 1 أو أكتر، وأكبر عدد مش أقل منه" };
  const slug = slugify(str(f, "slug") || str(f, "nameEn")) || `k-${Date.now().toString(36)}`;
  const category = (str(f, "category") === "bridal" ? "bridal" : "workshop") as KitCategory;
  const role = (["bride", "bridesmaid", "mother", "flower-girl"].includes(str(f, "role")) ? str(f, "role") : undefined) as BridalRole | undefined;

  return mutateCatalog(async (d) => {
    if (d.kits.some((k) => k.slug === slug && k.id !== id)) return { ok: false as const, error: "الرابط ده مستخدم لكيت تاني" };
    const existing = id ? d.kits.find((k) => k.id === id) : undefined;
    if (id && !existing) return { ok: false as const, error: "الكيت ده مش موجود" };
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
