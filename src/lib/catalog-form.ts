import "server-only";
import { randomUUID } from "node:crypto";
import { mutateCatalog, saveMedia, type ProductRecord } from "./db/catalog-store";
import { MAX_COMBOS, allCombos, comboKey, comboStock, normalizeOptions, usesCombos, type ProductOption } from "./options";
import { adminClient } from "./supabase/admin";
import type { Localized, RecipientTag } from "./types";

/*
 * قراية فورمات الكتالوج، وحفظ المنتج نفسه.
 * لوحة المتجر وبوابة البراند الاتنين بيحفظوا المنتج من هنا، والفرق في `ProductMode`.
 */

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export const num = (f: FormData, k: string) => {
  const v = Number(str(f, k).replace(/,/g, ""));
  return Number.isFinite(v) ? v : NaN;
};
export const bool = (f: FormData, k: string) => f.get(k) === "on";
export const many = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean);
export const lines = (f: FormData, k: string) => str(f, k).split("\n").map((l) => l.trim()).filter(Boolean);
export const csv = (f: FormData, k: string) => str(f, k).split(/[,،]/).map((x) => x.trim()).filter(Boolean);

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** نسخة إنجليزي: بتتحفظ بس لو فيها حاجة */
export function en(fields: Localized): Localized | undefined {
  const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => (Array.isArray(v) ? v.length : v)));
  return Object.keys(clean).length ? (clean as Localized) : undefined;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** صورة جديدة: ملف مرفوع أو لينك، وإلا الصور القديمة زي ما هي */
export async function image(f: FormData, current: string[]): Promise<string[] | string> {
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

export const MAX_PRODUCT_IMAGES = 5;

/**
 * صور المنتج (لحد 5) بالترتيب: «imagesOrder» فيها الصور القديمة اللي اتسابت (باللينك)
 * والجديدة كـ «file:رقم» من «imageFiles». الأولى هي اللي بتظهر في الكروت.
 */
export async function productImages(f: FormData, current: string[]): Promise<string[] | string> {
  let order: unknown;
  try {
    order = JSON.parse(str(f, "imagesOrder") || "[]");
  } catch {
    return "في مشكلة في الصور، حدّثي الصفحة وجربي تاني";
  }
  if (!Array.isArray(order)) return "في مشكلة في الصور";
  const files = f.getAll("imageFiles").filter((x): x is File => x instanceof File && x.size > 0);
  const out: string[] = [];
  for (const token of order.slice(0, MAX_PRODUCT_IMAGES)) {
    if (typeof token !== "string") continue;
    const m = /^file:(\d+)$/.exec(token);
    if (m) {
      const file = files[Number(m[1])];
      if (!file) continue;
      if (!IMAGE_TYPES.includes(file.type)) return "الصور لازم تكون JPG أو PNG أو WEBP";
      if (file.size > 5 * 1024 * 1024) return "صورة أكبر من 5 ميجا";
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      out.push(await saveMedia(`img.${ext}`, Buffer.from(await file.arrayBuffer())));
    } else if (current.includes(token) || /^https:\/\/|^\/media\//.test(token)) {
      out.push(token);
    } else return "لينك الصورة لازم يبدأ بـ https://";
  }
  return out;
}

/**
 * المتجر: كل الخانات (التكلفة والبراند والموافقة).
 * البراند: منتجاته بس، والمنتج الجديد بيستنى موافقة المتجر ومش بيظهر لحد ما يتوافق عليه.
 */
export type ProductMode = { by: "store" } | { by: "brand"; partnerId: string };

export async function upsertProduct(id: string | null, f: FormData, mode: ProductMode): Promise<SaveResult> {
  const name = str(f, "name");
  const price = num(f, "price");
  if (!name) return { ok: false, error: "اسم المنتج ناقص" };
  if (!(price > 0)) return { ok: false, error: "السعر لازم يكون رقم أكبر من صفر" };
  // التكلفة لمنتجات المتجر نفسه بس (لازم تتكتب). منتج البراند تكلفته نصيب البراند وبتتحسب لوحدها
  const ownProduct = mode.by === "store" && !str(f, "partnerId");
  const cost = ownProduct ? num(f, "cost") : 0;
  if (ownProduct && !(cost > 0)) return { ok: false, error: "اكتبي تكلفة المنتج (المنتج كلّفك كام)" };
  const customizable = bool(f, "isCustomizable");
  let options: ProductOption[] = [];
  try {
    options = normalizeOptions(JSON.parse(str(f, "options") || "[]"));
  } catch {
    return { ok: false, error: "في مشكلة في الاختيارات، راجعها" };
  }
  if (usesCombos(options) && options.reduce((n, o) => n * o.values.length, 1) > MAX_COMBOS) {
    return { ok: false, error: `التركيبات كتير أوي، أقصى حاجة ${MAX_COMBOS}. قلل القيم شوية` };
  }
  // البراند ماشي بالمخزون: لازم يكتب العدد اللي عنده، وأي طلب بيوصله يبقى عليه يجهّزه.
  // أول ما العدد يخلص المنتج (أو اللون/المقاس) بيتقفل «خلص» لوحده
  if (mode.by === "brand") {
    // مدة التجهيز بتاعة البراند هي اللي بتحدد أقرب يوم توصيل يظهر للعميل في الدفع
    if (str(f, "prepDays") === "" || !(num(f, "prepDays") >= 0)) return { ok: false, error: "اكتب المنتج بيتجهز في كام يوم" };
    if (usesCombos(options)) {
      const missing = allCombos(options)
        .filter((cs) => typeof comboStock(options, comboKey(cs)) !== "number")
        .map((cs) => cs.map((c) => options.find((o) => o.id === c.optionId)?.values.find((v) => v.id === c.valueId)?.label).join(" · "));
      if (missing.length) return { ok: false, error: `اكتب العدد اللي عندك من كل تركيبة (ناقص: ${missing.slice(0, 4).join("، ")})` };
    } else if (options.length) {
      const missing = options.flatMap((o) => o.values.filter((v) => typeof v.stock !== "number").map((v) => `${o.name}: ${v.label}`));
      if (missing.length) return { ok: false, error: `اكتب العدد اللي عندك من كل اختيار (ناقص: ${missing.slice(0, 4).join("، ")})` };
    } else if (str(f, "stock") === "" || !(num(f, "stock") >= 0)) {
      return { ok: false, error: "اكتب العدد اللي عندك من المنتج" };
    }
  }

  return mutateCatalog(async (d) => {
    const existing = id ? d.products.find((p) => p.id === id) : undefined;
    if (id && !existing) return { ok: false as const, error: "المنتج ده مش موجود" };
    if (mode.by === "brand" && existing && existing.partnerId !== mode.partnerId) return { ok: false as const, error: "المنتج ده مش بتاعك" };

    // البراند مش بيكتب رابط: بيتعمل من الاسم الإنجليزي، أو بيفضل زي ما هو
    const wanted = mode.by === "store" ? str(f, "slug") || str(f, "nameEn") : existing?.slug || str(f, "nameEn");
    let slug = slugify(wanted) || `p-${Date.now().toString(36)}`;
    if (d.products.some((p) => p.slug === slug && p.id !== id)) {
      if (mode.by === "store") return { ok: false as const, error: "الرابط ده مستخدم لمنتج تاني" };
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const images = f.has("imagesOrder") ? await productImages(f, existing?.images ?? []) : await image(f, existing?.images ?? []);
    if (typeof images === "string") return { ok: false as const, error: images };

    // المنتج الجديد من البراند بيستنى الموافقة، والمستني بيفضل مخفي مهما اتعلّم «متاح»
    // (undefined = منتج قديم ملوش الخانة دي، فمش بنبعتها خالص)
    let reviewStatus = existing ? existing.reviewStatus : mode.by === "brand" ? ("pending" as const) : undefined;
    if (mode.by === "store" && reviewStatus === "pending" && bool(f, "approve")) reviewStatus = null;
    const rec: ProductRecord = {
      id: existing?.id ?? randomUUID(),
      slug,
      name,
      description: str(f, "description"),
      images,
      price,
      cost: mode.by === "store" ? cost : (existing?.cost ?? 0),
      category: str(f, "category"),
      partnerId: mode.by === "brand" ? mode.partnerId : str(f, "partnerId") || null,
      brand: null,
      occasions: many(f, "occasions"),
      recipients: many(f, "recipients") as RecipientTag[],
      interests: csv(f, "interests"),
      isCustomizable: customizable,
      customizationMaxChars: customizable ? Math.max(1, num(f, "customizationMaxChars") || 25) : null,
      prepDays: Math.max(0, Math.round(num(f, "prepDays") || 0)),
      isAvailable: reviewStatus === "pending" ? false : bool(f, "isAvailable"),
      isAddon: mode.by === "store" ? bool(f, "isAddon") : (existing?.isAddon ?? false),
      boxEligible: bool(f, "boxEligible"),
      options: options.length ? options : undefined,
      // المنتج اللي ليه ألوان أو مقاسات العدد بتاعه جوه كل اختيار، مش على المنتج كله
      stock: options.length || str(f, "stock") === "" ? null : Math.max(0, Math.round(num(f, "stock"))),
      en: en({ name: str(f, "nameEn"), description: str(f, "descriptionEn"), category: str(f, "categoryEn") }),
      reviewStatus,
    };
    if (existing) Object.assign(existing, rec);
    else d.products.push(rec);
    return { ok: true as const, id: rec.id };
  }).then(async (r) => {
    if (!r.ok) return r;
    const kind = str(f, "customizationKind");
    const err = await saveCustomizationKind(r.id, customizable && (kind === "image" || kind === "both") ? kind : null);
    return err ? { ok: false as const, error: err } : r;
  });
}

const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

/** المنتج المخصص محتاج صورة؟ (settings.productCustomization، واللي مش متسجل كلام بس) */
async function saveCustomizationKind(productId: string, kind: "image" | "both" | null): Promise<string | null> {
  if (!onSupabase()) return null;
  const db = adminClient();
  const { data } = await db.from("settings").select("value").eq("key", "productCustomization").maybeSingle();
  const map = { ...((data?.value as Record<string, string> | undefined) ?? {}) };
  if ((map[productId] ?? null) === kind) return null;
  if (kind) map[productId] = kind;
  else delete map[productId];
  const { error } = await db.from("settings").upsert({ key: "productCustomization", value: map });
  return error ? `المنتج اتحفظ بس نوع التخصيص ماتحفظش: ${error.message}` : null;
}

export async function removeProduct(id: string, mode: ProductMode): Promise<SaveResult> {
  return mutateCatalog((d) => {
    const p = d.products.find((x) => x.id === id);
    if (!p) return { ok: false as const, error: "المنتج ده مش موجود" };
    if (mode.by === "brand" && p.partnerId !== mode.partnerId) return { ok: false as const, error: "المنتج ده مش بتاعك" };
    const inPkg = d.packages.find((x) => x.items.some((i) => i.productId === id));
    if (inPkg)
      return {
        ok: false as const,
        error:
          mode.by === "store"
            ? `المنتج ده جوه باكدج "${inPkg.name}". شيليه من الباكدج الأول، أو خليه "مش متاح" بدل المسح.`
            : "المنتج ده جوه باكدج عند المتجر، فمينفعش يتمسح. خليه «مش متاح» بدل كده، أو كلّم المتجر.",
      };
    d.products = d.products.filter((x) => x.id !== id);
    return { ok: true as const, id };
  });
}
