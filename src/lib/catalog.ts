import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/config";
import { DEFAULT_SETTINGS, type StoreSettings } from "./settings";
import { loadCatalogData } from "./db/catalog-store";
import * as seed from "./seed-data";
import { publicClient, supabaseConfigured } from "./supabase/public";
import type {
  BoxSize,
  GiftPackage,
  Brand,
  Kit,
  Localized,
  Occasion,
  Partner,
  PackageView,
  Product,
  RecipientTag,
  Season,
  Zone,
} from "./types";

interface Catalog {
  products: Product[];
  partners: Partner[];
  packages: GiftPackage[];
  kits: Kit[];
  seasons: Season[];
  boxSizes: BoxSize[];
  zones: Zone[];
  occasions: Occasion[];
  settings: StoreSettings;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- صفوف قاعدة البيانات */
async function loadFromSupabase(): Promise<Catalog> {
  const db = publicClient();
  const [products, partners, packages, kits, seasons, boxSizes, zones, occasions, settings] =
    await Promise.all([
      // التكلفة مخفية عن القراءة العامة (column grants)، فبنطلب الأعمدة المسموحة بس
      db
        .from("products")
        .select(
          "id, slug, name, description, images, price, category, partner_id, brand, occasions, recipients, interests, is_customizable, customization_max_chars, prep_days, is_available, is_addon, box_eligible, en",
        ),
      db.from("partners").select("id, slug, name, tagline, story, city, instagram, cover, en").eq("is_public", true),
      // نفس ترتيب المتغيرات اللي فوق بالظبط (packages قبل kits)
      db.from("packages").select("*, package_items(product_id, quantity)"),
      db.from("kits").select("*").order("sort"),
      db.from("seasons").select("*"),
      db.from("box_sizes").select("*").order("sort"),
      db.from("zones").select("*").eq("is_active", true).order("sort"),
      db.from("occasions").select("*").order("sort"),
      db.from("settings").select("key, value"),
    ]);
  for (const r of [products, partners, packages, kits, seasons, boxSizes, zones, occasions, settings]) {
    if (r.error) throw r.error;
  }
  const overrides = Object.fromEntries(
    (settings.data ?? []).map((s: any) => [s.key, s.value]),
  );
  return {
    products: (products.data ?? []).map(
      (r: any): Product => ({
        id: r.id,
        en: r.en ?? undefined,
        slug: r.slug,
        name: r.name,
        description: r.description ?? "",
        images: r.images ?? [],
        price: Number(r.price),
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
    packages: (packages.data ?? []).map(
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
        items: (r.package_items ?? []).map((i: any) => ({
          productId: i.product_id,
          quantity: i.quantity,
        })),
      }),
    ),
    partners: (partners.data ?? []).map(
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
        commissionRate: 0,
      }),
    ),
    kits: (kits.data ?? []).map(
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
    seasons: (seasons.data ?? []).map(
      (r: any): Season => ({
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
        bannerTitle: r.banner_title ?? r.name,
        bannerSubtitle: r.banner_subtitle ?? "",
        bannerImage: r.banner_image,
      }),
    ),
    boxSizes: (boxSizes.data ?? []).map(
      (r: any): BoxSize => ({
        id: r.id,
        en: r.en ?? undefined,
        name: r.name,
        price: Number(r.price),
        maxItems: r.max_items,
        sort: r.sort,
      }),
    ),
    zones: (zones.data ?? []).map(
      (r: any): Zone => ({
        id: r.id,
        en: r.en ?? undefined,
        name: r.name,
        kind: r.kind,
        fee: Number(r.fee),
        sameDay: r.same_day,
        extraDays: r.extra_days,
        sort: r.sort,
      }),
    ),
    occasions: (occasions.data ?? []).map((r: any): Occasion => ({ slug: r.slug, name: r.name, sort: r.sort, image: r.image, en: r.en ?? undefined })),
    settings: { ...DEFAULT_SETTINGS, ...overrides },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  if (!supabaseConfigured) {
    // المخزن المحلي (اللي لوحة التحكم بتعدّل فيه)، والتكلفة بتتشال قبل ما توصل لأي صفحة
    const data = await loadCatalogData();
    return {
      products: data.products.map((p) => {
        const { cost, ...pub } = p;
        void cost;
        return pub;
      }),
      partners: data.partners,
      packages: data.packages,
      kits: data.kits,
      seasons: seed.seasons,
      boxSizes: seed.boxSizes,
      zones: seed.zones,
      occasions: seed.occasions,
      settings: DEFAULT_SETTINGS,
    };
  }
  return loadFromSupabase();
}

export interface Storefront {
  products: Product[];
  brands: Brand[];
  packages: PackageView[];
  kits: Kit[];
  activeSeason: Season | null;
  boxSizes: BoxSize[];
  zones: Zone[];
  occasions: Occasion[];
  settings: StoreSettings;
}

/**
 * الكتالوج زي ما العميل المفروض يشوفه دلوقتي:
 * - المنتج اللي خلص بيختفي، وأي باكدج فيه منتج خلص بيختفي (FR-12)
 * - باكدجات الموسم بتظهر في فترة ظهوره بس، وبتتقفل بعد آخر ميعاد طلب (8.2)
 */
export async function getStorefront(): Promise<Storefront> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const c = await getCatalog();
  const now = Date.now();
  // اسم البراند على كل منتج من سجل الشركاء
  const partnerById = new Map(c.partners.map((b) => [b.id, b]));
  const withBrand = (p: Product): Product => {
    const b = p.partnerId ? partnerById.get(p.partnerId) : undefined;
    return b ? { ...p, brand: b.name, brandSlug: b.slug, en: p.en || b.en?.name ? { ...p.en, brand: b.en?.name } : undefined } : { ...p, brand: null, brandSlug: null };
  };
  const products = c.products.map(withBrand);
  const byId = new Map(products.map((p) => [p.id, p]));

  const seasonOpen = (s: Season) =>
    Date.parse(s.visibleFrom) <= now && now <= Date.parse(s.visibleUntil);

  const packages: PackageView[] = [];
  for (const p of c.packages) {
    if (!p.isAvailable) continue;
    const products = p.items.map((i) => {
      const prod = byId.get(i.productId);
      return prod ? { ...prod, quantity: i.quantity } : null;
    });
    if (products.some((x) => !x || !x.isAvailable)) continue;
    const list = products as (Product & { quantity: number })[];
    const season = c.seasons.find((s) => s.id === p.seasonId) ?? null;
    if (season) {
      const hasCustom = list.some((x) => x.isCustomizable);
      const deadline = hasCustom ? season.customDeadline : season.readyDeadline;
      if (!seasonOpen(season) || now > Date.parse(deadline)) continue;
    }
    packages.push({
      ...p,
      products: list,
      prepDays: Math.max(0, ...list.map((x) => x.prepDays)),
      season,
    });
  }

  const activeSeason =
    c.seasons
      .filter(seasonOpen)
      .sort((a, b) => a.occasionDate.localeCompare(b.occasionDate))[0] ?? null;

  const available = products.filter((p) => p.isAvailable);
  const brands: Brand[] = c.partners
    .map((b): Brand => ({ id: b.id, slug: b.slug, name: b.name, tagline: b.tagline, story: b.story, city: b.city, instagram: b.instagram, cover: b.cover, en: b.en, productCount: available.filter((p) => p.partnerId === b.id).length }))
    .filter((b) => b.productCount > 0);

  return {
    products: available,
    brands,
    packages,
    kits: c.kits.filter((k) => k.isAvailable),
    activeSeason,
    boxSizes: c.boxSizes,
    zones: c.zones,
    occasions: c.occasions,
    settings: c.settings,
  };
}

export interface BrowseFilter {
  q?: string;
  occasion?: string;
  recipient?: RecipientTag;
  maxPrice?: number;
  minPrice?: number;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ً-ْ]/g, "");

export function filterCatalog(sf: Storefront, f: BrowseFilter) {
  const q = f.q ? normalize(f.q.trim()) : "";
  const matchText = (...fields: string[]) =>
    !q || fields.some((x) => normalize(x).includes(q));
  const inPrice = (price: number) =>
    (f.minPrice == null || price >= f.minPrice) &&
    (f.maxPrice == null || price <= f.maxPrice);

  const packages = sf.packages.filter(
    (p) =>
      (!f.occasion || p.occasions.includes(f.occasion)) &&
      (!f.recipient || p.recipients.includes(f.recipient)) &&
      inPrice(p.price) &&
      matchText(p.name, p.description, ...p.products.map((x) => x.name)),
  );
  const products = sf.products.filter(
    (p) =>
      (!f.occasion || p.occasions.includes(f.occasion)) &&
      (!f.recipient || p.recipients.includes(f.recipient)) &&
      inPrice(p.price) &&
      matchText(p.name, p.description, p.category, ...p.interests),
  );
  return { packages, products };
}

/** النسخة المترجمة من أي عنصر: الحقول الإنجليزي فوق العربي لو موجودة */
export function loc<T extends { en?: Localized }>(x: T, l: Locale): T {
  return l === "ar" || !x.en ? x : { ...x, ...x.en };
}

/** الكتالوج بلغة الصفحة الحالية (للصفحات، مش لـ generateStaticParams) */
export async function getLocalizedStorefront(): Promise<Storefront> {
  const { getLocale } = await import("@/i18n/server");
  return localizeStorefront(await getStorefront(), await getLocale());
}

export function localizeStorefront(sf: Storefront, l: Locale): Storefront {
  if (l === "ar") return sf;
  return {
    ...sf,
    products: sf.products.map((p) => loc(p, l)),
    brands: sf.brands.map((b) => loc(b, l)),
    packages: sf.packages.map((p) => ({
      ...loc(p, l),
      products: p.products.map((x) => loc(x, l)),
      season: p.season && loc(p.season, l),
    })),
    kits: sf.kits.map((k) => loc(k, l)),
    activeSeason: sf.activeSeason && loc(sf.activeSeason, l),
    boxSizes: sf.boxSizes.map((b) => loc(b, l)),
    zones: sf.zones.map((z) => loc(z, l)),
    occasions: sf.occasions.map((o) => loc(o, l)),
  };
}
