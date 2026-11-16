// تسميات وألوان الحالات ولينكات واتساب للوحة التحكم (عربي بس)

import type { OrderRecord, OrderStatus, PaymentStatus } from "./db/types";

export const statusLabel: Record<OrderStatus, string> = {
  awaiting_payment: "بانتظار الدفع",
  new: "جديد",
  awaiting_design_approval: "بانتظار موافقة التصميم",
  preparing: "قيد التجهيز",
  ready: "جاهز",
  out_for_delivery: "خرج للتوصيل",
  delivery_failed: "تعذّر التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export const statusTone: Record<OrderStatus, string> = {
  awaiting_payment: "bg-butter-soft text-butter",
  new: "bg-brand-soft text-brand",
  awaiting_design_approval: "bg-lilac-soft text-lilac",
  preparing: "bg-lilac-soft text-lilac",
  ready: "bg-success-soft text-success",
  out_for_delivery: "bg-sky text-lilac",
  delivery_failed: "bg-butter-soft text-butter",
  delivered: "bg-success text-white",
  cancelled: "bg-line text-muted",
};

export const paymentLabel: Record<PaymentStatus, string> = {
  awaiting_proof: "بانتظار صورة التحويل",
  awaiting_confirmation: "بانتظار تأكيدك",
  confirmed: "مدفوع",
  rejected: "رُفض التحويل",
  cod: "الدفع عند الاستلام",
};

/**
 * الإلغاء بس قبل ما التجهيز يبدأ: بعد الطلب المتجر بيبعت رسالة تأكيد للعميل،
 * وأول ما يوافق الطلب بيدخل «بيتجهز» ومن ساعتها مفيش إلغاء.
 */
export const cancellable: OrderStatus[] = ["awaiting_payment", "new", "awaiting_design_approval"];

/** الخطوة الجاية الطبيعية لكل حالة */
export const nextStatus: Partial<Record<OrderStatus, OrderStatus[]>> = {
  new: ["preparing", "awaiting_design_approval"],
  awaiting_design_approval: ["preparing"],
  preparing: ["ready"],
  ready: ["out_for_delivery"],
  out_for_delivery: ["delivered", "delivery_failed"],
  // المحاولة التانية بتتسجل من «محاولة توصيل تانية» (نفس اليوم ببلاش، ويوم تاني برسوم)
};

/** 01xxxxxxxxx → 201xxxxxxxxx لواتساب */
export function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) return d.slice(2);
  if (d.startsWith("0") && d.length === 11) return `2${d}`;
  return d;
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/** رسايل واتساب جاهزة (FR-63 / FR-72) — بتتبعت يدوي من اللوحة لحد WhatsApp Business API */
export function waMessages(o: OrderRecord, orderUrl: string) {
  const name = o.sender.name.split(" ")[0];
  const en = o.locale === "en";
  return {
    confirmed: en
      ? `Hi ${name}! Your payment for order #${o.number} is confirmed and we're preparing it now. Track it here: ${orderUrl}`
      : `أهلاً ${name}! تم تأكيد الدفع للطلب رقم #${o.number}، ونجهّزه الآن. يمكنك متابعته من هنا: ${orderUrl}`,
    rejected: en
      ? `Hi ${name}, we couldn't confirm the transfer for order #${o.number} (${o.paymentRejectionReason ?? ""}). You can upload it again here: ${orderUrl}`
      : `أهلاً ${name}، تعذّر تأكيد التحويل للطلب رقم #${o.number} (${o.paymentRejectionReason ?? ""}). يمكنك رفعه مرة أخرى من هنا: ${orderUrl}`,
    ready: en
      ? `Hi ${name}! Order #${o.number} is wrapped and ready. Here's a photo before it goes out 🎁`
      : `أهلاً ${name}! الطلب رقم #${o.number} مغلّف وجاهز، وهذه صورته قبل خروجه 🎁`,
    out: en ? `Order #${o.number} is out for delivery now!` : `الطلب رقم #${o.number} خرج للتوصيل الآن!`,
    delivered: en ? `Order #${o.number} was delivered 💝 Here's the delivery photo.` : `تم تسليم الطلب رقم #${o.number} 💝 وهذه صورة التسليم.`,
  };
}
