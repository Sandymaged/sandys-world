// قواعد التسعير (قسم 8.1)

import type { StoreSettings } from "./settings";

/** سطر "تغليف وتنسيق" للبوكس المخصص: نسبة من (المنتجات + البوكس) بحد أدنى وأقصى */
export function packagingFee(
  base: number,
  rule: StoreSettings["packaging"],
): number {
  if (base <= 0) return 0;
  const fee = Math.round(base * rule.rate);
  return Math.min(rule.max, Math.max(rule.min, fee));
}

export interface CouponRule {
  kind: "percent" | "amount";
  value: number;
  minOrder: number;
}

/** قيمة الخصم على إجمالي الهدايا (من غير التوصيل) */
export function couponDiscount(giftsTotal: number, coupon: CouponRule): number {
  if (giftsTotal < coupon.minOrder) return 0;
  const raw =
    coupon.kind === "percent"
      ? Math.round((giftsTotal * coupon.value) / 100)
      : coupon.value;
  return Math.min(raw, giftsTotal);
}

/** سعر كيتات الورشة: سعر الفرد × العدد، ناقص خصم الكمية */
export function kitTotal(pricePerPerson: number, people: number, tiers: StoreSettings["weddingDiscounts"]) {
  const gross = pricePerPerson * people;
  const rate = weddingDiscountRate(people, tiers);
  return { gross, rate, discount: Math.round(gross * rate), total: gross - Math.round(gross * rate) };
}

/** خصم الكمية في الأفراح والكيتات: أعلى شريحة العدد وصلها */
export function weddingDiscountRate(
  qty: number,
  tiers: StoreSettings["weddingDiscounts"],
): number {
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  return sorted.find((t) => qty >= t.minQty)?.rate ?? 0;
}
