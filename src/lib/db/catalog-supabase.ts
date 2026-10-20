import "server-only";
import { adminClient } from "../supabase/admin";
import type { GiftPackage, Kit, Partner } from "../types";
import type { CatalogData, ProductRecord } from "./catalog-store";

/*
 * الكتالوج اللي لوحة التحكم بتعدّله، على Supabase (بالمفتاح السري: فيه التكلفة والعمولة).
 * التعديل بيتعمل على نسخة كاملة زي المخزن المحلي، وبعدين بنحفظ اللي اتغير بس صف صف.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- صفوف قاعدة البيانات */

const db = () => adminClient();
const IMAGES = "product-images";

function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

const productRow = (p: ProductRecord) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  images: p.images,
  price: p.price,
  cost: p.cost,
  category: p.category,
  partner_id: p.partnerId,
  brand: p.brand,
  occasions: p.occasions,
  recipients: p.recipients,
  interests: p.interests,
  is_customizable: p.isCustomizable,
  customization_max_chars: p.customizationMaxChars,
  prep_days: p.prepDays,
  is_available: p.isAvailable,
  is_addon: p.isAddon,
  box_eligible: p.boxEligible,
  en: p.en ?? null,
});

const partnerRow = (p: Partner) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  tagline: p.tagline,
  story: p.story,
  city: p.city,
  instagram: p.instagram,
  cover: p.cover,
  commission_rate: p.commissionRate,
  en: p.en ?? null,
});

const packageRow = (p: GiftPackage) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  images: p.images,
  tier: p.tier,
  price: p.price,
  season_id: p.seasonId,
  occasions: p.occasions,
  recipients: p.recipients,
  is_available: p.isAvailable,
  en: p.en ?? null,
});

const kitRow = (k: Kit) => ({
  id: k.id,
  category: k.category,
  role: k.role ?? null,
  slug: k.slug,
  name: k.name,
  tagline: k.tagline,
  description: k.description,
  images: k.images,
  price_per_person: k.pricePerPerson,
  min_people: k.minPeople,
  max_people: k.maxPeople,
  contents: k.contents,
  duration: k.duration,
  prep_days: k.prepDays,
  is_available: k.isAvailable,
  en: k.en ?? null,
});

export async function loadCatalogFromSupabase(): Promise<CatalogData> {
  const [products, partners, packages, kits] = await Promise.all([
    db().from("products").select("*").order("created_at"),
    db().from("partners").select("*").order("created_at"),
    db().from("packages").select("*, package_items(product_id, quantity)").order("created_at"),
    db().from("kits").select("*").order("sort"),
  ]);
  return {
    products: (check(products) ?? []).map(
      (r: any): ProductRecord => ({
        id: r.id,
        en: r.en ?? undefined,
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        images: r.images ?? [],
        price: Number(r.price),
        cost: Number(r.cost ?? 0),
        category: r.category ?? "",
        partnerId: r.partner_id,
        brand: r.brand,
        occasions: r.occasions ?? [],
        recipients: r.recipients ?? [],
        interests: r.interests ?? [],
        isCustomizable: r.is_customizable,
        customizationMaxChars: r.customization_max_chars,
        prepDays: r.prep_days,
        isAvailable: r.is_available,
        isAddon: r.is_addon,
        boxEligible: r.box_eligible,
      }),
    ),
    partners: (check(partners) ?? []).map(
      (r: any): Partner => ({
        id: r.id,
        en: r.en ?? undefined,
        slug: r.slug,
        name: r.name,
        tagline: r.tagline ?? "",
        story: r.story ?? "",
        city: r.city ?? "",
        instagram: r.instagram,
        cover: r.cover,
        commissionRate: Number(r.commission_rate),
      }),
    ),
    packages: (check(packages) ?? []).map(
      (r: any): GiftPackage => ({
        id: r.id,
        en: r.en ?? undefined,
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        images: r.images ?? [],
        tier: r.tier,
        price: Number(r.price),
        seasonId: r.season_id,
        occasions: r.occasions ?? [],
        recipients: r.recipients ?? [],
        isAvailable: r.is_available,
        items: (r.package_items ?? []).map((i: any) => ({ productId: i.product_id, quantity: i.quantity })),
      }),
    ),
    kits: (check(kits) ?? []).map(
      (r: any): Kit => ({
        id: r.id,
        en: r.en ?? undefined,
        slug: r.slug,
        name: r.name,
        category: r.category ?? "workshop",
        role: r.role ?? undefined,
        tagline: r.tagline ?? "",
        description: r.description ?? "",
        images: r.images ?? [],
        pricePerPerson: Number(r.price_per_person),
        minPeople: r.min_people,
        maxPeople: r.max_people,
        contents: r.contents ?? [],
        duration: r.duration ?? "",
        prepDays: r.prep_days,
        isAvailable: r.is_available,
      }),
    ),
  };
}

/** اللي اتغير أو اتضاف (بالمقارنة بالنسخة القديمة) واللي اتمسح */
function diff<T extends { id: string }>(before: T[], after: T[]) {
  const old = new Map(before.map((x) => [x.id, JSON.stringify(x)]));
  const ids = new Set(after.map((x) => x.id));
  return {
    changed: after.filter((x) => old.get(x.id) !== JSON.stringify(x)),
    removed: before.filter((x) => !ids.has(x.id)).map((x) => x.id),
  };
}

/** بيحفظ الفرق بين النسختين على Supabase بالترتيب الصح (عشان العلاقات بين الجداول) */
export async function saveCatalogDiff(before: CatalogData, after: CatalogData) {
  const partners = diff(before.partners, after.partners);
  const products = diff(before.products, after.products);
  const packages = diff(before.packages, after.packages);
  const kits = diff(before.kits, after.kits);

  if (partners.changed.length) check(await db().from("partners").upsert(partners.changed.map(partnerRow)));
  if (products.changed.length) check(await db().from("products").upsert(products.changed.map(productRow)));
  if (packages.changed.length) {
    check(await db().from("packages").upsert(packages.changed.map(packageRow)));
    // منتجات الباكدج: بنمسح القديم ونحط الجديد للباكدجات اللي اتغيرت
    const ids = packages.changed.map((p) => p.id);
    check(await db().from("package_items").delete().in("package_id", ids));
    const items = packages.changed.flatMap((p) => p.items.map((i) => ({ package_id: p.id, product_id: i.productId, quantity: i.quantity })));
    if (items.length) check(await db().from("package_items").insert(items));
  }
  if (kits.changed.length) check(await db().from("kits").upsert(kits.changed.map(kitRow)));

  // المسح: الباكدجات الأول (منتجاتها بتتمسح معاها)، وبعدها المنتجات والبراندات
  if (packages.removed.length) check(await db().from("packages").delete().in("id", packages.removed));
  if (kits.removed.length) check(await db().from("kits").delete().in("id", kits.removed));
  if (products.removed.length) check(await db().from("products").delete().in("id", products.removed));
  if (partners.removed.length) check(await db().from("partners").delete().in("id", partners.removed));
}

/** صور المنتجات والبراندات في bucket عام، وبيرجع لينك الصورة */
export async function uploadCatalogImage(name: string, data: Buffer): Promise<string> {
  const safe = `${Date.now()}-${name.replace(/[^\w.-]/g, "_")}`;
  const ext = safe.split(".").pop()?.toLowerCase();
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
  check(await db().storage.from(IMAGES).upload(safe, data, { contentType, upsert: false }));
  return db().storage.from(IMAGES).getPublicUrl(safe).data.publicUrl;
}
