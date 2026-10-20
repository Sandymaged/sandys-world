// شكل السلة وحساباتها. الأسعار هنا للعرض بس؛ السيرفر بيعيد حسابها من الكتالوج وقت الطلب.

import { packagingFee } from "./pricing";
import type { StoreSettings } from "./settings";
import type { DeliveryPeriod } from "./types";

export type GiftKind = "package" | "box" | "product" | "kit";

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number; // صفر لمحتويات الباكدج (داخلة في سعره)
  quantity: number;
  customization?: string;
  customizable?: boolean;
  maxChars?: number | null;
}

export interface GiftRecipient {
  name: string;
  phone: string;
  zoneId: string;
  address: string;
  landmark: string;
  locationUrl: string;
}

export interface CartGift {
  id: string;
  kind: GiftKind;
  title: string;
  slug?: string;
  image?: string; // للعرض في السلة بس
  people?: number; // للكيتات: عدد الصحاب
  names?: string; // للكيتات: الأسماء على الكروت، كل اسم في سطر
  refId: string; // id الباكدج أو حجم البوكس أو المنتج
  basePrice: number; // سعر الباكدج أو البوكس؛ صفر للمنتج المنفرد
  lines: CartLine[];
  addons: CartLine[];
  prepDays: number;
  recipient: GiftRecipient;
  delivery: { date: string; period: DeliveryPeriod | "" };
  cardMessage: string;
  hidePrice: boolean;
  surprise: boolean;
  wantsDeliveryPhoto: boolean;
}

export const emptyRecipient: GiftRecipient = {
  name: "",
  phone: "",
  zoneId: "",
  address: "",
  landmark: "",
  locationUrl: "",
};

export function hasCustomization(g: CartGift) {
  return g.lines.some((l) => l.customizable);
}

export interface GiftTotals {
  items: number; // الهدية نفسها (باكدج/بوكس/منتجات + إضافات)
  packaging: number; // سطر "تغليف وتنسيق" للبوكس بس
  total: number;
}

export function giftTotals(g: CartGift, settings: StoreSettings): GiftTotals {
  const lines = g.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const addons = g.addons.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const items = g.basePrice + lines + addons;
  const packaging =
    g.kind === "box" ? packagingFee(g.basePrice + lines, settings.packaging) : 0;
  return { items, packaging, total: items + packaging };
}

const PHONE_RE = /^(\+?\d[\d\s-]{7,16})$/;

export const isValidPhone = (s: string) => PHONE_RE.test(s.trim());

/** الحاجات الناقصة في الهدية قبل الدفع */
export function giftProblems(g: CartGift, settings: StoreSettings): string[] {
  const out: string[] = [];
  const r = g.recipient;
  if (!r.name.trim()) out.push("اسم المستلم");
  if (!isValidPhone(r.phone)) out.push("رقم موبايل المستلم");
  if (!r.zoneId) out.push("المنطقة");
  if (!r.address.trim()) out.push("العنوان");
  if (!g.delivery.date) out.push("يوم التوصيل");
  if (!g.delivery.period) out.push("فترة التوصيل");
  if (g.cardMessage.length > settings.maxCardMessage) out.push("رسالة الكارت أطول من المسموح");
  for (const l of g.lines) {
    if (l.customizable && !l.customization?.trim()) out.push("نص التخصيص");
  }
  return out;
}
