/*
 * عمولة المتجر على البراندات (قرار صاحبة المشروع 2026-11-03):
 * - السعر للعميل هو سعر البراند، من غير زيادة.
 * - كل شهر: أول «حد» من مبيعات البراند من غير عمولة. الحد = متوسط سعر منتجات البراند × 10 (`FREE_PIECES`، كان 20 لحد 2026-11-09).
 * - فوق الحد شرايح (زي الضرايب، كل نسبة على الجزء اللي جوه شريحتها بس):
 *   من الحد لضعفه 10%، من ضعفه لـ 4 أضعافه 15%، وفوق كده 20%.
 * - كل طلب عمولته بتتحسب على حسب مكانه في مبيعات الشهر، وبتتثبت لحظة التسليم للعميل.
 */

export const FREE_PIECES = 10;

/** [من، لحد] كمضاعفات للحد، والنسبة */
export const TIERS: { from: number; to: number; rate: number }[] = [
  { from: 0, to: 1, rate: 0 },
  { from: 1, to: 2, rate: 0.1 },
  { from: 2, to: 4, rate: 0.15 },
  { from: 4, to: Infinity, rate: 0.2 },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

/** الحد الشهري من متوسط الأسعار */
export const thresholdFrom = (avgPrice: number) => Math.round(Math.max(0, avgPrice) * FREE_PIECES);

/** عمولة مبلغ جديد بعد ما البراند باع `before` في نفس الشهر */
export function commissionFor(before: number, amount: number, threshold: number): number {
  if (amount <= 0) return 0;
  if (threshold <= 0) return r2(amount * TIERS[TIERS.length - 1].rate);
  let c = 0;
  const start = before;
  const end = before + amount;
  for (const t of TIERS) {
    const lo = t.from * threshold;
    const hi = t.to * threshold;
    const overlap = Math.min(end, hi) - Math.max(start, lo);
    if (overlap > 0) c += overlap * t.rate;
  }
  return r2(c);
}

/** الشهر (YYYY-MM) بتوقيت القاهرة */
export const cairoMonth = (d: Date | string = new Date()) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }).slice(0, 7);

/** البراند في الشهر ده فين من الشرايح (للعرض) */
export function tierProgress(sales: number, threshold: number) {
  const idx = Math.max(0, TIERS.findIndex((t) => sales < t.to * threshold));
  const tier = TIERS[idx === -1 ? TIERS.length - 1 : idx];
  const nextAt = Number.isFinite(tier.to) ? tier.to * threshold : null;
  return { rate: tier.rate, nextAt, nextRate: TIERS[idx + 1]?.rate ?? null, freeLeft: Math.max(0, threshold - sales) };
}
