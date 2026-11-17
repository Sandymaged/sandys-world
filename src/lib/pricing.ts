// قواعد التسعير (قسم 8.1)

import type { StoreSettings } from "./settings";

/** سطر "تغليف وتنسيق" للبوكس المخصص: نسبة من (المنتجات + البوكس) بحد أدنى وأقصى */
export function packagingFee(
  base: number,
  rule: StoreSettings["packaging"],
): number {
  if (base <= 0) return 0;
  const fee = Math.round(base * rule.rate);
  const floored = Math.max(rule.min, fee);
  // الحد الأقصى صفر = من غير حد
  return rule.max > 0 ? Math.min(rule.max, floored) : floored;
}

export interface CouponRule {
  kind: "percent" | "amount";
  value: number;
  minOrder: number;
  /** أقصى خصم على جزء الباقات الجاهزة (ج.م). من غيره = بلا حد */
  packageCap?: number;
}

/**
 * الخصم على إجمالي الهدايا (من غير التوصيل ولا كروت الهدايا).
 * packagesTotal = سعر الباقات الجاهزة جوه الإجمالي (الباقة + الصندوق لو اتختار).
 * الخصم بيتقسم على الباقات والباقي بالنسبة، ونصيب الباقات مايزيدش عن packageCap.
 */
export function couponBreakdown(giftsTotal: number, coupon: CouponRule, packagesTotal = 0): { discount: number; capped: boolean } {
  if (giftsTotal <= 0 || giftsTotal < coupon.minOrder) return { discount: 0, capped: false };
  const raw =
    coupon.kind === "percent"
      ? Math.round((giftsTotal * coupon.value) / 100)
      : coupon.value;
  const full = Math.min(raw, giftsTotal);
  const cap = coupon.packageCap;
  if (cap == null || !(cap >= 0) || packagesTotal <= 0) return { discount: full, capped: false };
  const pkgPart = Math.round((full * Math.min(packagesTotal, giftsTotal)) / giftsTotal);
  if (pkgPart <= cap) return { discount: full, capped: false };
  return { discount: full - pkgPart + cap, capped: true };
}

export function couponDiscount(giftsTotal: number, coupon: CouponRule, packagesTotal = 0): number {
  return couponBreakdown(giftsTotal, coupon, packagesTotal).discount;
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
