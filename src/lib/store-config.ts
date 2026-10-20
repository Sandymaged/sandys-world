import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import * as seed from "./seed-data";
import { DEFAULT_SETTINGS, type StoreSettings, type WrappingOption } from "./settings";
import { adminClient } from "./supabase/admin";
import type { BoxSize } from "./types";

/*
 * البوكسات والتغليف اللي صاحبة المتجر بتحددهم من اللوحة:
 * - مقاسات البوكس (الاسم، السعر، بيساع كام حاجة، صورة الشكل)
 * - نسبة التغليف على البوكس (٪ وحد أدنى وأقصى)
 * - اختيارات التغليف اللي العميل بيختار منها (بسعرها وصورتها)
 * على Supabase: جدول box_sizes، والإعدادات في settings (packaging / wrappings). من غيره: .data
 */

const DIR = path.join(process.cwd(), ".data");
const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.join(DIR, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}
async function writeJson(name: string, value: unknown) {
  await mkdir(DIR, { recursive: true });
  const file = path.join(DIR, name);
  await writeFile(`${file}.tmp`, JSON.stringify(value, null, 2), "utf8");
  await rename(`${file}.tmp`, file);
}

export interface StoreConfig {
  packaging: StoreSettings["packaging"];
  wrappings: WrappingOption[];
  boxSizes: BoxSize[];
}

/** للمخزن المحلي: الإعدادات اللي اتحفظت من اللوحة فوق الافتراضي */
export async function localStoreConfig(): Promise<{ packaging?: StoreSettings["packaging"]; wrappings?: WrappingOption[]; boxSizes?: BoxSize[] }> {
  const s = await readJson<{ packaging?: StoreSettings["packaging"]; wrappings?: WrappingOption[] }>("store-settings.json", {});
  const boxSizes = await readJson<BoxSize[] | undefined>("boxes.json", undefined);
  return { ...s, boxSizes };
}

/** كل الإعدادات (حتى البوكسات المقفولة) للوحة */
export async function loadStoreConfig(): Promise<StoreConfig> {
  if (onSupabase()) {
    const db = adminClient();
    const [boxes, settings] = await Promise.all([
      db.from("box_sizes").select("*").order("sort"),
      db.from("settings").select("key, value").in("key", ["packaging", "wrappings"]),
    ]);
    if (boxes.error) throw new Error(boxes.error.message);
    const map = Object.fromEntries((settings.data ?? []).map((r) => [r.key, r.value]));
    return {
      packaging: { ...DEFAULT_SETTINGS.packaging, ...(map.packaging ?? {}) },
      wrappings: (map.wrappings as WrappingOption[] | undefined) ?? DEFAULT_SETTINGS.wrappings,
      boxSizes: (boxes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        en: r.en ?? undefined,
        price: Number(r.price),
        maxItems: r.max_items,
        sort: r.sort,
        image: r.image ?? null,
        description: r.description ?? "",
        isActive: r.is_active ?? true,
      })),
    };
  }
  const local = await localStoreConfig();
  return {
    packaging: { ...DEFAULT_SETTINGS.packaging, ...local.packaging },
    wrappings: local.wrappings ?? DEFAULT_SETTINGS.wrappings,
    boxSizes: local.boxSizes ?? seed.boxSizes.map((b) => ({ ...b, isActive: true })),
  };
}

export async function saveStoreConfig(next: StoreConfig) {
  const boxes = next.boxSizes.map((b, i) => ({ ...b, id: b.id || randomUUID(), sort: i }));
  if (onSupabase()) {
    const db = adminClient();
    const { error: e1 } = await db.from("settings").upsert([
      { key: "packaging", value: next.packaging },
      { key: "wrappings", value: next.wrappings },
    ]);
    if (e1) throw new Error(e1.message);
    const current = await db.from("box_sizes").select("id");
    const keep = new Set(boxes.map((b) => b.id));
    const removed = (current.data ?? []).map((r) => r.id).filter((id) => !keep.has(id));
    if (boxes.length) {
      const { error } = await db.from("box_sizes").upsert(
        boxes.map((b) => ({
          id: b.id,
          name: b.name,
          en: b.en ?? null,
          price: b.price,
          max_items: b.maxItems,
          sort: b.sort,
          image: b.image ?? null,
          description: b.description ?? null,
          is_active: b.isActive !== false,
        })),
      );
      if (error) throw new Error(error.message);
    }
    if (removed.length) {
      const { error } = await db.from("box_sizes").delete().in("id", removed);
      if (error) throw new Error(error.message);
    }
    return;
  }
  await writeJson("store-settings.json", { packaging: next.packaging, wrappings: next.wrappings });
  await writeJson("boxes.json", boxes);
}
