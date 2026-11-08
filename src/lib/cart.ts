// شكل السلة وحساباتها. الأسعار هنا للعرض بس؛ السيرفر بيعيد حسابها من الكتالوج وقت الطلب.

import { missingOptions, optionsPrice, type OptionChoice, type ProductOption } from "./options";
import { recipientErrors } from "./validate";
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
  /** اختيارات المنتج وقت الإضافة (للعرض والاختيار في السلة)، واللي العميل اختاره */
  options?: ProductOption[];
  choices?: OptionChoice[];
}

/** سعر القطعة بعد فرق الاختيارات (محتويات الباكدج سعرها صفر وفرق الاختيار مش بيتحسب عليها) */
export const linePrice = (l: CartLine) => (l.unitPrice > 0 ? l.unitPrice + optionsPrice(l.options, l.choices) : 0);

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
  /** اختيار التغليف (id من إعدادات المتجر) */
  wrapping?: string;
  /** للباكدج: مقاس البوكس اللي العميل اختاره (سعره جوه basePrice)، أو فاضي = من غير بوكس */
  boxSizeId?: string;
}

/**
 * التوصيل للطلب كله (الطلب بيروح لشخص واحد): المستلم والعنوان والميعاد مرة واحدة،
 * وكل الهدايا بتروح مع بعض برسوم توصيل واحدة.
 */
export interface OrderDelivery {
  recipient: GiftRecipient;
  date: string;
  period: DeliveryPeriod | "";
  hidePrice: boolean;
  surprise: boolean;
  wantsDeliveryPhoto: boolean;
  /** رسالة الكارت: واحدة للطلب كله (بتتحط في كارت واحد مع الهدايا) */
  cardMessage: string;
}

export const emptyRecipient: GiftRecipient = {
  name: "",
  phone: "",
  zoneId: "",
  address: "",
  landmark: "",
  locationUrl: "",
};

/** العميل عرفنا منين (بيظهر في التقارير عشان نعرف أنهي إعلان بيجيب طلبات) */
export const orderSources = ["إنستجرام", "فيسبوك", "تيك توك", "واتساب", "صاحب أو قريب", "جوجل", "طلبت قبل كده", "حاجة تانية"];

export const emptyDelivery = (): OrderDelivery => ({
  recipient: { ...emptyRecipient },
  date: "",
  period: "",
  hidePrice: true,
  surprise: false,
  wantsDeliveryPhoto: true,
  cardMessage: "",
});

/** الهدايا زي ما بتتبعت للسيرفر: كل هدية واخدة بيانات توصيل الطلب */
export const withDelivery = (gifts: CartGift[], d: OrderDelivery): CartGift[] =>
  gifts.map((g, i) => ({
    ...g,
    // كارت واحد للطلب كله: الرسالة على أول هدية بس
    cardMessage: i === 0 ? (d.cardMessage ?? "").trim() : "",
    recipient: { ...d.recipient },
    delivery: { date: d.date, period: d.period },
    hidePrice: d.hidePrice,
    surprise: d.surprise,
    wantsDeliveryPhoto: d.wantsDeliveryPhoto,
  }));

/** أكبر مدة تجهيز في الطلب (أقرب يوم توصيل بيتحسب منها) */
export const orderPrepDays = (gifts: CartGift[]) => Math.max(0, ...gifts.map((g) => g.prepDays));

export function hasCustomization(g: CartGift) {
  return g.lines.some((l) => l.customizable);
}

export interface GiftTotals {
  items: number; // الهدية نفسها (باكدج/بوكس/منتجات + إضافات)
  packaging: number; // سطر "تغليف وتنسيق" للبوكس بس
  total: number;
}

/** سعر اختيار التغليف للهدية (صفر لو مفيش أو العادي) */
export const wrappingPrice = (g: Pick<CartGift, "wrapping">, settings: StoreSettings) =>
  settings.wrappings.find((w) => w.id === g.wrapping)?.price ?? 0;

export function giftTotals(g: CartGift, settings: StoreSettings): GiftTotals {
  const lines = g.lines.reduce((s, l) => s + linePrice(l) * l.quantity, 0);
  const addons = g.addons.reduce((s, l) => s + linePrice(l) * l.quantity, 0);
  const items = g.basePrice + lines + addons;
  const packaging =
    (g.kind === "box" ? packagingFee(g.basePrice + lines, settings.packaging) : 0) + wrappingPrice(g, settings);
  return { items, packaging, total: items + packaging };
}



export { isValidPhone } from "./validate";

/** الحاجات الناقصة في الهدية قبل الدفع */
/** الناقص في بيانات التوصيل (مرة واحدة للطلب كله) */
export function deliveryProblems(d: OrderDelivery, maxCardMessage = Infinity): string[] {
  const out: string[] = [];
  const e = recipientErrors(d.recipient);
  if (e.name) out.push("اسم المستلم");
  if (e.phone) out.push("رقم موبايل المستلم");
  if (e.zoneId) out.push("المنطقة");
  if (e.address) out.push("العنوان");
  if (e.landmark) out.push("العلامة المميزة");
  if (e.locationUrl) out.push("لينك اللوكيشن");
  if ((d.cardMessage ?? "").length > maxCardMessage) out.push("رسالة الكارت أطول من المسموح");
  if (!d.date) out.push("يوم التوصيل");
  if (!d.period) out.push("فترة التوصيل");
  return out;
}

/** الناقص في الهدية نفسها (التخصيص والاختيارات والكارت) */
export function giftProblems(g: CartGift, settings: StoreSettings): string[] {
  const out: string[] = [];
  for (const l of g.lines) {
    if (l.customizable && !l.customization?.trim()) out.push("نص التخصيص");
  }
  if (g.lines.some((l) => missingOptions(l.options, l.choices).length)) out.push("اختيارات المنتجات (لون/مقاس/ريحة)");
  return out;
}
