import "server-only";
import { addDays, cairoNow } from "../delivery";
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
    await r.update(o.id, { status: "cancelled" }, { status: "cancelled", note: "اتلغى تلقائياً: الدفع متأكدش في المهلة" });
    for (const g of o.gifts) await r.releaseSlot(g.deliveryDate, g.deliveryPeriod);
    if (o.giftCardUse) await r.restoreGiftCard(o.giftCardUse.code, o.giftCardUse.ref);
  }
  return due.length;
}

export const today = () => cairoNow().date;
export const tomorrow = () => addDays(cairoNow().date, 1);

export type { OrderRecord };
