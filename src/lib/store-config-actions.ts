"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { saveMedia } from "./db/catalog-store";
import { loadStoreConfig, saveStoreConfig } from "./store-config";
import type { WrappingOption } from "./settings";
import type { BoxSize } from "./types";

export type ConfigResult = { ok: true } | { ok: false; error: string };

const MAX_IMAGE = 5 * 1024 * 1024;

/** صورة مرفوعة من الفورم (لو فيه)، أو اللينك المكتوب */
async function imageFor(f: FormData, field: string, url: unknown): Promise<string | null | { error: string }> {
  const file = f.get(field);
  if (file instanceof File && file.size > 0) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { error: "الصورة لازم تكون JPG أو PNG أو WebP" };
    if (file.size > MAX_IMAGE) return { error: "الصورة أكبر من 5 ميجا" };
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    return saveMedia(`box.${ext}`, Buffer.from(await file.arrayBuffer()));
  }
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return null;
  if (!/^(https:\/\/|\/media\/)/.test(s)) return { error: "لينك الصورة لازم يبدأ بـ https://" };
  return s;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- JSON جاي من الفورم */

/** حفظ مقاسات البوكسات ونسبة التغليف واختيارات التغليف */
export async function saveStoreConfigAction(f: FormData): Promise<ConfigResult> {
  await requireAdmin();
  let rawBoxes: any[] = [];
  let rawWraps: any[] = [];
  try {
    rawBoxes = JSON.parse(String(f.get("boxes") ?? "[]"));
    rawWraps = JSON.parse(String(f.get("wrappings") ?? "[]"));
  } catch {
    return { ok: false, error: "في مشكلة في البيانات، حدّثي الصفحة وجربي تاني" };
  }

  const boxSizes: BoxSize[] = [];
  for (const [i, b] of rawBoxes.entries()) {
    const name = String(b?.name ?? "").trim().slice(0, 40);
    if (!name) continue;
    const price = Math.round(Number(b?.price));
    const maxItems = Math.round(Number(b?.maxItems));
    if (!(price >= 0)) return { ok: false, error: `سعر بوكس «${name}» مش مظبوط` };
    if (!(maxItems >= 1 && maxItems <= 30)) return { ok: false, error: `بوكس «${name}» لازم يساع من 1 لـ 30 حاجة` };
    const image = await imageFor(f, `bimg_${i}`, b?.image);
    if (image && typeof image === "object") return { ok: false, error: image.error };
    const nameEn = String(b?.nameEn ?? "").trim().slice(0, 40);
    boxSizes.push({
      id: String(b?.id ?? ""),
      name,
      en: nameEn ? { name: nameEn } : undefined,
      price,
      maxItems,
      sort: i,
      image,
      description: String(b?.description ?? "").trim().slice(0, 160),
      isActive: b?.isActive !== false,
    });
  }
  if (!boxSizes.some((b) => b.isActive)) return { ok: false, error: "لازم يفضل بوكس واحد على الأقل مفتوح" };

  const wrappings: WrappingOption[] = [];
  const seen = new Set<string>();
  for (const [i, w] of rawWraps.entries()) {
    const name = String(w?.name ?? "").trim().slice(0, 40);
    if (!name) continue;
    let id = String(w?.id ?? "").trim() || `w${Date.now().toString(36)}${i}`;
    while (seen.has(id)) id = `${id}-${i}`;
    seen.add(id);
    const image = await imageFor(f, `wimg_${i}`, w?.image);
    if (image && typeof image === "object") return { ok: false, error: image.error };
    wrappings.push({
      id,
      name,
      en: String(w?.en ?? "").trim().slice(0, 40) || undefined,
      price: Math.max(0, Math.round(Number(w?.price) || 0)),
      image,
      description: String(w?.description ?? "").trim().slice(0, 120),
      descriptionEn: String(w?.descriptionEn ?? "").trim().slice(0, 120) || undefined,
    });
  }
  if (!wrappings.length) return { ok: false, error: "لازم يبقى فيه اختيار تغليف واحد على الأقل (العادي)" };

  const rate = Number(f.get("rate"));
  const min = Number(f.get("min"));
  const max = Number(f.get("max"));
  if (!(rate >= 0 && rate <= 50)) return { ok: false, error: "نسبة التغليف لازم تكون من 0 لـ 50٪" };
  if (!(min >= 0) || !(max >= 0) || (max > 0 && max < min)) return { ok: false, error: "الحد الأقصى للتغليف لازم يكون أكبر من الأدنى" };

  try {
    const current = await loadStoreConfig();
    await saveStoreConfig({
      packaging: { ...current.packaging, rate: rate / 100, min: Math.round(min), max: Math.round(max) },
      wrappings,
      boxSizes,
    });
  } catch (e) {
    return { ok: false, error: `ماتحفظش: ${e instanceof Error ? e.message : ""}` };
  }
  updateTag("catalog");
  return { ok: true };
}
