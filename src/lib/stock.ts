import "server-only";
import type { GiftRecord } from "./db/types";
import type { Product } from "./types";
import { comboKey, type ProductOption } from "./options";
import { loadCatalogData, mutateCatalog } from "./db/catalog-store";
import { adminClient } from "./supabase/admin";

/*
 * المخزون: وقت الطلب بنتأكد بس إن الكمية موجودة (checkStock). الخصم الفعلي (takeStock) بيحصل
 * لما صاحبة المتجر تنقل الطلب لـ«بيتجهز»، وبيرجع (returnStock) لو طلب اتخصم اتلغى.
 * المنتج اللي ليه اختيار واحد العدد بيتحسب على القيمة اللي اتختارت (اللون مثلاً)، واللي ليه اختيارين أو أكتر
 * على التركيبة كلها (yara · 50ml)، والمنتج من غير اختيارات على المنتج نفسه.
 * العدد الفاضي (null) معناه مفتوح ومش بيتحسب.
 */

export interface StockLine {
  productId: string;
  quantity: number;
  choices?: { optionId: string; valueId: string }[];
}

const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

interface Step {
  productId: string;
  optionId: string | null;
  valueId: string | null;
  /** مفتاح التركيبة لو المنتج ليه اختيارين أو أكتر */
  combo: string | null;
  qty: number;
}

/** كل خطوة تعديل منفصلة: على المنتج، أو على قيمة اختيار، أو على تركيبة */
function steps(lines: StockLine[]): Step[] {
  return lines.flatMap((l): Step[] => {
    const base = { productId: l.productId, optionId: null, valueId: null, combo: null, qty: l.quantity };
    if (!l.choices?.length) return [base];
    if (l.choices.length >= 2) return [{ ...base, combo: comboKey(l.choices) }];
    return [{ ...base, optionId: l.choices[0].optionId, valueId: l.choices[0].valueId }];
  });
}

/** العدد الحالي للخطوة (فاضي = مفتوح) */
function stockOf(p: Product, s: Step) {
  if (s.combo) return p.options?.[0]?.combos?.find((c) => c.key === s.combo)?.stock ?? null;
  if (s.optionId) return p.options?.find((o) => o.id === s.optionId)?.values.find((v) => v.id === s.valueId)?.stock ?? null;
  return p.stock ?? null;
}

/** بيغيّر العدد في المنتج نفسه (للتخزين على الملفات، أو لو الـ migration الجديد لسه متشغلش) */
function applyLocal(p: Product, s: Step, delta: number) {
  if (s.combo) {
    const c = p.options?.[0]?.combos?.find((x) => x.key === s.combo);
    if (c && c.stock != null) c.stock += delta;
  } else if (s.optionId) {
    const v = p.options?.find((o) => o.id === s.optionId)?.values.find((x) => x.id === s.valueId);
    if (v && v.stock != null) v.stock += delta;
  } else if (p.stock != null) p.stock += delta;
}

const missingFn = (e: { code?: string; message: string }, fn: string) => e.code === "PGRST202" || e.message.includes(fn);

/** التركيبة على Supabase: بالـ function لو موجودة، غير كده بنقرا ونكتب العمود */
async function adjustComboSupabase(s: Step, delta: number) {
  const db = adminClient();
  const { data, error } = await db.rpc("adjust_combo_stock", { p_product: s.productId, p_key: s.combo, p_delta: delta });
  if (!error) return Boolean(data);
  if (!missingFn(error, "adjust_combo_stock")) throw new Error(error.message);
  const { data: row, error: readErr } = await db.from("products").select("options").eq("id", s.productId).maybeSingle();
  if (readErr) throw new Error(readErr.message);
  const options = (row?.options ?? []) as ProductOption[];
  const c = options[0]?.combos?.find((x) => x.key === s.combo);
  if (!c || c.stock == null) return true;
  if (c.stock + delta < 0) return false;
  c.stock += delta;
  const { error: writeErr } = await db.from("products").update({ options }).eq("id", s.productId);
  if (writeErr) throw new Error(writeErr.message);
  return true;
}

async function adjustSupabase(s: Step, delta: number) {
  if (s.combo) return adjustComboSupabase(s, delta);
  const { data, error } = await adminClient().rpc("adjust_stock", {
    p_product: s.productId,
    p_option: s.optionId,
    p_value: s.valueId,
    p_delta: delta,
  });
  if (error) {
    // الـ migration لسه ما اتشغلش: المخزون مش متفعّل، فالطلب يكمل عادي
    if (missingFn(error, "adjust_stock")) return true;
    throw new Error(error.message);
  }
  return Boolean(data);
}

/** بيتأكد إن الكمية موجودة من غير ما يخصم (وقت الطلب). الطلبات اللي لسه متخصمتش ممكن تكون محتاجة نفس القطعة */
export async function checkStock(lines: StockLine[]): Promise<{ ok: true } | { ok: false; productId: string }> {
  const need = new Map<string, Step & { qty: number }>();
  for (const s of steps(lines).filter((x) => x.qty > 0)) {
    const k = `${s.productId}|${s.optionId ?? ""}|${s.valueId ?? ""}|${s.combo ?? ""}`;
    const cur = need.get(k);
    need.set(k, cur ? { ...cur, qty: cur.qty + s.qty } : { ...s });
  }
  if (!need.size) return { ok: true };
  const products = new Map((await loadCatalogData()).products.map((p) => [p.id, p]));
  for (const s of need.values()) {
    const p = products.get(s.productId);
    if (!p) continue;
    const stock = stockOf(p, s);
    if (stock != null && stock < s.qty) return { ok: false, productId: s.productId };
  }
  return { ok: true };
}

/** بيخصم المخزون كله أو مفيش (لو حاجة مش كفاية بيرجّع اللي اتخصم) */
export async function takeStock(lines: StockLine[]): Promise<{ ok: true } | { ok: false; productId: string }> {
  const all = steps(lines).filter((s) => s.qty > 0);
  if (!all.length) return { ok: true };

  if (!onSupabase()) {
    return mutateCatalog((d) => {
      const products = new Map(d.products.map((p) => [p.id, p]));
      // نتأكد الأول إن كله كفاية، وبعدين نخصم
      for (const s of all) {
        const p = products.get(s.productId);
        if (!p) continue;
        const stock = stockOf(p, s);
        if (stock != null && stock < s.qty) return { ok: false as const, productId: s.productId };
      }
      for (const s of all) {
        const p = products.get(s.productId);
        if (p) applyLocal(p, s, -s.qty);
      }
      return { ok: true as const };
    });
  }

  const done: Step[] = [];
  for (const s of all) {
    if (!(await adjustSupabase(s, -s.qty))) {
      for (const d of done) await adjustSupabase(d, d.qty);
      return { ok: false, productId: s.productId };
    }
    done.push(s);
  }
  return { ok: true };
}

/** بيرجّع المخزون (لما الطلب يتلغي) */
export async function returnStock(lines: StockLine[]) {
  const all = steps(lines).filter((s) => s.qty > 0);
  if (!all.length) return;
  if (!onSupabase()) {
    await mutateCatalog((d) => {
      const products = new Map(d.products.map((p) => [p.id, p]));
      for (const s of all) {
        const p = products.get(s.productId);
        if (p) applyLocal(p, s, s.qty);
      }
    });
    return;
  }
  for (const s of all) await adjustSupabase(s, s.qty);
}

/** كل منتجات الطلب كسطور مخزون */
export const orderStockLines = (gifts: GiftRecord[]): StockLine[] =>
  gifts.flatMap((g) => g.items.map((it) => ({ productId: it.productId, quantity: it.quantity, choices: it.choices })));
