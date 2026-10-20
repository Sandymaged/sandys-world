"use server";

import { randomUUID } from "node:crypto";
import { isLocale } from "@/i18n/config";
import { translator } from "@/i18n/t";
import { getStorefront, localizeStorefront } from "@/lib/catalog";
import { quoteOrder, type OrderInput } from "@/lib/order-quote";
import type { CouponRule } from "@/lib/pricing";
import { coupons as seedCoupons } from "@/lib/seed-data";
import { repo } from "@/lib/db";
import type { GiftRecord } from "@/lib/db/types";
import { cairoNow, periodLabel } from "@/lib/delivery";
import { egp, formatDay } from "@/lib/format";
import { normalizeGiftCardCode } from "@/lib/gift-card";
import type { DeliveryPeriod } from "@/lib/types";
import { adminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/public";

async function findCoupon(code: string): Promise<CouponRule | string> {
  const c = code.trim().toUpperCase();
  if (!c) return "اكتب الكود";
  let row: { kind: "percent" | "amount"; value: number; minOrder: number; expiresAt: string | null; maxUses: number | null; used: number } | null = null;

  if (supabaseConfigured) {
    const { data } = await adminClient()
      .from("coupons")
      .select("kind, value, min_order, expires_at, max_uses, used_count, is_active")
      .eq("code", c)
      .maybeSingle();
    if (data?.is_active) {
      row = { kind: data.kind, value: Number(data.value), minOrder: Number(data.min_order), expiresAt: data.expires_at, maxUses: data.max_uses, used: data.used_count };
    }
  } else {
    const s = seedCoupons.find((x) => x.code === c);
    if (s) row = { ...s, used: await repo().couponUses(c) };
  }

  if (!row) return "الكود ده مش موجود";
  if (row.expiresAt && Date.parse(row.expiresAt) < Date.now()) return "الكود ده انتهى";
  if (row.maxUses != null && row.used >= row.maxUses) return "الكود ده خلص";
  return { kind: row.kind, value: row.value, minOrder: row.minOrder };
}

export async function checkCoupon(code: string, giftsTotal: number, locale: string) {
  const t = translator(isLocale(locale) ? locale : "ar");
  const r = await findCoupon(code);
  if (typeof r === "string") return { ok: false as const, message: t(r) };
  if (giftsTotal < r.minOrder) return { ok: false as const, message: t("الكود محتاج طلب بـ {price} على الأقل", { price: egp(r.minOrder, t) }) };
  return { ok: true as const, rule: r };
}

export type SubmitResult = { ok: true; token: string; number: number } | { ok: false; errors: string[] };

export async function submitOrder(input: OrderInput & { giftCardCode?: string }, locale: string): Promise<SubmitResult> {
  const lang = isLocale(locale) ? locale : "ar";
  const t = translator(lang);
  const raw = await getStorefront();
  const sf = localizeStorefront(raw, lang);
  let coupon: CouponRule | null = null;
  const couponCode = input.couponCode.trim().toUpperCase();
  if (couponCode) {
    const r = await findCoupon(couponCode);
    if (typeof r === "string") return { ok: false, errors: [t(r)] };
    coupon = r;
  }
  const quote = quoteOrder(sf, input, coupon, undefined, t);
  if (quote.errors.length) return { ok: false, errors: quote.errors };

  const db = repo();

  // حجز فترات التوصيل (FR-52): لو فترة اتملت، نفك اللي اتحجز ونقول للعميل
  const capacity = raw.settings.defaultSlotCapacity;
  const reserved: { date: string; period: DeliveryPeriod }[] = [];
  for (const g of quote.gifts) {
    const { date, period } = g.source.delivery as { date: string; period: DeliveryPeriod };
    if (!(await db.reserveSlot(date, period, capacity))) {
      for (const r of reserved) await db.releaseSlot(r.date, r.period);
      return {
        ok: false,
        errors: [t("فترة {period} يوم {day} اتملت. اختار فترة أو يوم تاني من السلة.", { period: periodLabel(period, raw.settings, t), day: formatDay(date, t) })],
      };
    }
    reserved.push({ date, period });
  }
  const releaseAll = async () => {
    for (const r of reserved) await db.releaseSlot(r.date, r.period);
  };

  // كارت هدية: بيتخصم من رصيده لحد قيمة الطلب، والباقي بيتدفع عادي
  let giftCardUse: { code: string; amount: number; ref: string } | null = null;
  if (input.giftCardCode?.trim()) {
    const code = normalizeGiftCardCode(input.giftCardCode);
    const card = await db.getGiftCard(code);
    const amount = card ? Math.min(card.balance, quote.total) : 0;
    const ref = randomUUID();
    if (!card || amount <= 0 || !(await db.redeemGiftCard(code, amount, ref))) {
      await releaseAll();
      return { ok: false, errors: [t("كارت الهدية مش صالح أو رصيده خلص")] };
    }
    giftCardUse = { code, amount, ref };
  }

  // البيانات بتتسجل بالعربي (لوحة التحكم عربي)، والأسعار من السيرفر مش من المتصفح
  const products = new Map(raw.products.map((p) => [p.id, p]));
  const zones = new Map(raw.zones.map((z) => [z.id, z]));
  const gifts: GiftRecord[] = quote.gifts.map((g) => {
    const c = g.source;
    return {
      id: c.id,
      kind: c.kind,
      refId: c.refId,
      title: c.title,
      recipient: {
        name: c.recipient.name.trim(),
        phone: c.recipient.phone.trim(),
        zoneId: c.recipient.zoneId,
        zoneName: zones.get(c.recipient.zoneId)?.name ?? "",
        address: c.recipient.address.trim(),
        landmark: c.recipient.landmark.trim(),
        locationUrl: c.recipient.locationUrl.trim(),
      },
      deliveryDate: c.delivery.date,
      deliveryPeriod: c.delivery.period as DeliveryPeriod,
      deliveryFee: g.deliveryFee,
      basePrice: g.basePrice,
      packaging: g.packaging,
      cardMessage: c.cardMessage.trim(),
      hidePrice: c.hidePrice,
      surprise: c.surprise,
      wantsDeliveryPhoto: c.wantsDeliveryPhoto,
      people: c.people ?? null,
      names: c.names ?? null,
      items: g.items.map((it) => {
        const p = products.get(it.productId);
        return {
          productId: it.productId,
          name: p?.name ?? it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          isAddon: it.isAddon,
          customization: it.customization,
          partnerId: p?.partnerId ?? null,
          commissionRate: null,
        };
      }),
    };
  });

  const today = cairoNow().date;
  const sameDay = gifts.some((g) => g.deliveryDate === today);
  const total = quote.total - (giftCardUse?.amount ?? 0);
  // لو كارت الهدية غطّى الطلب كله، مفيش دفع والطلب بيدخل على طول
  const fullyPaid = total <= 0;
  const instapay = input.paymentMethod === "instapay" && !fullyPaid;
  const hours = sameDay ? raw.settings.sameDayPaymentWindowHours : raw.settings.paymentWindowHours;
  const needsDesign = gifts.some((g) => g.items.some((it) => it.customization));

  const order = await db.createOrder({
    locale: lang,
    sender: { name: input.sender.name.trim(), phone: input.sender.phone.trim(), email: input.sender.email.trim() },
    status: instapay ? "awaiting_payment" : fullyPaid && needsDesign ? "awaiting_design_approval" : "new",
    paymentMethod: fullyPaid ? "instapay" : input.paymentMethod,
    paymentStatus: fullyPaid ? "confirmed" : instapay ? "awaiting_proof" : "cod",
    transferReference: null,
    proofFile: null,
    paymentDueAt: instapay ? new Date(Date.now() + hours * 3_600_000).toISOString() : null,
    paymentConfirmedAt: fullyPaid ? new Date().toISOString() : null,
    paymentRejectionReason: null,
    couponCode: coupon ? couponCode : null,
    giftCardUse,
    totals: {
      items: quote.itemsTotal,
      packaging: quote.packagingTotal,
      delivery: quote.deliveryTotal,
      discount: quote.discount,
      giftCard: giftCardUse?.amount ?? 0,
      total: Math.max(0, total),
    },
    gifts,
  });
  if (coupon) await db.useCoupon(couponCode);
  return { ok: true, token: order.token, number: order.number };
}
