import "server-only";
import { repo } from "./db";
import { normalizeGiftCardCode } from "./gift-card";

/** الكارت برصيده، ومعاه بيانات الهدية من الطلب (لمين، من مين، الرسالة، الشكل) */
export async function giftCardByCode(raw: string) {
  const code = normalizeGiftCardCode(decodeURIComponent(raw));
  const record = await repo().getGiftCard(code);
  if (!record) return null;
  const order = await repo().getById(record.orderId);
  const gc = order?.giftCards?.find((c) => c.code === code);
  if (!order || !gc) return null;
  return { record, gc, locale: order.locale };
}
