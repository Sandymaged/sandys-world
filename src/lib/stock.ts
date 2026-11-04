import "server-only";
import type { GiftRecord } from "./db/types";
import { loadCatalogData, mutateCatalog } from "./db/catalog-store";
import { adminClient } from "./supabase/admin";

/*
 * المخزون: وقت الطلب بنتأكد بس إن الكمية موجودة (checkStock). الخصم الفعلي (takeStock) بيحصل
 * لما صاحبة المتجر تنقل الطلب لـ«بيتجهز»، وبيرجع (returnStock) لو طلب اتخصم اتلغى.
 * المنتج اللي ليه اختيارات العدد بيتحسب على القيمة اللي اتختارت (اللون/المقاس)، غير كده على المنتج نفسه.
 * العدد الفاضي (null) معناه مفتوح ومش بيتحسب.
 */

export interface StockLine {
  productId: string;
  quantity: number;
  choices?: { optionId: string; valueId: string }[];
}

const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

/** كل خطوة تعديل منفصلة: على المنتج، أو على قيمة اختيار */
function steps(lines: StockLine[]) {
  return lines.flatMap((l) =>
    l.choices?.length
      ? l.choices.map((c) => ({ productId: l.productId, optionId: c.optionId as string | null, valueId: c.valueId as string | null, qty: l.quantity }))
      : [{ productId: l.productId, optionId: null, valueId: null, qty: l.quantity }],
  );
}

type Step = ReturnType<typeof steps>[number];

async function adjustSupabase(s: Step, delta: number) {
  const { data, error } = await adminClient().rpc("adjust_stock", {
    p_product: s.productId,
    p_option: s.optionId,
    p_value: s.valueId,
    p_delta: delta,
  });
  if (error) {
    // الـ migration لسه ما اتشغلش: المخزون مش متفعّل، فالطلب يكمل عادي
    if (error.code === "PGRST202" || /adjust_stock/.test(error.message)) return true;
    throw new Error(error.message);
  }
  return Boolean(data);
}

/** بيتأكد إن الكمية موجودة من غير ما يخصم (وقت الطلب). الطلبات اللي لسه متخصمتش ممكن تكون محتاجة نفس القطعة */
export async function checkStock(lines: StockLine[]): Promise<{ ok: true } | { ok: false; productId: string }> {
  const need = new Map<string, Step & { qty: number }>();
  for (const s of steps(lines).filter((x) => x.qty > 0)) {
    const k = `${s.productId}|${s.optionId ?? ""}|${s.valueId ?? ""}`;
    const cur = need.get(k);
    need.set(k, cur ? { ...cur, qty: cur.qty + s.qty } : { ...s });
  }
  if (!need.size) return { ok: true };
  const products = new Map((await loadCatalogData()).products.map((p) => [p.id, p]));
  for (const s of need.values()) {
    const p = products.get(s.productId);
    if (!p) continue;
    const stock = s.optionId ? p.options?.find((o) => o.id === s.optionId)?.values.find((v) => v.id === s.valueId)?.stock : p.stock;
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
        const stock = s.optionId ? p.options?.find((o) => o.id === s.optionId)?.values.find((v) => v.id === s.valueId)?.stock : p.stock;
        if (stock != null && stock < s.qty) return { ok: false as const, productId: s.productId };
      }
      for (const s of all) {
        const p = products.get(s.productId);
        if (!p) continue;
        if (s.optionId) {
          const v = p.options?.find((o) => o.id === s.optionId)?.values.find((x) => x.id === s.valueId);
          if (v && v.stock != null) v.stock -= s.qty;
        } else if (p.stock != null) p.stock -= s.qty;
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
        if (!p) continue;
        if (s.optionId) {
          const v = p.options?.find((o) => o.id === s.optionId)?.values.find((x) => x.id === s.valueId);
          if (v && v.stock != null) v.stock += s.qty;
        } else if (p.stock != null) p.stock += s.qty;
      }
    });
    return;
  }
  for (const s of all) await adjustSupabase(s, s.qty);
}

/** كل منتجات الطلب كسطور مخزون */
export const orderStockLines = (gifts: GiftRecord[]): StockLine[] =>
  gifts.flatMap((g) => g.items.map((it) => ({ productId: it.productId, quantity: it.quantity, choices: it.choices })));
