import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import * as seed from "../seed-data";
import type { GiftPackage, Kit, Partner, Product } from "../types";
import { loadCatalogFromSupabase, saveCatalogDiff, uploadCatalogImage } from "./catalog-supabase";

const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

/*
 * الكتالوج اللي لوحة التحكم بتعدّله (المنتجات والبراندات والباكدجات والكيتات).
 * لو Supabase متربط: القراية والحفظ منه (catalog-supabase). غير كده: مخزن محلي في .data/catalog.json
 * (أول تعديل بينسخ البيانات التجريبية للملف). التكلفة (cost) هنا بس، ومش بتوصل للعميل أبداً.
 */

/** reviewStatus = "pending": براند ضافه ومستني موافقة المتجر (بيفضل مخفي لحد ما يتوافق عليه) */
export type ProductRecord = Product & { cost: number; reviewStatus?: "pending" | null };

export interface CatalogData {
  products: ProductRecord[];
  partners: Partner[];
  packages: GiftPackage[];
  kits: Kit[];
}

/**
 * تكلفة المنتج على المتجر: منتج البراند تكلفته نصيب البراند (السعر ناقص العمولة)،
 * ومنتج المتجر تكلفته اللي مكتوبة. الخصومات كلها على المتجر، فالبراند بياخد نصيبه من السعر الكامل.
 */
export function costOf(p: ProductRecord, d: Pick<CatalogData, "partners">) {
  const partner = p.partnerId ? d.partners.find((x) => x.id === p.partnerId) : undefined;
  return partner ? Math.round(p.price * (1 - partner.commissionRate) * 100) / 100 : p.cost;
}

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "catalog.json");
const MEDIA = path.join(DIR, "media");

function fromSeed(): CatalogData {
  return structuredClone({
    products: seed.products.map((p) => ({ ...p, cost: Math.round(p.price * 0.55) })),
    partners: seed.partners,
    packages: seed.packages,
    kits: seed.kits,
  });
}

export async function loadCatalogData(): Promise<CatalogData> {
  if (onSupabase()) return loadCatalogFromSupabase();
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as CatalogData;
  } catch {
    return fromSeed();
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** تعديل على الكتالوج: بيقرا ويعدّل ويكتب في خطوة واحدة (التعديلات ورا بعض) */
export function mutateCatalog<T>(fn: (d: CatalogData) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const d = await loadCatalogData();
    if (onSupabase()) {
      const before = structuredClone(d);
      const out = await fn(d);
      await saveCatalogDiff(before, d);
      return out;
    }
    const out = await fn(d);
    await mkdir(DIR, { recursive: true });
    await writeFile(`${FILE}.tmp`, JSON.stringify(d, null, 2), "utf8");
    await rename(`${FILE}.tmp`, FILE);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** صور المنتجات والبراندات: على Supabase Storage، أو في .data/media وبتتعرض على /media/<الاسم> */
export async function saveMedia(name: string, data: Buffer): Promise<string> {
  if (onSupabase()) return uploadCatalogImage(name, data);
  await mkdir(MEDIA, { recursive: true });
  const safe = `${Date.now()}-${name.replace(/[^\w.-]/g, "_")}`;
  await writeFile(path.join(MEDIA, safe), data);
  return `/media/${safe}`;
}

export async function readMedia(name: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(MEDIA, path.basename(name)));
  } catch {
    return null;
  }
}
