import "server-only";
import type { CatalogData } from "./db/catalog-store";
import type { OrderRecord } from "./db/types";
import { cairoNow } from "./delivery";
import { instapayFee, type Expense, type FinanceSettings } from "./finance";
import { itemUnitPrice } from "./commission";
import { cardsTotal } from "./gift-card";
import { allCombos, comboKey, comboStock, describeChoices, usesCombos } from "./options";

/*
 * التقارير (بحساب الفلوس اللي دخلت فعلاً):
 * - الطلب بيتحسب لما يتدفع (إنستاباي اتأكد) أو كاش واتسلم للعميل (الفلوس اتحصّلت)
 * - التكلفة: نصيب البراند (السعر ناقص العمولة) أو تكلفة منتجات المتجر نفسه
 * - وبعدين التوصيل الفعلي، والتغليف، وعمولة إنستاباي، والمرتجعات، والمصاريف
 * ملحوظة: نصيب البراند بيتحسب بسعر القطعة وقت الشراء (catalogPrice، ولو الطلب اتسلم بالمبلغ اللي اتثبت وقتها)؛
 * الطلبات القديمة اللي مفيهاش catalogPrice بس بتاخد سعر الكتالوج الحالي. تكلفة منتجات المتجر نفسه لسه بالتكلفة الحالية.
 */

export type PeriodId = "this-month" | "last-month" | "7d" | "30d" | "year" | "all";

export const periods: { id: PeriodId; label: string }[] = [
  { id: "this-month", label: "هذا الشهر" },
  { id: "last-month", label: "الشهر الماضي" },
  { id: "7d", label: "آخر ٧ أيام" },
  { id: "30d", label: "آخر ٣٠ يوماً" },
  { id: "year", label: "هذه السنة" },
  { id: "all", label: "منذ البداية" },
];

const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function periodRange(id: PeriodId): { from: string; to: string; prevFrom: string; prevTo: string } {
  const today = cairoNow().date;
  const [y, m] = today.split("-").map(Number);
  const monthStart = (yy: number, mm: number) => new Date(Date.UTC(yy, mm - 1, 1)).toISOString().slice(0, 10);
  const monthEnd = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).toISOString().slice(0, 10);
  switch (id) {
    case "this-month":
      return { from: monthStart(y, m), to: today, prevFrom: monthStart(y, m - 1), prevTo: addDays(monthStart(y, m), -1) };
    case "last-month":
      return { from: monthStart(y, m - 1), to: monthEnd(y, m - 1), prevFrom: monthStart(y, m - 2), prevTo: monthEnd(y, m - 2) };
    case "7d":
      return { from: addDays(today, -6), to: today, prevFrom: addDays(today, -13), prevTo: addDays(today, -7) };
    case "30d":
      return { from: addDays(today, -29), to: today, prevFrom: addDays(today, -59), prevTo: addDays(today, -30) };
    case "year":
      return { from: `${y}-01-01`, to: today, prevFrom: `${y - 1}-01-01`, prevTo: addDays(today, -365) };
    default:
      return { from: "2000-01-01", to: today, prevFrom: "1999-01-01", prevTo: "1999-12-31" };
  }
}

const dayOf = (iso: string) => cairoNow(new Date(iso)).date;
const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
const inRange = (d: string, from: string, to: string) => d >= from && d <= to;

/**
 * الطلب ده بيتحسب في المبيعات (فلوسه دخلت فعلاً)؟ الدفع اتأكد، أو كاش عند الاستلام واتسلم (الفلوس اتحصّلت).
 * الكاش اللي لسه ماتسلمش مش مبيعات مؤكدة.
 */
export const counted = (o: OrderRecord) =>
  o.status !== "cancelled" && (o.paymentStatus === "confirmed" || (o.paymentMethod === "cod" && o.status === "delivered"));

export interface Ranked {
  key: string;
  label: string;
  value: number;
  sub?: string;
}

export interface Report {
  from: string;
  to: string;
  orders: number;
  prevOrders: number;
  cashIn: number;
  prevCashIn: number;
  giftValue: number;
  avgOrder: number;
  giftCardSales: number;
  paidWithGiftCards: number;
  costs: { goods: number; delivery: number; packaging: number; fees: number; refunds: number; expenses: number };
  totalCosts: number;
  profit: number;
  prevProfit: number;
  margin: number;
  income: { commission: number; packaging: number; delivery: number };
  losses: {
    cancelledCount: number;
    cancelledValue: number;
    expiredCount: number;
    discounts: number;
    refundsByKind: Record<string, number>;
    cancelReasons: Ranked[];
  };
  topProducts: Ranked[];
  topPackages: Ranked[];
  zones: Ranked[];
  sources: Ranked[];
  expensesByCategory: Ranked[];
  customers: { total: number; returning: number; topReturning: Ranked[] };
  brands: Ranked[];
  lowStock: Ranked[];
  giftCardLiability: number;
}

interface Inputs {
  orders: OrderRecord[];
  catalog: CatalogData;
  finance: FinanceSettings;
  expenses: Expense[];
  zoneNames: Map<string, string>;
  giftCardBalances: number;
}

function money(o: OrderRecord, catalog: CatalogData, f: FinanceSettings) {
  const products = new Map(catalog.products.map((p) => [p.id, p]));
  const partners = new Map(catalog.partners.map((p) => [p.id, p]));
  let goods = 0;
  let commission = 0;
  // مبيعات كل براند في الطلب (بالنسبة القديمة لو الطلب من قبل نظام الشرايح)
  const brands = new Map<string, { gross: number; legacy: number }>();
  for (const g of o.gifts) {
    for (const it of g.items) {
      const p = products.get(it.productId);
      // سعر المنتج: سعره في الطلب، ولو جوه باكدج (سعره صفر) سعره في الكتالوج وقت الشراء
      const price = itemUnitPrice(it, p?.price) * it.quantity;
      const partner = it.partnerId ? partners.get(it.partnerId) : undefined;
      if (partner) {
        const b = brands.get(partner.id) ?? { gross: 0, legacy: 0 };
        b.gross += price;
        b.legacy += price * (it.commissionRate ?? partner.commissionRate);
        brands.set(partner.id, b);
      } else goods += (p?.cost ?? 0) * it.quantity;
    }
  }
  // العمولة بالشرايح بتتثبت وقت التسليم؛ قبل التسليم بنعتبرها صفر (البراند ياخد السعر كله لحد ما تتحسب)
  for (const [pid, b] of brands) {
    const settled = o.brandStatus?.[pid]?.settled;
    const c = settled ? settled.commission : o.status === "delivered" ? b.legacy : 0;
    // بعد التسليم المبلغ اللي اتثبت هو المرجع (مش أسعار الكتالوج الحالية)
    const gross = settled && o.status === "delivered" ? settled.gross : b.gross;
    commission += c;
    goods += gross - c;
  }
  const zoneId = o.gifts[0]?.recipient.zoneId;
  // كل محاولة توصيل تانية في يوم تاني مشوار جديد على المندوب
  const trips = 1 + (o.gifts[0]?.redeliveries?.length ?? 0);
  const delivery = o.gifts.length && zoneId ? (f.zoneCosts[zoneId] ?? 0) * trips : 0;
  const packaging = f.packagingCostPerGift * o.gifts.length;
  const fees = o.paymentMethod === "instapay" ? instapayFee(o.totals.total, f) : 0;
  return { goods, commission, delivery, packaging, fees };
}

function profitOf(orders: OrderRecord[], i: Inputs, from: string, to: string, expenses: number) {
  let cash = 0;
  let cost = 0;
  for (const o of orders) {
    if (!counted(o) || !inRange(dayOf(o.createdAt), from, to)) continue;
    cash += o.totals.total;
    // نفس قاعدة buildReport: الكارت مكسب لما يتصرف، مش لما يتباع
    cost += cardsTotal(o) - (o.gifts.length ? (o.totals.giftCard ?? 0) : 0);
    if (o.gifts.length) {
      const m = money(o, i.catalog, i.finance);
      cost += m.goods + m.delivery + m.packaging + m.fees;
    }
    cost += (o.refunds ?? []).filter((r) => inRange(dayOf(r.at), from, to)).reduce((s, r) => s + r.amount, 0);
  }
  return { cash, profit: cash - cost - expenses };
}

/** فلوسك دلوقتي (من الأول لحد النهارده، مش فترة) */
export interface MoneyNow {
  /** اللي دخل */
  instapayIn: number;
  cashIn: number;
  /** اللي خرج */
  fees: number;
  refunds: number;
  brandPayouts: number;
  expenses: number;
  deliveryAndPackaging: number;
  /** اللي المفروض معاكي (إنستاباي + كاش) */
  onHand: number;
  /** مش بتاعتك */
  brandsOwed: number;
  giftCardsOutstanding: number;
  /** بتاعتك فعلاً */
  yours: number;
  /** فلوس طلبات اتدفعت ولسه ماتسلمتش (ممكن ترجع لو اتلغت) */
  undelivered: number;
  discounts: number;
  giftCards: { sold: number; used: number; outstanding: number; expired: number };
}

export function moneyNow(i: Inputs & { brandsOwed: number; brandPayouts: number }): MoneyNow {
  let instapayIn = 0;
  let cashIn = 0;
  let fees = 0;
  let refunds = 0;
  let deliveryAndPackaging = 0;
  let undelivered = 0;
  let discounts = 0;
  let sold = 0;
  let used = 0;
  for (const o of i.orders) {
    // إنستاباي: أي تحويل اتأكد دخل الحساب (ولو الطلب اتلغى بعدها، اللي رجع متسجل في المرتجعات)
    if (o.paymentMethod === "instapay" && o.paymentStatus === "confirmed") {
      instapayIn += o.totals.total;
      fees += instapayFee(o.totals.total, i.finance);
    }
    // الكاش بيوصلك لما الهدية تتسلم
    if (o.paymentMethod === "cod" && o.status === "delivered") cashIn += o.totals.total;
    refunds += (o.refunds ?? []).reduce((s, r) => s + r.amount, 0);
    if (!counted(o)) continue;
    discounts += o.totals.discount;
    sold += cardsTotal(o);
    used += o.totals.giftCard ?? 0;
    if (o.gifts.length) {
      const m = money(o, i.catalog, i.finance);
      deliveryAndPackaging += m.delivery + m.packaging;
      if (o.paymentMethod === "instapay" && o.status !== "delivered") undelivered += o.totals.total - cardsTotal(o);
    }
  }
  const expenses = i.expenses.reduce((s, e) => s + e.amount, 0);
  const onHand = instapayIn + cashIn - fees - refunds - i.brandPayouts - expenses - deliveryAndPackaging;
  const brandsOwed = Math.max(0, i.brandsOwed);
  const outstanding = i.giftCardBalances;
  const r = (n: number) => Math.round(n);
  return {
    instapayIn: r(instapayIn),
    cashIn: r(cashIn),
    fees: r(fees),
    refunds: r(refunds),
    brandPayouts: r(i.brandPayouts),
    expenses: r(expenses),
    deliveryAndPackaging: r(deliveryAndPackaging),
    onHand: r(onHand),
    brandsOwed: r(brandsOwed),
    giftCardsOutstanding: r(outstanding),
    yours: r(onHand - brandsOwed - outstanding),
    undelivered: r(undelivered),
    discounts: r(discounts),
    // اللي خلصت مدته من غير ما يتصرف بيبقى بتاعك
    giftCards: { sold: r(sold), used: r(used), outstanding: r(outstanding), expired: r(Math.max(0, sold - used - outstanding)) },
  };
}

const top = (map: Map<string, Ranked>, n = 8) => [...map.values()].sort((a, b) => b.value - a.value).slice(0, n);
const bump = (map: Map<string, Ranked>, key: string, label: string, by: number, sub?: string) => {
  const cur = map.get(key);
  if (cur) cur.value += by;
  else map.set(key, { key, label, value: by, sub });
};

export function buildReport(i: Inputs, from: string, to: string, prevFrom: string, prevTo: string): Report {
  const inPeriod = i.orders.filter((o) => inRange(dayOf(o.createdAt), from, to));
  const sold = inPeriod.filter(counted);
  const regular = sold.filter((o) => o.gifts.length > 0);

  const costs = { goods: 0, delivery: 0, packaging: 0, fees: 0, refunds: 0, expenses: 0 };
  const income = { commission: 0, packaging: 0, delivery: 0 };
  const products = new Map<string, Ranked>();
  const packages = new Map<string, Ranked>();
  const zones = new Map<string, Ranked>();
  const sources = new Map<string, Ranked>();
  const brands = new Map<string, Ranked>();
  const partners = new Map(i.catalog.partners.map((p) => [p.id, p]));

  let cashIn = 0;
  let giftValue = 0;
  let giftCardSales = 0;
  let paidWithGiftCards = 0;
  for (const o of sold) {
    cashIn += o.totals.total;
    // كروت الهدايا اللي اتشرت (لوحدها أو مع هدايا): فلوس دخلت ولسه هتتصرف على هدايا بعدين
    const cards = cardsTotal(o);
    giftCardSales += cards;
    if (o.gifts.length === 0) continue;
    giftValue += o.totals.items - cards + o.totals.packaging + o.totals.delivery - o.totals.discount;
    paidWithGiftCards += o.totals.giftCard ?? 0;
    income.packaging += o.totals.packaging;
    income.delivery += o.totals.delivery;
    const m = money(o, i.catalog, i.finance);
    costs.goods += m.goods;
    costs.delivery += m.delivery;
    costs.packaging += m.packaging;
    costs.fees += m.fees;
    income.commission += m.commission;
    const zoneId = o.gifts[0]?.recipient.zoneId ?? "";
    bump(zones, zoneId, i.zoneNames.get(zoneId) ?? o.gifts[0]?.recipient.zoneName ?? "—", 1);
    bump(sources, o.source || "غير معروف", o.source || "غير معروف", 1);
    for (const g of o.gifts) {
      if (g.kind === "package" || g.kind === "kit") bump(packages, g.refId, g.title, 1);
      for (const it of g.items) {
        const price = itemUnitPrice(it, i.catalog.products.find((p) => p.id === it.productId)?.price) * it.quantity;
        bump(products, it.productId, it.name, it.quantity, undefined);
        if (it.partnerId && partners.get(it.partnerId)) bump(brands, it.partnerId, partners.get(it.partnerId)!.name, price);
      }
    }
  }
  // المرتجعات بتتحسب بتاريخها (حتى لو الطلب من فترة قبلها)
  const refundsByKind: Record<string, number> = {};
  for (const o of i.orders) {
    for (const r of o.refunds ?? []) {
      if (!inRange(dayOf(r.at), from, to)) continue;
      costs.refunds += r.amount;
      refundsByKind[r.kind] = (refundsByKind[r.kind] ?? 0) + r.amount;
    }
  }
  const periodExpenses = i.expenses.filter((e) => inRange(e.spentOn, from, to));
  costs.expenses = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const expensesByCategory = new Map<string, Ranked>();
  for (const e of periodExpenses) bump(expensesByCategory, e.category, e.category, e.amount);

  const totalCosts = Object.values(costs).reduce((s, v) => s + v, 0);
  // كارت الهدية مش مكسب وقت ما يتباع (فلوس هتتصرف على هدايا بعدين): بيبقى مكسب لما يتصرف على طلب
  const profit = cashIn - giftCardSales + paidWithGiftCards - totalCosts;
  const prevExpenses = i.expenses.filter((e) => inRange(e.spentOn, prevFrom, prevTo)).reduce((s, e) => s + e.amount, 0);
  const prev = profitOf(i.orders, i, prevFrom, prevTo, prevExpenses);

  // الخسارة والضايع
  const cancelled = inPeriod.filter((o) => o.status === "cancelled");
  const reasons = new Map<string, Ranked>();
  for (const o of cancelled) {
    const note = [...o.history].reverse().find((h) => h.status === "cancelled")?.note ?? "بدون سبب";
    const reason = /الدفع متأكدش|لم يُؤكَّد الدفع/.test(note) ? "لم يدفع في المهلة" : note;
    bump(reasons, reason, reason, 1);
  }

  // العملاء: بالموبايل على كل الطلبات
  const byPhone = new Map<string, { name: string; count: number }>();
  for (const o of i.orders.filter(counted)) {
    const k = digits(o.sender.phone);
    const cur = byPhone.get(k);
    if (cur) cur.count += 1;
    else byPhone.set(k, { name: o.sender.name, count: 1 });
  }
  const periodPhones = new Set(sold.map((o) => digits(o.sender.phone)));
  const returning = [...periodPhones].filter((k) => (byPhone.get(k)?.count ?? 0) >= 2);

  // المخزون اللي قرب يخلص (٣ أو أقل)
  const lowStock: Ranked[] = [];
  for (const p of i.catalog.products) {
    if (usesCombos(p.options)) {
      for (const cs of allCombos(p.options!)) {
        const s = comboStock(p.options, comboKey(cs));
        if (s != null && s <= 3) lowStock.push({ key: `${p.id}:${comboKey(cs)}`, label: `${p.name} (${describeChoices(p.options, cs)})`, value: s });
      }
    } else if (p.options?.length) {
      for (const o of p.options) for (const v of o.values) if (v.stock != null && v.stock <= 3) lowStock.push({ key: `${p.id}:${o.id}:${v.id}`, label: `${p.name} (${v.label})`, value: v.stock });
    } else if (p.stock != null && p.stock <= 3) lowStock.push({ key: p.id, label: p.name, value: p.stock });
  }

  return {
    from,
    to,
    orders: regular.length,
    prevOrders: i.orders.filter((o) => counted(o) && o.gifts.length > 0 && inRange(dayOf(o.createdAt), prevFrom, prevTo)).length,
    cashIn,
    prevCashIn: prev.cash,
    giftValue,
    avgOrder: regular.length ? giftValue / regular.length : 0,
    giftCardSales,
    paidWithGiftCards,
    costs,
    totalCosts,
    profit,
    prevProfit: prev.profit,
    margin: cashIn - giftCardSales + paidWithGiftCards > 0 ? profit / (cashIn - giftCardSales + paidWithGiftCards) : 0,
    income,
    losses: {
      cancelledCount: cancelled.length,
      cancelledValue: cancelled.reduce((s, o) => s + o.totals.total, 0),
      expiredCount: cancelled.filter((o) => o.history.some((h) => /الدفع متأكدش|لم يُؤكَّد الدفع/.test(h.note ?? ""))).length,
      discounts: sold.reduce((s, o) => s + o.totals.discount, 0),
      refundsByKind,
      cancelReasons: top(reasons, 6),
    },
    topProducts: top(products),
    topPackages: top(packages),
    zones: top(zones),
    sources: top(sources),
    expensesByCategory: top(expensesByCategory, 10),
    customers: {
      total: periodPhones.size,
      returning: returning.length,
      topReturning: returning
        .map((k) => ({ key: k, label: byPhone.get(k)!.name, value: byPhone.get(k)!.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    },
    brands: top(brands, 12),
    lowStock: lowStock.sort((a, b) => a.value - b.value).slice(0, 12),
    giftCardLiability: i.giftCardBalances,
  };
}
