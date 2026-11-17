import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadCatalogData, type CatalogData } from "./db/catalog-store";
import { repo } from "./db";
import type { BrandOrderStatus, OrderRecord, OrderStatus } from "./db/types";
import { cairoMonth, commissionFor, itemUnitPrice, thresholdFrom, tierProgress } from "./commission";
import { addDays, cairoNow } from "./delivery";
import { adminClient } from "./supabase/admin";
import type { DeliveryPeriod } from "./types";

/*
 * البراند جوه الطلبات وحسابه مع المتجر.
 * - الطلبات اللي فيها منتجات البراند (بعد ما الدفع يتأكد)، ومنها سطوره بس، من غير بيانات العميل.
 *   البراند ماشي بالمخزون: أي طلب بيوصله لازم يتجهز، ولما العدد يخلص المنتج بيتقفل «خلص» لوحده.
 * - حسابه: سعر منتجاته ناقص عمولة المتجر (شرايح شهرية، lib/commission.ts). العمولة بتتثبت لحظة التسليم،
 *   والطلبات اللي لسه في الشغل عمولتها تقديرية. بيستحق بعد التسليم بـ HOLD_DAYS، والملغي مش بيتحسب.
 * - التحويلات اللي المتجر دفعها: جدول brand_payouts على Supabase، أو .data/brand-payouts.json.
 */

/** الفلوس بتستحق للبراند بعد التسليم للعميل بالمدة دي (مدة الاسترجاع) */
export const HOLD_DAYS = 3;

const onSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

// ───────────── سطور البراند في الطلب ─────────────

export interface BrandLine {
  productId: string;
  name: string;
  quantity: number;
  optionsText: string | null;
  customization: string | null;
  giftTitle: string;
  /** سعر القطعة اللي بيتحسب بيه (سعرها في الطلب، ولو جوه باكدج سعرها في الكتالوج) */
  unitPrice: number;
  gross: number;
  net: number;
}

export interface BrandOrder {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  deliveryDate: string;
  deliveryPeriod: DeliveryPeriod;
  deliveredAt: string | null;
  /** إمتى نصيبه يستحق (بعد التسليم بـ HOLD_DAYS) */
  dueAt: string | null;
  lines: BrandLine[];
  gross: number;
  commission: number;
  net: number;
  /** العمولة لسه تقديرية (الطلب لسه متسلمش) */
  estimated: boolean;
  /** الشهر اللي العمولة اتحسبت عليه */
  month: string | null;
  handedAt: string | null;
  /** لسه في الشغل (مش متسلم للعميل ولا ملغي) */
  open: boolean;
  /** طلب قادم: اتأكد بس لسه مابدأش يتجهز (جديد أو مستني موافقة التصميم) */
  upcoming: boolean;
  /** آخر يوم يسلّم فيه للمتجر (handByOf)، ولو عدّى ومسلّمش يبقى متأخر */
  handBy: string;
  late: boolean;
}

/**
 * آخر يوم البراند يسلّم فيه حاجته للمتجر: قبل يوم التوصيل بيوم،
 * إلا لو الطلب بدأ يتجهز في اليوم ده أو بعده (طلب قريب)، فيسلّم يوم التوصيل نفسه الصبح.
 */
export function handByOf(o: OrderRecord): string {
  const delivery = o.gifts[0]?.deliveryDate ?? "";
  if (!delivery) return "";
  const started = [...o.history].reverse().find((h) => h.status === "preparing")?.at;
  const dayBefore = addDays(delivery, -1);
  return started && cairoNow(new Date(started)).date >= dayBefore ? delivery : dayBefore;
}

/**
 * الطلب يبان للبراند من أول ما يتأكد: الدفع اتأكد أو الدفع عند الاستلام (حتى لو مستني موافقة التصميم)،
 * عشان يعرف إن فيه طلب جاي. اللي لسه مستني الدفع أو اتلغى مش بيبان.
 * قبل «بيتجهز» الطلب «قادم» (upcoming): البراند بيشوفه بس لسه مايقدرش يعلّم إنه سلّمه.
 */
const brandStatuses: OrderStatus[] = ["preparing", "ready", "out_for_delivery", "delivery_failed", "delivered"];
const upcomingStatuses: OrderStatus[] = ["new", "awaiting_design_approval"];
const confirmed = (o: OrderRecord) => o.paymentStatus === "confirmed" || o.paymentMethod === "cod";
const isUpcoming = (o: OrderRecord) => upcomingStatuses.includes(o.status) && confirmed(o);
const visibleToBrand = (o: OrderRecord) => o.gifts.length > 0 && (brandStatuses.includes(o.status) || isUpcoming(o));

export function brandOrderOf(o: OrderRecord, partnerId: string, catalog: CatalogData): BrandOrder | null {
  if (!visibleToBrand(o)) return null;
  const products = new Map(catalog.products.map((p) => [p.id, p]));
  const rate = catalog.partners.find((p) => p.id === partnerId)?.commissionRate ?? 0;
  const lines: BrandLine[] = [];
  let legacy = 0; // طلبات قبل نظام الشرايح: بالنسبة الثابتة اللي اتسجلت في الطلب
  for (const g of o.gifts) {
    for (const it of g.items) {
      if (it.partnerId !== partnerId) continue;
      // سعره في الطلب، أو سعره في الكتالوج وقت الشراء (الطلبات القديمة بس بتاخد السعر الحالي)
      const unit = itemUnitPrice(it, products.get(it.productId)?.price);
      const gross = unit * it.quantity;
      legacy += gross * (it.commissionRate ?? rate);
      lines.push({ productId: it.productId, name: it.name, quantity: it.quantity, optionsText: it.optionsText ?? null, customization: it.customization, giftTitle: g.title, unitPrice: unit, gross, net: gross });
    }
  }
  if (!lines.length) return null;
  const st = o.brandStatus?.[partnerId] ?? {};
  // بعد التسليم المبلغ اللي اتثبت وقتها هو المرجع (لو أسعار الكتالوج اتغيرت بعدين، الطلب ميتغيرش)
  if (st.settled && o.status === "delivered") {
    const sum = lines.reduce((s, l) => s + l.gross, 0);
    if (sum > 0 && Math.abs(sum - st.settled.gross) > 0.005) {
      const k = st.settled.gross / sum;
      for (const l of lines) {
        l.gross = r2(l.gross * k);
        l.unitPrice = r2(l.unitPrice * k);
        l.net = l.gross;
      }
    }
  }
  const delivered = [...o.history].reverse().find((h) => h.status === "delivered");
  const deliveredAt = o.status === "delivered" ? (delivered?.at ?? o.createdAt) : null;
  const bo: BrandOrder = {
    id: o.id,
    number: o.number,
    createdAt: o.createdAt,
    status: o.status,
    deliveryDate: o.gifts[0]?.deliveryDate ?? "",
    deliveryPeriod: o.gifts[0]?.deliveryPeriod ?? "morning",
    deliveredAt,
    dueAt: deliveredAt ? new Date(Date.parse(deliveredAt) + HOLD_DAYS * 86_400_000).toISOString() : null,
    lines,
    gross: st.settled && o.status === "delivered" && lines.some((l) => l.gross > 0) ? st.settled.gross : r2(lines.reduce((s, l) => s + l.gross, 0)),
    commission: 0,
    net: 0,
    estimated: !deliveredAt,
    month: st.settled?.month ?? (deliveredAt ? cairoMonth(deliveredAt) : null),
    handedAt: st.handedAt ?? null,
    open: o.status !== "delivered" && o.status !== "cancelled",
    upcoming: isUpcoming(o),
    handBy: handByOf(o),
    late: false,
  };
  bo.late = !bo.handedAt && (o.status === "preparing" || o.status === "ready") && !!bo.handBy && cairoNow().date > bo.handBy;
  return withCommission(bo, st.settled ? st.settled.commission : deliveredAt ? legacy : 0);
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** بيوزّع العمولة على سطور الطلب بنسبة سعر كل سطر */
function withCommission(bo: BrandOrder, commission: number): BrandOrder {
  const c = r2(Math.min(commission, bo.gross));
  const share = bo.gross > 0 ? c / bo.gross : 0;
  return { ...bo, commission: c, net: r2(bo.gross - c), lines: bo.lines.map((l) => ({ ...l, net: r2(l.gross * (1 - share)) })) };
}

/** الحد الشهري الحالي للبراند: متوسط أسعار منتجاته المعروضة × FREE_PIECES */
export function currentThreshold(partnerId: string, catalog: CatalogData, fallback: BrandOrder[] = []) {
  const prices = catalog.products.filter((p) => p.partnerId === partnerId && p.reviewStatus !== "pending" && p.price > 0).map((p) => p.price);
  const units = prices.length ? prices : fallback.flatMap((o) => o.lines.map((l) => l.unitPrice)).filter((x) => x > 0);
  return thresholdFrom(units.length ? units.reduce((s, x) => s + x, 0) / units.length : 0);
}

/** حد الشهر: لو اتثبت مع أول طلب اتسلم في الشهر ده بنستخدمه، وإلا الحد الحالي */
function monthThreshold(orders: OrderRecord[], partnerId: string, month: string, catalog: CatalogData, fallback: BrandOrder[]) {
  for (const o of orders) {
    const s = o.brandStatus?.[partnerId]?.settled;
    if (s?.month === month) return s.threshold;
  }
  return currentThreshold(partnerId, catalog, fallback);
}

/** الطلبات اللي لسه في الشغل: عمولة تقديرية كأنها هتتسلم الشهر ده بعد اللي اتسلم */
function estimateOpen(list: BrandOrder[], orders: OrderRecord[], partnerId: string, catalog: CatalogData): BrandOrder[] {
  const month = cairoMonth();
  const threshold = monthThreshold(orders, partnerId, month, catalog, list);
  let before = list.filter((o) => o.status === "delivered" && o.month === month).reduce((s, o) => s + o.gross, 0);
  const est = new Map<string, BrandOrder>();
  for (const o of list.filter((x) => x.open).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))) {
    est.set(o.id, withCommission(o, commissionFor(before, o.gross, threshold)));
    before += o.gross;
  }
  return list.map((o) => est.get(o.id) ?? o);
}

function brandOrdersFrom(orders: OrderRecord[], partnerId: string, catalog: CatalogData) {
  const list = orders.map((o) => brandOrderOf(o, partnerId, catalog)).filter((x): x is BrandOrder => x !== null);
  return estimateOpen(list, orders, partnerId, catalog).sort(
    (a, b) => Number(b.open) - Number(a.open) || (a.open ? a.deliveryDate.localeCompare(b.deliveryDate) : b.createdAt.localeCompare(a.createdAt)),
  );
}

export async function listBrandOrders(partnerId: string): Promise<BrandOrder[]> {
  const [orders, catalog] = await Promise.all([repo().list(), loadCatalogData()]);
  return brandOrdersFrom(orders, partnerId, catalog);
}

/** البراند في الشهر ده: باع كام من اللي اتسلم، والحد، وهو في أنهي شريحة */
export interface MonthProgress {
  month: string;
  threshold: number;
  sales: number;
  commission: number;
  rate: number;
  nextAt: number | null;
  nextRate: number | null;
  freeLeft: number;
}

function progressOf(list: BrandOrder[], orders: OrderRecord[], partnerId: string, catalog: CatalogData): MonthProgress {
  const month = cairoMonth();
  const threshold = monthThreshold(orders, partnerId, month, catalog, list);
  const mine = list.filter((o) => o.status === "delivered" && o.month === month);
  const sales = r2(mine.reduce((s, o) => s + o.gross, 0));
  return { month, threshold, sales, commission: r2(mine.reduce((s, o) => s + o.commission, 0)), ...tierProgress(sales, threshold) };
}

/**
 * لحظة التسليم للعميل: عمولة كل براند في الطلب بتتحسب على حسب مبيعاته اللي اتسلمت الشهر ده،
 * وبتتثبت في الطلب (مش بتتغير بعد كده لو الأسعار اتغيرت).
 */
export async function settleOnDelivery(orderId: string) {
  const r = repo();
  const o = await r.getById(orderId);
  if (!o || o.status !== "delivered") return;
  const [orders, catalog] = await Promise.all([r.list(), loadCatalogData()]);
  const month = cairoMonth();
  const others = orders.filter((x) => x.id !== o.id);
  const status = { ...(o.brandStatus ?? {}) };
  let changed = false;
  for (const p of catalog.partners) {
    if (status[p.id]?.settled) continue;
    const bo = brandOrderOf(o, p.id, catalog);
    if (!bo) continue;
    const threshold = monthThreshold(others, p.id, month, catalog, [bo]);
    const before = others.reduce((s, x) => {
      const st = x.brandStatus?.[p.id]?.settled;
      return st?.month === month ? s + st.gross : s;
    }, 0);
    status[p.id] = { ...status[p.id], settled: { month, threshold, gross: bo.gross, commission: commissionFor(before, bo.gross, threshold) } };
    changed = true;
  }
  if (changed) await r.update(orderId, { brandStatus: status });
}

async function patchBrandStatus(orderId: string, partnerId: string, fn: (s: BrandOrderStatus) => BrandOrderStatus, note: string) {
  const r = repo();
  const o = await r.getById(orderId);
  if (!o) return null;
  const all = { ...(o.brandStatus ?? {}) };
  all[partnerId] = fn({ ...(all[partnerId] ?? {}) });
  return r.update(orderId, { brandStatus: all }, { note });
}

/** البراند سلّم حاجته للمتجر */
export async function markHanded(orderId: string, partnerId: string, brandName: string, handed: boolean) {
  const o = await repo().getById(orderId);
  const catalog = await loadCatalogData();
  const bo = o && brandOrderOf(o, partnerId, catalog);
  if (!bo || !bo.open) return { ok: false as const, error: "هذا الطلب غير متاح" };
  if (bo.upcoming && handed) return { ok: false as const, error: "لم يبدأ تجهيز هذا الطلب بعد، ويمكنك تسليمه بعد أن يبدأ التجهيز" };
  await patchBrandStatus(orderId, partnerId, (s) => ({ ...s, handedAt: handed ? new Date().toISOString() : null }), handed ? `${brandName} سلّم المنتجات للمتجر` : `${brandName} ألغى «سلّمت»`);
  return { ok: true as const };
}

// ───────────── التحويلات للبراندات ─────────────

export interface BrandPayout {
  id: string;
  partnerId: string;
  amount: number;
  paidAt: string; // YYYY-MM-DD
  method: string;
  note: string;
}

const FILE = path.join(process.cwd(), ".data", "brand-payouts.json");

async function readPayoutsFile(): Promise<BrandPayout[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as BrandPayout[];
  } catch {
    return [];
  }
}
async function writePayoutsFile(all: BrandPayout[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(`${FILE}.tmp`, JSON.stringify(all, null, 2), "utf8");
  await rename(`${FILE}.tmp`, FILE);
}

export async function listPayouts(partnerId?: string): Promise<BrandPayout[]> {
  if (onSupabase()) {
    let q = adminClient().from("brand_payouts").select("*").order("paid_at", { ascending: false }).limit(2000);
    if (partnerId) q = q.eq("partner_id", partnerId);
    const { data, error } = await q;
    if (error) return []; // الـ migration لسه متشغلش
    return (data ?? []).map((r) => ({ id: r.id, partnerId: r.partner_id, amount: Number(r.amount), paidAt: r.paid_at, method: r.method ?? "", note: r.note ?? "" }));
  }
  const all = await readPayoutsFile();
  return all.filter((p) => !partnerId || p.partnerId === partnerId).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

export async function addPayout(p: Omit<BrandPayout, "id">) {
  if (onSupabase()) {
    const { error } = await adminClient()
      .from("brand_payouts")
      .insert({ partner_id: p.partnerId, amount: p.amount, paid_at: p.paidAt, method: p.method || null, note: p.note || null });
    if (error) throw new Error(error.message);
    return;
  }
  const all = await readPayoutsFile();
  all.push({ ...p, id: randomUUID() });
  await writePayoutsFile(all);
}

export async function deletePayout(id: string) {
  if (onSupabase()) {
    const { error } = await adminClient().from("brand_payouts").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  await writePayoutsFile((await readPayoutsFile()).filter((p) => p.id !== id));
}

// ───────────── كشف الحساب ─────────────

export interface BrandStatement {
  /** اتسلم للعميل وعدّت مدة الاسترجاع: مستحق للبراند */
  due: number;
  /** اتسلم للعميل ولسه في مدة الاسترجاع */
  holding: number;
  /** لسه في الشغل: هيستحق بعد ما يتسلم */
  pending: number;
  paid: number;
  /** المطلوب تحويله للبراند دلوقتي (المستحق ناقص اللي اتحوّل) */
  balance: number;
  /** إجمالي المبيعات وعمولة المتجر من الطلبات اللي اتسلمت */
  sales: number;
  commission: number;
  lastPaidAt: string | null;
  orders: BrandOrder[];
  payouts: BrandPayout[];
}

export const isDue = (o: BrandOrder, now = Date.now()) => o.status === "delivered" && !!o.dueAt && Date.parse(o.dueAt) <= now;

export function statementOf(orders: BrandOrder[], payouts: BrandPayout[], now = Date.now()): BrandStatement {
  const delivered = orders.filter((o) => o.status === "delivered");
  const due = delivered.filter((o) => isDue(o, now)).reduce((s, o) => s + o.net, 0);
  const holding = delivered.filter((o) => !isDue(o, now)).reduce((s, o) => s + o.net, 0);
  const sales = delivered.reduce((s, o) => s + o.gross, 0);
  const pending = orders.filter((o) => o.open).reduce((s, o) => s + o.net, 0);
  const paid = payouts.reduce((s, p) => s + p.amount, 0);
  const r = (n: number) => Math.round(n * 100) / 100;
  return {
    due: r(due),
    holding: r(holding),
    pending: r(pending),
    paid: r(paid),
    balance: r(due - paid),
    sales: r(sales),
    commission: r(delivered.reduce((s, o) => s + o.commission, 0)),
    lastPaidAt: payouts[0]?.paidAt ?? null,
    orders,
    payouts,
  };
}

export async function brandStatement(partnerId: string): Promise<BrandStatement & { progress: MonthProgress }> {
  const [orders, catalog, payouts] = await Promise.all([repo().list(), loadCatalogData(), listPayouts(partnerId)]);
  const list = brandOrdersFrom(orders, partnerId, catalog);
  return { ...statementOf(list, payouts), progress: progressOf(list, orders, partnerId, catalog) };
}

/** كشف حساب كل البراندات (لصفحة حسابات البراندات في اللوحة) */
export async function allStatements(): Promise<{ partnerId: string; name: string; s: BrandStatement; progress: MonthProgress }[]> {
  const [orders, catalog, payouts] = await Promise.all([repo().list(), loadCatalogData(), listPayouts()]);
  return catalog.partners.map((p) => {
    const list = brandOrdersFrom(orders, p.id, catalog);
    return { partnerId: p.id, name: p.name, s: statementOf(list, payouts.filter((x) => x.partnerId === p.id)), progress: progressOf(list, orders, p.id, catalog) };
  });
}
