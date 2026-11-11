"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminAccountInfo, checkLogin, endSession, requireAdmin, setAdminAccount, startSession } from "./admin-auth";
import { cancellable } from "./admin-format";
import { settleOnDelivery } from "./brand-portal";
import { getStorefront } from "./catalog";
import { repo, uniqueSlots } from "./db";
import type { OrderStatus, Redelivery } from "./db/types";
import { cairoNow, periodLabel } from "./delivery";
import { formatDay } from "./format";
import { GIFT_CARD_VALID_DAYS } from "./gift-card";
import { orderStockLines, returnStock, takeStock } from "./stock";
import type { DeliveryPeriod } from "./types";
import { toLatinDigits } from "./validate";

export async function adminLogin(_: unknown, form: FormData): Promise<{ error: string } | void> {
  const user = String(form.get("username") ?? "");
  const pass = String(form.get("password") ?? "");
  if (!(await checkLogin(user, pass))) {
    // تأخير بسيط عشان محدش يجرّب كلمات سر كتير ورا بعض بسرعة
    await new Promise((r) => setTimeout(r, 800));
    return { error: "اسم المستخدم أو كلمة السر غلط" };
  }
  await startSession();
  redirect("/admin");
}

/** تغيير اسم المستخدم وكلمة السر من «حسابي» (لازم كلمة السر الحالية) */
export async function changeAdminAccount(f: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const current = String(f.get("current") ?? "");
  const username = String(f.get("username") ?? "").trim();
  const password = String(f.get("password") ?? "");
  const confirm = String(f.get("confirm") ?? "");
  const info = await adminAccountInfo();
  if (!(await checkLogin(info.username, current))) return { ok: false, error: "كلمة السر الحالية غلط" };
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) return { ok: false, error: "اسم المستخدم من 3 لـ 30 حرف إنجليزي أو رقم (ومسموح . _ -)" };
  if (password.length < 8) return { ok: false, error: "كلمة السر الجديدة لازم تكون 8 حروف على الأقل" };
  if (password !== confirm) return { ok: false, error: "تأكيد كلمة السر مش زي كلمة السر" };
  try {
    await setAdminAccount(username, password);
  } catch (e) {
    return { ok: false, error: `ماتحفظش: ${e instanceof Error ? e.message : ""}` };
  }
  // الجلسات القديمة (أي جهاز تاني) بتقفل، والجهاز ده بيفضل داخل بجلسة جديدة
  await startSession();
  return { ok: true };
}

export async function adminLogout() {
  await endSession();
  redirect("/admin/login");
}

const allowed: OrderStatus[] = ["new", "awaiting_design_approval", "preparing", "ready", "out_for_delivery", "delivery_failed", "delivered", "cancelled"];

/**
 * تغيير حالة الأوردر (FR-101).
 * - «بيتجهز»: هنا المخزون بيتخصم (مش وقت الطلب)، ولو حاجة مش كفاية الحالة مش بتتغير.
 * - الإلغاء: بس قبل التجهيز، وبيفك فترات التوصيل ورصيد كارت الهدية (والمخزون لو كان اتخصم).
 */
export async function setOrderStatus(id: string, status: OrderStatus, note?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!allowed.includes(status)) return { ok: false, error: "الحالة دي مش مسموحة" };
  const db = repo();
  const order = await db.getById(id);
  if (!order) return { ok: false, error: "الأوردر مش موجود" };
  if (order.status === status) return { ok: true };
  if (status === "cancelled" && !cancellable.includes(order.status)) return { ok: false, error: "التجهيز بدأ، فالطلب مينفعش يتلغي" };

  let patch: Partial<typeof order> = { status };
  if (status === "preparing" && order.stockTaken === false) {
    const r = await takeStock(orderStockLines(order.gifts));
    if (!r.ok) {
      const name = order.gifts.flatMap((g) => g.items).find((it) => it.productId === r.productId)?.name ?? "منتج";
      return { ok: false, error: `المخزون مش كفاية لـ «${name}». زوّدي العدد أو كلّمي العميل قبل ما الطلب يبدأ يتجهز.` };
    }
    patch = { status, stockTaken: true };
    updateTag("catalog");
  }
  await db.update(id, patch, { status, note, by: "admin" });
  // عمولة البراندات بتتحسب وتتثبت لحظة التسليم (شرايح الشهر)
  if (status === "delivered") await settleOnDelivery(id);
  if (status === "cancelled" && order.status !== "cancelled") {
    for (const s of uniqueSlots(order.gifts)) await db.releaseSlot(s.date, s.period);
    if (order.giftCardUse) await db.restoreGiftCard(order.giftCardUse.code, order.giftCardUse.ref);
    if (order.stockTaken !== false) {
      await returnStock(orderStockLines(order.gifts));
      updateTag("catalog");
    }
  }
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}

/**
 * محاولة توصيل تانية بعد «التوصيل ماتمش».
 * - نفس اليوم: ببلاش، والطلب بيرجع «خرج للتوصيل».
 * - يوم تاني: بيتحجز ميعاد جديد، ورسوم التوصيل بتتزود على الطلب، والطلب بيرجع «جاهز» لحد اليوم ده.
 */
export async function redeliverAction(id: string, f: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const db = repo();
  const order = await db.getById(id);
  if (!order) return { ok: false, error: "الأوردر مش موجود" };
  if (order.status !== "delivery_failed") return { ok: false, error: "المحاولة التانية بتتسجل بس لما التوصيل مايتمش" };

  if (f.get("mode") === "same_day") {
    await db.update(id, { status: "out_for_delivery" }, { status: "out_for_delivery", note: "محاولة تانية في نفس اليوم (ببلاش)", by: "admin" });
    revalidatePath("/[lang]/admin", "layout");
    return { ok: true };
  }

  const { settings } = await getStorefront();
  const date = String(f.get("date") ?? "");
  const period = String(f.get("period") ?? "") as DeliveryPeriod;
  const fee = Number(toLatinDigits(String(f.get("fee") ?? "")).trim());
  const today = cairoNow().date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "اختاري اليوم" };
  if (date <= today) return { ok: false, error: "اليوم لازم يكون بعد النهارده (نفس اليوم ببلاش)" };
  if (!settings.periods.some((p) => p.id === period)) return { ok: false, error: "اختاري الفترة" };
  if (!Number.isFinite(fee) || fee < 0 || fee > 5000) return { ok: false, error: "اكتبي رسوم التوصيل بالأرقام" };
  if (!(await db.reserveSlot(date, period, settings.defaultSlotCapacity))) return { ok: false, error: "الفترة دي اتملت، اختاري فترة أو يوم تاني" };

  const r: Redelivery = { at: new Date().toISOString(), date, period, fee: Math.round(fee), paidAt: fee > 0 ? null : new Date().toISOString() };
  const gifts = order.gifts.map((g, i) => ({
    ...g,
    deliveryDate: date,
    deliveryPeriod: period,
    ...(i === 0 ? { redeliveries: [...(g.redeliveries ?? []), r] } : {}),
  }));
  const totals = { ...order.totals, delivery: order.totals.delivery + r.fee, total: order.totals.total + r.fee };
  await db.update(
    id,
    { gifts, totals, status: "ready" },
    { status: "ready", note: `التوصيل اتأجل لـ ${formatDay(date)} (${periodLabel(period, settings)})${r.fee ? `، برسوم توصيل ${r.fee} ج.م` : " ببلاش"}`, by: "admin" },
  );
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}

/** العميل دفع رسوم المحاولة التانية */
export async function markRedeliveryPaid(id: string, index: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const db = repo();
  const order = await db.getById(id);
  const list = order?.gifts[0]?.redeliveries ?? [];
  if (!order || !list[index]) return { ok: false, error: "مش موجودة" };
  if (list[index].paidAt) return { ok: true };
  const updated = list.map((r, i) => (i === index ? { ...r, paidAt: new Date().toISOString() } : r));
  const gifts = order.gifts.map((g, i) => (i === 0 ? { ...g, redeliveries: updated } : g));
  await db.update(id, { gifts }, { note: `رسوم التوصيل التاني (${list[index].fee} ج.م) اتدفعت`, by: "admin" });
  revalidatePath("/[lang]/admin", "layout");
  return { ok: true };
}

/** تأكيد الدفع بعد ما المبلغ يوصل الحساب (FR-63): الأوردر بيدخل "جديد" */
export async function confirmPayment(id: string) {
  await requireAdmin();
  const db = repo();
  const order = await db.getById(id);
  if (!order || order.paymentMethod !== "instapay") return;

  if (order.paymentStatus === "confirmed") return;

  // كروت الهدايا: الكود بيتعمل دلوقتي لكل كارت لسه ملوش كود
  const expires = new Date(Date.now() + GIFT_CARD_VALID_DAYS * 24 * 60 * 60 * 1000);
  const giftCards = [];
  for (const c of order.giftCards ?? []) {
    if (c.code) {
      giftCards.push(c);
      continue;
    }
    const card = await db.issueGiftCard(order.id, c.amount, expires.toISOString());
    giftCards.push({ ...c, code: card.code, expiresAt: card.expiresAt });
  }
  const codes = giftCards.map((c) => c.code).join("، ");

  // طلب كروت بس: بيخلص على طول (مفيش حاجة بتتجهز أو تتوصل). غير كده الهدايا بتبدأ تتجهز
  const needsDesign = order.gifts.some((g) => g.items.some((it) => it.customization || it.customImage));
  const status: OrderStatus = order.gifts.length === 0 ? "delivered" : needsDesign ? "awaiting_design_approval" : "new";
  await db.update(
    id,
    {
      paymentStatus: "confirmed",
      paymentConfirmedAt: new Date().toISOString(),
      paymentRejectionReason: null,
      status,
      ...(giftCards.length ? { giftCards } : {}),
    },
    { status, note: codes ? `الدفع اتأكد وكروت الهدايا اتعملت: ${codes}` : "الدفع اتأكد", by: "admin" },
  );
  revalidatePath("/[lang]/admin", "layout");
}

/** كارت الهدية اتبعت على واتساب (أو اترجع «لسه ماتبعتش» لو اتعلّم بالغلط)، والعميل بيشوفها في صفحة طلبه */
export async function setGiftCardSent(id: string, code: string, sent: boolean) {
  await requireAdmin();
  const db = repo();
  const order = await db.getById(id);
  const card = order?.giftCards?.find((c) => c.code === code);
  if (!order || !card || Boolean(card.sentAt) === sent) return;
  const giftCards = order.giftCards!.map((c) => (c.code === code ? { ...c, sentAt: sent ? new Date().toISOString() : null } : c));
  const to = card.asGift ? card.toName : "المشتري";
  await db.update(id, { giftCards }, { note: sent ? `كارت ${code} اتبعت لـ ${to} على واتساب` : `كارت ${code}: اترجع «لسه ماتبعتش»`, by: "admin" });
  revalidatePath("/[lang]/admin", "layout");
}

/** رفض التحويل مع سبب (FR-64): العميل بيقدر يرفع إثبات تاني من نفس اللينك */
export async function rejectPayment(id: string, form: FormData) {
  await requireAdmin();
  const reason = String(form.get("reason") ?? "").trim() || "المبلغ موصلش";
  const db = repo();
  const order = await db.getById(id);
  if (!order) return;
  await db.update(id, { paymentStatus: "rejected", paymentRejectionReason: reason.slice(0, 200) }, { note: `التحويل اترفض: ${reason}`, by: "admin" });
  revalidatePath("/[lang]/admin", "layout");
}
