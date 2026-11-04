"use server";

import { isLocale } from "@/i18n/config";
import { translator } from "@/i18n/t";
import { isValidPhone } from "@/lib/cart";
import { normalizePhone } from "@/lib/validate";
import { getStorefront } from "@/lib/catalog";
import { repo } from "@/lib/db";
import { egp } from "@/lib/format";
import {
  GIFT_CARD_MAX,
  GIFT_CARD_MAX_MESSAGE,
  GIFT_CARD_MIN,
  isGiftCardDesign,
  normalizeGiftCardCode,
  type GiftCardDesign,
} from "@/lib/gift-card";

export interface GiftCardInput {
  design: GiftCardDesign;
  amount: number;
  asGift: boolean;
  toName: string;
  toPhone: string;
  fromName: string;
  message: string;
  sender: { name: string; phone: string; email: string };
}

export type GiftCardSubmitResult = { ok: true; token: string } | { ok: false; errors: string[] };

/** شراء كارت هدية: بيتعمل أوردر مستني الدفع بإنستاباي، والكود بيطلع لما الدفع يتأكد */
export async function submitGiftCardOrder(input: GiftCardInput, locale: string): Promise<GiftCardSubmitResult> {
  const lang = isLocale(locale) ? locale : "ar";
  const t = translator(lang);
  const errors: string[] = [];
  const amount = Math.round(Number(input.amount));

  if (!isGiftCardDesign(input.design)) errors.push(t("اختار شكل الكارت"));
  if (!Number.isFinite(amount) || amount < GIFT_CARD_MIN || amount > GIFT_CARD_MAX) {
    errors.push(t("المبلغ لازم يكون من {min} لـ {max}", { min: egp(GIFT_CARD_MIN, t), max: egp(GIFT_CARD_MAX, t) }));
  }
  if (!input.sender.name.trim()) errors.push(t("اكتب اسمك"));
  if (!isValidPhone(input.sender.phone)) errors.push(t("رقم موبايلك مش مظبوط"));
  if (input.asGift) {
    if (!input.toName.trim()) errors.push(t("اكتب اسم اللي هيوصله الكارت"));
    if (!isValidPhone(input.toPhone)) errors.push(t("رقم اللي هيوصله الكارت مش مظبوط"));
  }
  if (input.message.length > GIFT_CARD_MAX_MESSAGE) errors.push(t("الرسالة طويلة"));
  if (errors.length) return { ok: false, errors };

  const settings = (await getStorefront()).settings;
  const order = await repo().createOrder({
    locale: lang,
    sender: { name: input.sender.name.trim(), phone: normalizePhone(input.sender.phone), email: input.sender.email.trim() },
    status: "awaiting_payment",
    paymentMethod: "instapay",
    paymentStatus: "awaiting_proof",
    transferReference: null,
    proofFile: null,
    paymentDueAt: new Date(Date.now() + settings.paymentWindowHours * 3_600_000).toISOString(),
    paymentConfirmedAt: null,
    paymentRejectionReason: null,
    couponCode: null,
    giftCard: {
      design: input.design,
      amount,
      asGift: input.asGift,
      toName: input.asGift ? input.toName.trim() : "",
      toPhone: input.asGift ? input.toPhone.trim() : "",
      fromName: input.fromName.trim().slice(0, 40),
      message: input.message.trim(),
      code: null,
      expiresAt: null,
    },
    totals: { items: amount, packaging: 0, delivery: 0, discount: 0, total: amount },
    gifts: [],
  });
  return { ok: true, token: order.token };
}

/** في صفحة الدفع: الكود ده صالح وفيه كام؟ */
export async function checkGiftCard(code: string, locale: string) {
  const t = translator(isLocale(locale) ? locale : "ar");
  const c = await repo().getGiftCard(normalizeGiftCardCode(code));
  if (!c) return { ok: false as const, message: t("كارت الهدية ده مش موجود") };
  if (Date.parse(c.expiresAt) < Date.now()) return { ok: false as const, message: t("كارت الهدية ده انتهت صلاحيته") };
  if (c.balance <= 0) return { ok: false as const, message: t("رصيد كارت الهدية خلص") };
  return { ok: true as const, code: c.code, balance: c.balance };
}
