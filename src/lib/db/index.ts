import "server-only";
import { addDays, cairoNow } from "../delivery";
import { orderStockLines, returnStock } from "../stock";
import { fileRepo } from "./file-store";
import { supabaseRepo } from "./supabase-store";
import type { OrderRecord, Repo } from "./types";

/** مصدر البيانات: Supabase لو المفاتيح (والمفتاح السري) متحطة، وإلا المخزن المحلي (.data) للتجربة */
export const supabaseServerConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
);

export function repo(): Repo {
  return supabaseServerConfigured ? supabaseRepo : fileRepo;
}

/**
 * الطلبات اللي اتعملت بإنستاباي ومتأكدش دفعها في المهلة بتتلغي (8.3)،
 * وبتفضّي فترات التوصيل اللي كانت حاجزاها. بتتنفذ قبل أي قراءة في لوحة التحكم.
 * (على Supabase دي بتبقى cron job.)
 */
export async function expireUnpaid(): Promise<number> {
  const r = repo();
  const now = Date.now();
  const due = (await r.list({ status: "awaiting_payment" })).filter(
    (o) => o.paymentStatus === "awaiting_proof" && o.paymentDueAt && Date.parse(o.paymentDueAt) < now,
  );
  for (const o of due) {
    await r.update(o.id, { status: "cancelled" }, { status: "cancelled", note: "أُلغي تلقائياً: لم يُؤكَّد الدفع في المهلة" });
    for (const s of uniqueSlots(o.gifts)) await r.releaseSlot(s.date, s.period);
    if (o.giftCardUse) await r.restoreGiftCard(o.giftCardUse.code, o.giftCardUse.ref);
    // طلبات زمان كان المخزون بيتخصم وقت الطلب؛ الجديدة مش بتتخصم غير في «بيتجهز»
    if (o.stockTaken !== false) await returnStock(orderStockLines(o.gifts));
  }
  return due.length;
}

/** مواعيد التوصيل اللي الطلب حاجزها (الهدايا اللي في نفس الميعاد حاجزة مكان واحد) */
export function uniqueSlots(gifts: OrderRecord["gifts"]) {
  const seen = new Map<string, { date: string; period: OrderRecord["gifts"][number]["deliveryPeriod"] }>();
  for (const g of gifts) seen.set(`${g.deliveryDate}|${g.deliveryPeriod}`, { date: g.deliveryDate, period: g.deliveryPeriod });
  return [...seen.values()];
}

export const today = () => cairoNow().date;
export const tomorrow = () => addDays(cairoNow().date, 1);

export type { OrderRecord };
