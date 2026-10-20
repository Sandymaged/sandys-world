"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, endSession, requireAdmin, startSession } from "./admin-auth";
import { repo } from "./db";
import type { OrderStatus } from "./db/types";
import { GIFT_CARD_VALID_MONTHS } from "./gift-card";

export async function adminLogin(_: unknown, form: FormData): Promise<{ error: string } | void> {
  const pass = String(form.get("password") ?? "");
  if (!checkPassword(pass)) return { error: "كلمة السر غلط" };
  await startSession();
  redirect("/admin");
}

export async function adminLogout() {
  await endSession();
  redirect("/admin/login");
}

const allowed: OrderStatus[] = ["new", "awaiting_design_approval", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];

/** تغيير حالة الأوردر (FR-101). الإلغاء بيفك فترات التوصيل المحجوزة */
export async function setOrderStatus(id: string, status: OrderStatus, note?: string) {
  await requireAdmin();
  if (!allowed.includes(status)) return;
  const db = repo();
  const order = await db.getById(id);
  if (!order || order.status === status) return;
  await db.update(id, { status }, { status, note, by: "admin" });
  if (status === "cancelled" && order.status !== "cancelled") {
    for (const g of order.gifts) await db.releaseSlot(g.deliveryDate, g.deliveryPeriod);
    if (order.giftCardUse) await db.restoreGiftCard(order.giftCardUse.code, order.giftCardUse.ref);
  }
  revalidatePath("/[lang]/admin", "layout");
}

/** تأكيد الدفع بعد ما المبلغ يوصل الحساب (FR-63): الأوردر بيدخل "جديد" */
export async function confirmPayment(id: string) {
  await requireAdmin();
  const db = repo();
  const order = await db.getById(id);
  if (!order || order.paymentMethod !== "instapay") return;

  // شراء كارت هدية: الكود بيتعمل دلوقتي، والطلب بيخلص (مفيش حاجة بتتجهز أو تتوصل)
  if (order.giftCard) {
    if (order.giftCard.code) return;
    const expires = new Date();
    expires.setMonth(expires.getMonth() + GIFT_CARD_VALID_MONTHS);
    const card = await db.issueGiftCard(order.id, order.giftCard.amount, expires.toISOString());
    await db.update(
      id,
      {
        paymentStatus: "confirmed",
        paymentConfirmedAt: new Date().toISOString(),
        paymentRejectionReason: null,
        status: "delivered",
        giftCard: { ...order.giftCard, code: card.code, expiresAt: card.expiresAt },
      },
      { status: "delivered", note: `الدفع اتأكد وكارت الهدية اتعمل: ${card.code}`, by: "admin" },
    );
    revalidatePath("/[lang]/admin", "layout");
    return;
  }

  const needsDesign = order.gifts.some((g) => g.items.some((it) => it.customization));
  const status: OrderStatus = needsDesign ? "awaiting_design_approval" : "new";
  await db.update(
    id,
    { paymentStatus: "confirmed", paymentConfirmedAt: new Date().toISOString(), paymentRejectionReason: null, status },
    { status, note: "الدفع اتأكد", by: "admin" },
  );
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
